/**
 * 起動確認画面(Phase 1)。
 *
 * 中央に「Phase 1 OK」、左上にレンダラ名・画面サイズ・devicePixelRatio・画面の向きを表示する。
 *
 * 仮仕様: レイアウト定義(services/layout)は Phase 2 で作るため、
 * それまでは画面サイズから中央と左上の余白を計算して配置する。
 */
import { Container, Text } from 'pixi.js';

/** 表示する環境情報 */
export interface BootCheckInfo {
  /** 使用中のレンダラ名(例: "WebGL 2") */
  rendererName: string;
  /** 画面の幅(CSS ピクセル) */
  screenWidth: number;
  /** 画面の高さ(CSS ピクセル) */
  screenHeight: number;
  /** 端末の devicePixelRatio */
  devicePixelRatio: number;
  /** 実際の描画解像度(devicePixelRatio に上限をかけた値) */
  resolution: number;
  /** 画面の向き */
  orientation: 'portrait' | 'landscape';
}

/** 見た目の設定値 */
const STYLE = {
  titleText: 'Phase 1 OK',
  titleFontSize: 48,
  titleColor: 0xffffff,
  infoFontSize: 14,
  infoColor: 0xb8c0d8,
  infoLineHeight: 20,
  /** 情報表示の画面端からの余白 */
  infoMargin: 12,
  fontFamily: 'system-ui, sans-serif',
} as const;

const ORIENTATION_LABEL: Record<BootCheckInfo['orientation'], string> = {
  portrait: '縦',
  landscape: '横',
};

export class BootCheckView extends Container {
  private readonly title: Text;
  private readonly info: Text;

  constructor() {
    super();
    this.title = new Text({
      text: STYLE.titleText,
      style: {
        fontFamily: STYLE.fontFamily,
        fontSize: STYLE.titleFontSize,
        fontWeight: 'bold',
        fill: STYLE.titleColor,
      },
    });
    this.title.anchor.set(0.5);

    this.info = new Text({
      text: '',
      style: {
        fontFamily: STYLE.fontFamily,
        fontSize: STYLE.infoFontSize,
        lineHeight: STYLE.infoLineHeight,
        fill: STYLE.infoColor,
      },
    });

    this.addChild(this.title, this.info);
  }

  /** 画面サイズに合わせて配置し直す */
  layout(screenWidth: number, screenHeight: number): void {
    this.title.position.set(screenWidth / 2, screenHeight / 2);
    this.info.position.set(STYLE.infoMargin, STYLE.infoMargin);
  }

  /** 環境情報の表示を更新する */
  setInfo(info: BootCheckInfo): void {
    this.info.text = [
      `Renderer: ${info.rendererName}`,
      `Screen: ${Math.round(info.screenWidth)} × ${Math.round(info.screenHeight)}`,
      `devicePixelRatio: ${formatNumber(info.devicePixelRatio)} (描画解像度 ${formatNumber(info.resolution)})`,
      `Orientation: ${ORIENTATION_LABEL[info.orientation]}`,
    ].join('\n');
  }
}

/** 小数を最大2桁で表示する */
function formatNumber(value: number): string {
  return String(Math.round(value * 100) / 100);
}
