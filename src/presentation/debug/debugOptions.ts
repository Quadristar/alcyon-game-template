/**
 * デバッグ用の URL パラメータを読み取る。
 *
 * `?debug` を付けたときだけ有効になり、次のパラメータを併用できる(仮仕様)。
 * - `safearea=上,右,下,左` … セーフエリアを上書きする(CSS ピクセル)。例: `?debug&safearea=40,0,24,0`
 * - `assetfail=バンドル名,…` … 指定したバンドルの読み込みをわざと失敗させる(代わりの画像の確認用)
 * - `assetdelay=ミリ秒` … アセット1つごとに読み込みを遅らせる(読み込み中表示の確認用)
 *
 * `?debug` がなければ、ほかのパラメータはすべて無視する(通常のプレイに影響させないため)。
 */
import type { Insets } from '../../services/layout/layoutTypes';

export interface DebugOptions {
  /** デバッグ表示を出すか */
  readonly enabled: boolean;
  /** セーフエリアの上書き値(指定がなければ null) */
  readonly safeAreaOverride: Insets | null;
  /** 読み込みを失敗させるバンドル */
  readonly assetFailBundles: readonly string[];
  /** アセット1つごとの追加の待ち時間(ミリ秒) */
  readonly assetDelayMs: number;
}

/** assetdelay の上限(ミリ秒)。誤って極端な値を入れても操作不能にならないようにする */
const MAX_ASSET_DELAY_MS = 10_000;

export const DEBUG_DISABLED: DebugOptions = {
  enabled: false,
  safeAreaOverride: null,
  assetFailBundles: [],
  assetDelayMs: 0,
};

/** URL の検索文字列(location.search)からデバッグ設定を読み取る */
export function parseDebugOptions(search: string): DebugOptions {
  const params = new URLSearchParams(search);
  if (!params.has('debug')) {
    return DEBUG_DISABLED;
  }
  return {
    enabled: true,
    safeAreaOverride: parseInsets(params.get('safearea')),
    assetFailBundles: parseList(params.get('assetfail')),
    assetDelayMs: parseDelay(params.get('assetdelay')),
  };
}

/** "上,右,下,左" を読み取る。数が足りない・負の値・数値でない場合は null */
function parseInsets(value: string | null): Insets | null {
  if (value === null) {
    return null;
  }
  const parts = value.split(',').map((part) => Number(part.trim()));
  if (parts.length !== 4 || parts.some((n) => !Number.isFinite(n) || n < 0)) {
    return null;
  }
  const [top, right, bottom, left] = parts as [number, number, number, number];
  return { top, right, bottom, left };
}

function parseList(value: string | null): string[] {
  if (value === null) {
    return [];
  }
  return value
    .split(',')
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}

function parseDelay(value: string | null): number {
  const n = Number(value ?? 0);
  return Number.isFinite(n) && n > 0 ? Math.min(n, MAX_ASSET_DELAY_MS) : 0;
}
