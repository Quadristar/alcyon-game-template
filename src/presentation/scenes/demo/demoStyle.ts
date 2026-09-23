/**
 * デモシーンの見た目の設定値。
 */
export const DEMO_STYLE = {
  fontFamily: 'system-ui, sans-serif',
  titleFontSize: 72,
  hintFontSize: 32,
  labelFontSize: 22,
  infoFontSize: 24,
  infoLineHeight: 34,
  /** info 領域の内側の余白 */
  infoPadding: 16,
  textColor: 0xffffff,
  subTextColor: 0xb8c0d8,
  /** 枠線の太さ(論理座標) */
  lineWidth: 3,
  /** 基準点の半径(論理座標) */
  anchorRadius: 8,
  /** ラベルと枠線・点の間隔 */
  labelPadding: 6,
  sceneA: {
    /** 余白を含む画面全体の色 */
    screenColor: 0x12141d,
    /** 論理解像度の範囲の色 */
    logicalColor: 0x1b1e2b,
    logicalBorderColor: 0x4a5070,
    safeAreaColor: 0x3ddc84,
    regionColor: 0xffc857,
    anchorColor: 0xff6b9a,
  },
  sceneB: {
    screenColor: 0x0e2a2a,
    logicalColor: 0x164040,
    accentColor: 0x6be3d0,
    /** 回る四角の一辺と回転速度(ラジアン/秒) */
    squareSize: 160,
    rotationSpeed: 1.5,
  },
} as const;
