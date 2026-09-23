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
  /** シーンの読み込みがこの時間を超えたら読み込み中表示を出す(ミリ秒、仮仕様) */
  loadingDelayMs: 300,
  assets: {
    /** 起動時に読み込むバンドル。読み込めなければ起動エラーにする */
    bootBundle: 'boot',
    /** 読み込み失敗時の再試行の回数(初回を除く、仮仕様) */
    retryCount: 2,
    /** 再試行までの待ち時間(ミリ秒、仮仕様) */
    retryDelayMs: 500,
  },
  debug: {
    /** デバッグ表示の更新間隔(ミリ秒)。毎フレームは更新しない */
    updateIntervalMs: 250,
  },
} as const;
