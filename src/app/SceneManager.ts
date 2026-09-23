/**
 * SceneManager: シーンの生成・切り替え・破棄を管理する。
 *
 * 切り替えの流れ(フェードは fadeOverlay の alpha を ticker の経過時間で変える):
 *   フェードアウト → 旧シーンの exit と破棄 → 新シーンの生成・enter → resize → フェードイン
 *
 * 切り替え中に別の切り替え要求が来た場合(仮仕様):
 * - フェードアウト中: 行き先を新しい要求で上書きする(最新の要求を優先)
 * - enter の完了待ち・フェードイン中: 最新の要求を1つだけ保留し、フェードイン完了後に切り替える
 * - 切り替え中でないとき、現在のシーンと同じキーの要求は無視する
 *
 * 画面の回転などで resize() が呼ばれたら、進行中のフェードを即座に完了させてから
 * シーンの resize を呼ぶ。
 */
import type { Container } from 'pixi.js';
import type { Layout } from '../services/layout/layoutTypes';
import type { Scene, SceneContext, SceneRegistry } from '../presentation/scenes/Scene';

export interface SceneManagerOptions<K extends string, L extends Layout> {
  /** キーとシーン生成関数の対応 */
  readonly scenes: SceneRegistry<K, L>;
  /** シーンの root を追加する先(論理座標のゲーム用ルート) */
  readonly sceneLayer: Container;
  /** シーンの background を追加する先(画面座標の背景レイヤー) */
  readonly backgroundLayer: Container;
  /** フェード用の覆い。alpha と visible を SceneManager が操作する */
  readonly fadeOverlay: Container;
  /** フェードアウト・フェードインそれぞれの時間(ミリ秒) */
  readonly fadeDurationMs: number;
  /** 現在のレイアウトを返す */
  readonly getLayout: () => L;
  /** シーンに渡す共通の情報(changeScene 以外) */
  readonly context: Omit<SceneContext<K>, 'changeScene'>;
  /** シーンの enter などで例外が起きたときの処理 */
  readonly onError: (error: unknown) => void;
}

/** 切り替えの段階 */
type Phase = 'idle' | 'fadeOut' | 'entering' | 'fadeIn';

interface ActiveScene<K extends string, L extends Layout> {
  readonly key: K;
  readonly scene: Scene<L>;
  /** 最後に resize() に渡したレイアウト(同じレイアウトで二重に呼ばないため) */
  layout: L | null;
}

export class SceneManager<K extends string, L extends Layout = Layout> {
  private active: ActiveScene<K, L> | null = null;
  private phase: Phase = 'idle';
  private elapsedMs = 0;
  /** フェードアウト後に切り替える先 */
  private target: K | null = null;
  /** 切り替え中に来た次の要求(最新の1つだけ) */
  private queued: K | null = null;
  /** enter の完了待ち中に回転した場合、フェードインを省略する */
  private skipFadeIn = false;
  private readonly context: SceneContext<K>;

  constructor(private readonly options: SceneManagerOptions<K, L>) {
    this.context = { ...options.context, changeScene: (key) => this.change(key) };
    this.setOverlay(1);
  }

  /** 現在のシーンのキー(まだない場合は null) */
  get currentKey(): K | null {
    return this.active?.key ?? null;
  }

  /** 切り替え中かどうか */
  get isTransitioning(): boolean {
    return this.phase !== 'idle';
  }

  /** 最初のシーンを開始する(暗転した状態から、フェードインで表示する) */
  start(key: K): void {
    if (this.active !== null || this.phase !== 'idle') {
      throw new Error('SceneManager.start は最初の1回だけ呼べます');
    }
    this.target = key;
    this.swap();
  }

  /** シーンを切り替える。扱いはファイル先頭のコメントを参照 */
  change(key: K): void {
    switch (this.phase) {
      case 'idle':
        if (this.active?.key === key) {
          return;
        }
        this.target = key;
        this.phase = 'fadeOut';
        this.elapsedMs = 0;
        this.setOverlay(0);
        return;
      case 'fadeOut':
        this.target = key;
        return;
      case 'entering':
      case 'fadeIn':
        this.queued = key;
        return;
    }
  }

