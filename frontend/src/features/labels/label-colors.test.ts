import { describe, it, expect } from 'vitest';
import {
  DEFAULT_LABEL_COLOR_CLASS,
  LABEL_COLOR_CLASS_MAP,
  LABEL_COLOR_OPTIONS,
  getLabelColorClass,
} from './label-colors';

describe('label colors', () => {
  it('maps each label color to a Tailwind class', () => {
    expect(LABEL_COLOR_CLASS_MAP).toEqual({
      red: 'bg-rose-500',
      orange: 'bg-orange-500',
      yellow: 'bg-yellow-500',
      green: 'bg-green-500',
      blue: 'bg-blue-500',
      purple: 'bg-purple-500',
    });
  });

  it('exposes picker options from the shared palette', () => {
    expect(LABEL_COLOR_OPTIONS.map((option) => option.className)).toEqual([
      'bg-rose-500',
      'bg-orange-500',
      'bg-yellow-500',
      'bg-green-500',
      'bg-blue-500',
      'bg-purple-500',
    ]);
  });

  it('falls back to gray for unknown colors', () => {
    expect(getLabelColorClass('not-a-color')).toBe(DEFAULT_LABEL_COLOR_CLASS);
  });
});
