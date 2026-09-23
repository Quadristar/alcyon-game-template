/**
 * 描画の設定値。
 * docs/ARCHITECTURE.md「メモリ管理」「技術構成」の方針に合わせる。
 */
export const RENDER_CONFIG = {
  /** 背景色 */
  backgroundColor: 0x1b1e2b,
  /**
   * 描画解像度の上限。devicePixelRatio をそのまま使うと
   * 高密度な端末で GPU メモリと負荷が大きくなるため、2 で頭打ちにする
   */
  maxResolution: 2,
  /** アンチエイリアス */
  antialias: true,
} as const;
