/**
 * ゲーム全体の設定値。ゲームごとに調整する。
 */
import type { LogicalSizes } from '../services/layout/layoutTypes';

export const GAME_CONFIG = {
  /** 向きごとの論理解像度(仮仕様: 縦 720×1280、横 1280×720) */
  logicalSizes: {
    portrait: { width: 720, height: 1280 },
    landscape: { width: 1280, height: 720 },
  } satisfies LogicalSizes,
  /** シーン切り替えのフェードアウト・フェードインそれぞれの時間(ミリ秒、仮仕様) */
  fadeDurationMs: 250,
  /** フェードの色 */
  fadeColor: 0x000000,
} as const;
