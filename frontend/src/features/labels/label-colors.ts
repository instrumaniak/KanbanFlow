import type { LabelColor } from '../cards/cards.api';

export const LABEL_COLOR_CLASS_MAP = {
  red: 'bg-rose-500',
  orange: 'bg-orange-500',
  yellow: 'bg-yellow-500',
  green: 'bg-green-500',
  blue: 'bg-blue-500',
  purple: 'bg-purple-500',
} as const satisfies Record<LabelColor, string>;

export const LABEL_COLOR_OPTIONS = [
  { value: 'red', label: 'Red', className: LABEL_COLOR_CLASS_MAP.red },
  { value: 'orange', label: 'Orange', className: LABEL_COLOR_CLASS_MAP.orange },
  { value: 'yellow', label: 'Yellow', className: LABEL_COLOR_CLASS_MAP.yellow },
  { value: 'green', label: 'Green', className: LABEL_COLOR_CLASS_MAP.green },
  { value: 'blue', label: 'Blue', className: LABEL_COLOR_CLASS_MAP.blue },
  { value: 'purple', label: 'Purple', className: LABEL_COLOR_CLASS_MAP.purple },
] as const;

export const DEFAULT_LABEL_COLOR_CLASS = 'bg-gray-500';

export function getLabelColorClass(color: string) {
  if (color in LABEL_COLOR_CLASS_MAP) {
    return LABEL_COLOR_CLASS_MAP[color as LabelColor];
  }

  return DEFAULT_LABEL_COLOR_CLASS;
}
