/**
 * デモシーンB: 別の色の簡単な画面。
 * バンドル demoB の画像が中央で回り続ける(update が毎フレーム呼ばれていることの確認用)。
 * 画面をタップするとデモシーンAへ戻る。
 */
import { Container, Graphics, Sprite, Text } from 'pixi.js';
import type { Scene, SceneContext } from '../Scene';
import type { DemoManifest } from './demoAssets';
import type { DemoLayout } from './demoLayout';
import { fitPicture } from './fitPicture';
import { DEMO_STYLE } from './demoStyle';
import type { DemoSceneKey } from './demoSceneKeys';

const S = DEMO_STYLE;
const COLORS = S.sceneB;

export class DemoSceneB implements Scene<DemoLayout, DemoManifest> {
  readonly bundles = ['demoB'] as const;
  readonly root = new Container({ label: 'DemoSceneB' });
  readonly background = new Graphics({ label: 'DemoSceneB.background' });

  private readonly logicalArea = new Graphics();
  private picture: Sprite | null = null;
  private readonly title = new Text({
    text: 'Demo B',
    style: { fontFamily: S.fontFamily, fontSize: S.titleFontSize, fill: S.textColor },
  });
  private readonly hint = new Text({
    text: 'タップで Demo A へ',
    style: { fontFamily: S.fontFamily, fontSize: S.hintFontSize, fill: S.textColor },
  });

  constructor(private readonly context: SceneContext<DemoSceneKey, DemoManifest>) {}

  enter(): void {
    this.picture = new Sprite(this.context.assets.get('demoB', 'shapes'));
    this.picture.anchor.set(0.5);
    this.title.anchor.set(0.5);
    this.hint.anchor.set(0.5);
    this.root.addChild(this.logicalArea, this.picture, this.title, this.hint);

    this.background.eventMode = 'static';
    this.background.cursor = 'pointer';
    this.background.on('pointertap', () => this.context.changeScene('demoA'));
  }

  exit(): void {
    this.background.removeAllListeners();
  }

  update(deltaMs: number): void {
    if (this.picture !== null) {
      this.picture.rotation += (COLORS.rotationSpeed * deltaMs) / 1000;
    }
  }

  resize(layout: DemoLayout): void {
    this.background.clear().rect(0, 0, layout.screen.width, layout.screen.height).fill(COLORS.screenColor);
    this.logicalArea.clear().rect(0, 0, layout.logical.width, layout.logical.height).fill(COLORS.logicalColor);

    const { center, picture, hint } = layout.anchors;
    if (this.picture !== null) {
      fitPicture(this.picture, center, layout.regions.main, S.pictureRatio);
    }
    this.title.position.set(picture.x, picture.y);
    this.hint.position.set(hint.x, hint.y);
  }
}
