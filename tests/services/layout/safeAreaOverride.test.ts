import { describe, expect, it } from 'vitest';
import { parseSafeAreaOverride } from '../../../src/services/layout/safeAreaOverride';

describe('parseSafeAreaOverride', () => {
  it('?safearea=上,右,下,左 を読み取る', () => {
    expect(parseSafeAreaOverride('?safearea=40,0,24,8')).toEqual({ top: 40, right: 0, bottom: 24, left: 8 });
    expect(parseSafeAreaOverride('?debug&safearea=1.5, 2 ,3,4')).toEqual({ top: 1.5, right: 2, bottom: 3, left: 4 });
  });

  it('指定がない・数が足りない・負の値・数値でない場合は null', () => {
    expect(parseSafeAreaOverride('')).toBeNull();
    expect(parseSafeAreaOverride('?safearea=1,2,3')).toBeNull();
    expect(parseSafeAreaOverride('?safearea=1,2,3,-4')).toBeNull();
    expect(parseSafeAreaOverride('?safearea=a,b,c,d')).toBeNull();
  });
});