  /** 毎フレーム呼ぶ。現在のシーンの update とフェードを進める */
  update(deltaMs: number): void {
    if (this.active !== null && this.phase !== 'entering') {
      this.active.scene.update(deltaMs);
    }
    if (this.phase === 'fadeOut') {
      this.elapsedMs += deltaMs;
      const t = this.progress();
      this.setOverlay(t);
      if (t >= 1) {
        this.swap();
      }
    } else if (this.phase === 'fadeIn') {
      this.elapsedMs += deltaMs;
      const t = this.progress();
      this.setOverlay(1 - t);
      if (t >= 1) {
        this.finishFadeIn();
      }
    }
  }

  /**
   * レイアウトが変わったときに呼ぶ。
   * 進行中のフェードを即座に完了させてから、現在のシーンの resize を呼ぶ。
   */
  resize(layout: L): void {
    this.completeTransition();
    this.resizeActive(layout);
  }

  /** 現在のシーンを終了・破棄する(ゲームの終了時用) */
  destroy(): void {
    if (this.active !== null) {
      this.disposeScene(this.active.scene);
      this.active = null;
    }
    this.phase = 'idle';
    this.target = null;
    this.queued = null;
    this.skipFadeIn = false;
  }

  /** 進行中のフェードを即座に完了させる */
  private completeTransition(): void {
    if (this.phase === 'fadeOut') {
      this.swap();
    }
    if (this.phase === 'entering') {
      // enter の完了を待っている間は完了させられないため、完了時にフェードインを省略する
      this.skipFadeIn = true;
      return;
    }
    if (this.phase === 'fadeIn') {
      this.finishFadeIn();
    }
  }

  /** 旧シーンを終了・破棄し、新シーンを生成して enter を呼ぶ */
  private swap(): void {
    const key = this.target;
    this.target = null;
    if (key === null) {
      return;
    }
    if (this.active !== null) {
      this.disposeScene(this.active.scene);
      this.active = null;
    }
    this.setOverlay(1);
    this.phase = 'entering';
    this.elapsedMs = 0;

    let scene: Scene<L>;
    let entered: void | Promise<void>;
    try {
      scene = this.options.scenes[key](this.context);
      this.options.sceneLayer.addChild(scene.root);
      if (scene.background !== undefined) {
        this.options.backgroundLayer.addChild(scene.background);
      }
      this.active = { key, scene, layout: null };
      entered = scene.enter();
    } catch (error) {
      this.options.onError(error);
      return;
    }

    if (entered instanceof Promise) {
      entered.then(
        () => this.afterEnter(scene),
        (error: unknown) => this.options.onError(error),
      );
    } else {
      this.afterEnter(scene);
    }
  }

  /** enter の完了後: 配置してフェードインを始める */
  private afterEnter(scene: Scene<L>): void {
    // 待っている間に破棄された場合は何もしない
    if (this.active?.scene !== scene || this.phase !== 'entering') {
      return;
    }
    this.phase = 'fadeIn';
    this.elapsedMs = 0;
    this.resizeActive(this.options.getLayout());
    if (this.skipFadeIn) {
      this.skipFadeIn = false;
      this.finishFadeIn();
    }
  }

  /** フェードインを終える。保留中の要求があれば、次の切り替え(フェードアウト)を始める */
  private finishFadeIn(): void {
    this.phase = 'idle';
    this.elapsedMs = 0;
    this.setOverlay(0);
    const next = this.queued;
    this.queued = null;
    if (next !== null) {
      this.change(next);
    }
  }

  private resizeActive(layout: L): void {
    const active = this.active;
    if (active === null || this.phase === 'entering' || active.layout === layout) {
      return;
    }
    active.layout = layout;
    active.scene.resize(layout);
  }

  /** シーンの exit を呼び、表示物を子要素ごと確実に破棄する */
  private disposeScene(scene: Scene<L>): void {
    try {
      scene.exit();
    } catch (error) {
      this.options.onError(error);
    } finally {
      scene.root.destroy({ children: true });
      scene.background?.destroy({ children: true });
    }
  }

  private progress(): number {
    const duration = this.options.fadeDurationMs;
    return duration <= 0 ? 1 : Math.min(1, this.elapsedMs / duration);
  }

  private setOverlay(alpha: number): void {
    this.options.fadeOverlay.alpha = alpha;
    this.options.fadeOverlay.visible = alpha > 0;
  }
}
