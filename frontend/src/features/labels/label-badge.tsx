import type { Label } from '../cards/cards.api';
import { X } from 'lucide-react';

const labelColorMap: Record<string, string> = {
  red: 'bg-rose-500',
  orange: 'bg-orange-500',
  yellow: 'bg-yellow-500',
  green: 'bg-green-500',
  blue: 'bg-blue-500',
  purple: 'bg-purple-500',
};

interface LabelBadgeProps {
  label: Label;
  className?: string;
  onRemove?: () => void;
}

export function LabelBadge({ label, className = '', onRemove }: LabelBadgeProps) {
  const colorClass = labelColorMap[label.color] ?? 'bg-gray-500';

  return (
    <span
      className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium text-white ${colorClass} ${className}`}
      title={label.name}
    >
      {label.name}
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-0.5 rounded-full p-0.5 hover:bg-white/20 focus:outline-none focus:ring-1 focus:ring-white"
          aria-label={`Remove ${label.name}`}
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </span>
  );
}
