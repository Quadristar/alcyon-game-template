/**
 * URL パラメータによるセーフエリアの上書き(動作確認用)。
 *
 * 多くの端末・ブラウザでは、通常のタブ表示だとセーフエリアが 0 になり、
 * セーフエリアに沿った配置を確認できない。そこで URL に
 * `?safearea=上,右,下,左`(CSS ピクセル)を付けると、その値を使う。
 * 例: `?safearea=40,0,24,0`
 *
 * 仮仕様: Phase 2-2 のデバッグ表示を作る際に、そちらへ統合するか判断する。
 */
import type { Insets } from './layoutTypes';

/** URL の検索文字列からセーフエリアの上書き値を読む。指定がないか不正なら null */
export function parseSafeAreaOverride(search: string): Insets | null {
  const value = new URLSearchParams(search).get('safearea');
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
