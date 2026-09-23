/**
 * デモシーンB: 別の色の簡単な画面。
 * 中央で四角が回り続ける(update が毎フレーム呼ばれていることの確認用)。
 * 画面をタップするとデモシーンAへ戻る。
 */
import { Container, Graphics, Text } from 'pixi.js';
import type { Scene, SceneContext } from '../Scene';
import type { DemoLayout } from './demoLayout';
import { DEMO_STYLE } from './demoStyle';
import type { DemoSceneKey } from './demoSceneKeys';

const S = DEMO_STYLE;
const COLORS = S.sceneB;

export class DemoSceneB implements Scene<DemoLayout> {
  readonly root = new Container({ label: 'DemoSceneB' });
  readonly background = new Graphics({ label: 'DemoSceneB.background' });

  private readonly logicalArea = new Graphics();
  private readonly square = new Graphics();
  private readonly title = new Text({
    text: 'Demo B',
    style: { fontFamily: S.fontFamily, fontSize: S.titleFontSize, fill: S.textColor },
  });
  private readonly hint = new Text({
    text: 'タップで Demo A へ',
    style: { fontFamily: S.fontFamily, fontSize: S.hintFontSize, fill: S.textColor },
  });

  constructor(private readonly context: SceneContext<DemoSceneKey>) {}

  enter(): void {
    const half = COLORS.squareSize / 2;
    this.square.rect(-half, -half, COLORS.squareSize, COLORS.squareSize).fill(COLORS.accentColor);
    this.title.anchor.set(0.5);
    this.hint.anchor.set(0.5);
    this.root.addChild(this.logicalArea, this.square, this.title, this.hint);

    this.background.eventMode = 'static';
    this.background.cursor = 'pointer';
    this.background.on('pointertap', () => this.context.changeScene('demoA'));
  }

  exit(): void {
    this.background.removeAllListeners();
  }

  update(deltaMs: number): void {
    this.square.rotation += (COLORS.rotationSpeed * deltaMs) / 1000;
  }

  resize(layout: DemoLayout): void {
    this.background.clear().rect(0, 0, layout.screen.width, layout.screen.height).fill(COLORS.screenColor);
    this.logicalArea.clear().rect(0, 0, layout.logical.width, layout.logical.height).fill(COLORS.logicalColor);

    const { center, hint } = layout.anchors;
    this.square.position.set(center.x, center.y);
    // タイトルは四角の上に置く
    this.title.position.set(center.x, center.y - COLORS.squareSize);
    this.hint.position.set(hint.x, hint.y);
  }
}
