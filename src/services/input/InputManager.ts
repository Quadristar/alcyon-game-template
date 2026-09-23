/**
 * InputManager: 入力元(ポインタなど)からの入力を判定し、論理座標にして通知する。
 *
 * - 判定は GestureRecognizer が行う。しきい値は画面座標(指の実際の移動量)で判定し、
 *   通知する位置は toLogical で論理座標に変換する
 * - 一時停止: pause() は再開用の関数を返す。停止要求の数を数え、すべて再開されたら受け付けを再開する
 *   (シーン切り替え中や演出中など、複数の箇所から同時に止められる)。
 *   停止した時点で操作中だった指は取り消し(cancel を通知)する
 * - DOM には依存しない。DOM のイベントは attachPointerInput() がこのクラスに渡す
 *
 * キーボードを追加するときは、入力元を足し、InputEvent に種類を足して emit() で通知する。
 */
import type { Point } from '../layout/layoutTypes';
import { type Gesture, GestureRecognizer } from './GestureRecognizer';
import type { GestureThresholds, InputEvent, InputListener } from './inputTypes';

export interface InputManagerOptions {
  readonly thresholds: GestureThresholds;
  /** 画面座標を論理座標に変換する(LayoutManager の現在のレイアウトを使う) */
  readonly toLogical: (point: Point) => Point;
}

export class InputManager {
  private readonly listeners = new Set<InputListener>();
  private readonly recognizer: GestureRecognizer;
  private pauseCount = 0;

  constructor(private readonly options: InputManagerOptions) {
    this.recognizer = new GestureRecognizer(options.thresholds, (gesture) => this.dispatch(gesture));
  }

  /** 一時停止中か */
  get isPaused(): boolean {
    return this.pauseCount > 0;
  }

  /** 入力を受け取る。戻り値の関数を呼ぶと解除する */
  on(listener: InputListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * 入力を一時停止する。戻り値の関数を呼ぶと、この停止要求を取り下げる(2回目以降の呼び出しは無視)。
   * すべての停止要求が取り下げられたら再開する。
   */
  pause(): () => void {
    this.pauseCount += 1;
    if (this.pauseCount === 1) {
      this.recognizer.cancel();
    }
    let released = false;
    return () => {
      if (released) {
        return;
      }
      released = true;
      this.pauseCount -= 1;
    };
  }

  // ---- 入力元から呼ぶ(座標は画面座標、時刻はミリ秒) ----

  pointerDown(id: number, position: Point, time: number): void {
    if (!this.isPaused) {
      this.recognizer.down(id, position, time);
    }
  }

  pointerMove(id: number, position: Point): void {
    this.recognizer.move(id, position);
  }

  pointerUp(id: number, position: Point, time: number): void {
    this.recognizer.up(id, position, time);
  }

  pointerCancel(id: number): void {
    this.recognizer.cancel(id);
  }

  /** 判定結果を論理座標にして通知する */
  private dispatch(gesture: Gesture): void {
    const toLogical = this.options.toLogical;
    let event: InputEvent;
    switch (gesture.type) {
      case 'tap':
        event = { type: 'tap', position: toLogical(gesture.position) };
        break;
      case 'dragstart':
        event = { type: 'dragstart', start: toLogical(gesture.start), position: toLogical(gesture.position) };
        break;
      case 'dragmove': {
        const position = toLogical(gesture.position);
        const previous = toLogical(gesture.previous);
        event = {
          type: 'dragmove',
          start: toLogical(gesture.start),
          position,
          delta: { x: position.x - previous.x, y: position.y - previous.y },
        };
        break;
      }
      case 'dragend':
        event = { type: 'dragend', start: toLogical(gesture.start), position: toLogical(gesture.position) };
        break;
      case 'swipe':
        event = { type: 'swipe', start: toLogical(gesture.start), end: toLogical(gesture.end), direction: gesture.direction };
        break;
      case 'cancel':
        event = { type: 'cancel' };
        break;
    }
    for (const listener of [...this.listeners]) {
      listener(event);
    }
  }
}
