import type { Label } from '../cards/cards.api';

interface LabelBadgeProps {
  label: Label;
  className?: string;
}

export function LabelBadge({ label, className = '' }: LabelBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium text-white ${className}`}
      style={{ backgroundColor: label.color }}
      title={label.name}
    >
      {label.name}
    </span>
  );
}
