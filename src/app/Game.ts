/**
 * Game: 起動処理と各層の接続。
 *
 * - Pixi Application を WebGL 固定で生成する
 * - AssetManager を作り、boot バンドルを読み込む(失敗したら起動エラー)
 * - 描画の構成(背面から順に):
 *     背景レイヤー(画面座標。余白を含む画面全体を覆う)
 *     ゲーム用ルート(論理座標。LayoutManager の拡大率と余白に合わせて拡大縮小・移動する)
 *     フェード用の覆い(画面座標。切り替え中は入力も遮る)
 *     読み込み中表示(論理座標)
 *     デバッグ表示(画面座標。?debug のときだけ)
 * - LayoutManager に画面サイズとセーフエリアを渡し、変化したら各層とシーンを配置し直す
 * - SceneManager を ticker で動かし、最初のシーンを開始する
 *
 * ゲームのルールやシーンの中身は知らない。レイアウト定義・マニフェスト・シーンは外から受け取る。
 */
import { Application, Container, Graphics, type Texture, WebGLRenderer } from 'pixi.js';
import { DebugOverlay } from '../presentation/debug/DebugOverlay';
import { parseDebugOptions } from '../presentation/debug/debugOptions';
import { countDisplayObjects } from '../presentation/debug/debugStats';
import { LoadingView } from '../presentation/loading/LoadingView';
import type { SceneRegistry } from '../presentation/scenes/Scene';
import type { AssetManager } from '../services/assets/AssetManager';
import type { AssetManifest } from '../services/assets/assetTypes';
import { LayoutManager } from '../services/layout/LayoutManager';
import type { Layout, LayoutDefinition, ScreenInput } from '../services/layout/layoutTypes';
import { SafeAreaProbe } from '../services/layout/SafeAreaProbe';
import { createAssetManager } from './createAssetManager';
import { GAME_CONFIG } from './gameConfig';
import { RENDER_CONFIG } from './renderConfig';
import { SceneManager } from './SceneManager';
import { showBootError } from './showBootError';

/** ゲームごとに渡す内容 */
export interface GameOptions<K extends string, R extends string, A extends string, M extends AssetManifest> {
  /** レイアウト定義 */
  readonly layout: LayoutDefinition<R, A>;
  /** アセットのマニフェスト */
  readonly manifest: M;
  /** キーとシーン生成関数の対応 */
  readonly scenes: SceneRegistry<K, Layout<R, A>, M>;
  /** 最初に表示するシーン */
  readonly firstScene: K;
}

export class Game<K extends string, R extends string, A extends string, M extends AssetManifest> {
  private constructor(
    readonly app: Application,
    readonly layout: LayoutManager<R, A>,
    readonly assets: AssetManager<M, Texture>,
    readonly scenes: SceneManager<K, Layout<R, A>, M>,
  ) {}

