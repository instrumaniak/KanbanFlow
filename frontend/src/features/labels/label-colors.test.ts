import { describe, it, expect } from 'vitest';
import {
  DEFAULT_LABEL_COLOR_CLASS,
  LABEL_COLOR_CLASS_MAP,
  LABEL_COLOR_OPTIONS,
  getLabelColorClass,
} from './label-colors';

describe('label colors', () => {
  it('maps each label color to a Tailwind class', () => {
    expect(LABEL_COLOR_CLASS_MAP.red).toContain('bg-red-100');
    expect(LABEL_COLOR_CLASS_MAP.red).toContain('text-red-700');
    expect(LABEL_COLOR_CLASS_MAP.red).toContain('dark:bg-red-500/15');
    expect(LABEL_COLOR_CLASS_MAP.red).toContain('dark:text-red-300');

    expect(LABEL_COLOR_CLASS_MAP.orange).toContain('bg-orange-100');
    expect(LABEL_COLOR_CLASS_MAP.orange).toContain('text-orange-800');

    expect(LABEL_COLOR_CLASS_MAP.yellow).toContain('bg-amber-100');
    expect(LABEL_COLOR_CLASS_MAP.yellow).toContain('text-amber-800');

    expect(LABEL_COLOR_CLASS_MAP.green).toContain('bg-emerald-100');
    expect(LABEL_COLOR_CLASS_MAP.green).toContain('text-emerald-800');

    expect(LABEL_COLOR_CLASS_MAP.blue).toContain('bg-blue-100');
    expect(LABEL_COLOR_CLASS_MAP.blue).toContain('text-blue-800');

    expect(LABEL_COLOR_CLASS_MAP.purple).toContain('bg-violet-100');
    expect(LABEL_COLOR_CLASS_MAP.purple).toContain('text-violet-800');
  });

  it('exposes picker options from the shared palette', () => {
    expect(LABEL_COLOR_OPTIONS.map((option) => option.value)).toEqual([
      'red',
      'orange',
      'yellow',
      'green',
      'blue',
      'purple',
    ]);
    expect(LABEL_COLOR_OPTIONS.map((option) => option.className)).toEqual([
      LABEL_COLOR_CLASS_MAP.red,
      LABEL_COLOR_CLASS_MAP.orange,
      LABEL_COLOR_CLASS_MAP.yellow,
      LABEL_COLOR_CLASS_MAP.green,
      LABEL_COLOR_CLASS_MAP.blue,
      LABEL_COLOR_CLASS_MAP.purple,
    ]);
  });

  it('falls back to gray for unknown colors', () => {
    expect(getLabelColorClass('not-a-color')).toBe(DEFAULT_LABEL_COLOR_CLASS);
    expect(DEFAULT_LABEL_COLOR_CLASS).toContain('bg-gray-500');
    expect(DEFAULT_LABEL_COLOR_CLASS).toContain('text-white');
  });
});
