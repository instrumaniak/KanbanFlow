import type { LabelColor } from '../cards/cards.api';

export const LABEL_COLOR_CLASS_MAP = {
  red: `
    bg-red-100 text-red-700 border border-red-200
    dark:bg-red-500/15 dark:text-red-300 dark:border-red-500/20
  `,

  orange: `
    bg-orange-100 text-orange-800 border border-orange-200
    dark:bg-orange-500/15 dark:text-orange-300 dark:border-orange-500/20
  `,

  yellow: `
    bg-amber-100 text-amber-800 border border-amber-200
    dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/20
  `,

  green: `
    bg-emerald-100 text-emerald-800 border border-emerald-200
    dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/20
  `,

  blue: `
    bg-blue-100 text-blue-800 border border-blue-200
    dark:bg-blue-500/15 dark:text-blue-300 dark:border-blue-500/20
  `,

  purple: `
    bg-violet-100 text-violet-800 border border-violet-200
    dark:bg-violet-500/15 dark:text-violet-300 dark:border-violet-500/20
  `,
} as const satisfies Record<LabelColor, string>;

export const LABEL_COLOR_OPTIONS = [
  { value: 'red', label: 'Red', className: LABEL_COLOR_CLASS_MAP.red },
  { value: 'orange', label: 'Orange', className: LABEL_COLOR_CLASS_MAP.orange },
  { value: 'yellow', label: 'Yellow', className: LABEL_COLOR_CLASS_MAP.yellow },
  { value: 'green', label: 'Green', className: LABEL_COLOR_CLASS_MAP.green },
  { value: 'blue', label: 'Blue', className: LABEL_COLOR_CLASS_MAP.blue },
  { value: 'purple', label: 'Purple', className: LABEL_COLOR_CLASS_MAP.purple },
] as const;

export const DEFAULT_LABEL_COLOR_CLASS = `
  bg-gray-500 text-white border border-gray-600
  dark:bg-gray-500/15 dark:text-gray-300 dark:border-gray-500/20
`;

export function getLabelColorClass(color: string) {
  if (color in LABEL_COLOR_CLASS_MAP) {
    return LABEL_COLOR_CLASS_MAP[color as LabelColor];
  }

  return DEFAULT_LABEL_COLOR_CLASS;
}