  /** ゲームを起動する。root 要素にキャンバスを追加する */
  static async start<K extends string, R extends string, A extends string, M extends AssetManifest>(
    root: HTMLElement,
    options: GameOptions<K, R, A, M>,
  ): Promise<Game<K, R, A, M>> {
    const debug = parseDebugOptions(window.location.search);

    const app = new Application();
    await app.init({
      // WebGL に固定する(配列指定にすると、列挙したレンダラ以外は使われない)。
      // WebGL が使えない端末では例外になり、main.ts でエラー表示する
      preference: ['webgl'],
      resizeTo: window,
      background: RENDER_CONFIG.backgroundColor,
      resolution: Math.min(window.devicePixelRatio || 1, RENDER_CONFIG.maxResolution),
      autoDensity: true,
      antialias: RENDER_CONFIG.antialias,
    });

    const renderer = app.renderer;
    if (!(renderer instanceof WebGLRenderer)) {
      throw new Error(`WebGL 以外のレンダラが選ばれました: ${renderer.name}`);
    }
    root.appendChild(app.canvas);

    // アセット: 起動時は boot バンドルだけを読み込む(失敗したら例外になり、main.ts でエラー表示する)
    const assets = createAssetManager(options.manifest, debug);
    const bootBundle = GAME_CONFIG.assets.bootBundle;
    if (bootBundle in options.manifest) {
      await assets.acquire(bootBundle);
    }

    // 描画の構成
    const backgroundLayer = new Container({ label: 'backgroundLayer' });
    const gameRoot = new Container({ label: 'gameRoot' });
    const fadeOverlay = new Graphics({ label: 'fadeOverlay' });
    fadeOverlay.eventMode = 'static';
    const loadingRoot = new Container({ label: 'loadingRoot' });
    const loadingView = new LoadingView();
    loadingRoot.addChild(loadingView);
    app.stage.addChild(backgroundLayer, gameRoot, fadeOverlay, loadingRoot);

    // レイアウト
    const safeAreaProbe = new SafeAreaProbe();
    const measure = (): ScreenInput => ({
      width: app.screen.width,
      height: app.screen.height,
      safeAreaInsets: debug.safeAreaOverride ?? safeAreaProbe.read(),
    });
    const layout = new LayoutManager(GAME_CONFIG.logicalSizes, options.layout, measure());

    // デバッグ表示(?debug のときだけ生成する)
    const debugOverlay = debug.enabled
      ? new DebugOverlay({
          updateIntervalMs: GAME_CONFIG.debug.updateIntervalMs,
          collect: () => ({
            textureBytes: assets.estimateBytes(),
            displayObjects: countDisplayObjects(app.stage),
            orientation: layout.current.orientation,
            logical: layout.current.logical,
            scale: layout.current.scale,
            bundles: assets.getBundleStatuses(),
            assetFailures: assets.failures.length,
          }),
        })
      : null;
    if (debugOverlay !== null) {
      app.stage.addChild(debugOverlay);
    }

    const applyLayout = (current: Layout<R, A>): void => {
      for (const logicalRoot of [gameRoot, loadingRoot]) {
        logicalRoot.scale.set(current.scale);
        logicalRoot.position.set(current.offset.x, current.offset.y);
      }
      fadeOverlay.clear().rect(0, 0, current.screen.width, current.screen.height).fill(GAME_CONFIG.fadeColor);
      loadingView.layout(current);
      debugOverlay?.layout(current);
    };
    applyLayout(layout.current);

    // シーン
    const scenes = new SceneManager<K, Layout<R, A>, M>({
      scenes: options.scenes,
      sceneLayer: gameRoot,
      backgroundLayer,
      fadeOverlay,
      fadeDurationMs: GAME_CONFIG.fadeDurationMs,
      assets,
      loading: loadingView,
      loadingDelayMs: GAME_CONFIG.loadingDelayMs,
      getLayout: () => layout.current,
      context: {
        renderer: { name: `WebGL ${renderer.context.webGLVersion}`, resolution: renderer.resolution },
        assets: { get: (bundle, key) => assets.get(bundle, key) },
      },
      onError: (error) => {
        app.ticker.stop();
        showBootError(root, error);
      },
    });

    layout.onChange((current) => {
      applyLayout(current);
      scenes.resize(current);
    });

    // Pixi は window の resize を検知してキャンバスを合わせ、その後 renderer の resize を発行する
    renderer.on('resize', () => {
      layout.update(measure());
    });
    // 端末によっては回転時に window の resize が遅れる・来ないことがあるため、
    // 画面の向きの変更でもサイズの再計算を依頼する
    const requestResize = (): void => {
      app.queueResize();
    };
    screen.orientation?.addEventListener('change', requestResize);
    window.addEventListener('orientationchange', requestResize);

    app.ticker.add((ticker) => {
      scenes.update(ticker.deltaMS);
      debugOverlay?.update(ticker.deltaMS);
    });

    scenes.start(options.firstScene);
    return new Game(app, layout, assets, scenes);
  }
}
