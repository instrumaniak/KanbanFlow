import { useMemo } from 'react';
import type { Card as CardType } from './use-cards';
import type { ReactNode } from 'react';
import { LabelBadge } from '../labels/label-badge';
import { getDueDateBadge } from './date-utils';
import { ProgressBar } from '../checklists/progress-bar';

interface CardPreviewProps {
  card: CardType;
  actions?: ReactNode;
}

export function CardPreview({ card, actions }: CardPreviewProps) {
  const dueDateBadge = useMemo(
    () => getDueDateBadge(card.due_date),
    [card.due_date],
  );

  return (
    <>
      <div className="flex items-start justify-between gap-2">
        <span className="flex-1 break-words">{card.title}</span>
        {actions ? <div className="shrink-0">{actions}</div> : null}
      </div>

      {card.description?.trim() && (
        <p
          className="mt-1 overflow-hidden whitespace-pre-wrap text-ellipsis text-xs text-muted-foreground"
          style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}
        >
          {card.description}
        </p>
      )}

      {card.labels && card.labels.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {card.labels.slice(0, 3).map((label) => (
            <LabelBadge key={label.id} label={label} />
          ))}
          {card.labels.length > 3 && (
            <span className="inline-flex items-center rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              +{card.labels.length - 3}
            </span>
          )}
        </div>
      )}

      {dueDateBadge && (
        <span
          className={`mt-2 inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${dueDateBadge.className}`}
          aria-label={`Due date: ${dueDateBadge.text}`}
        >
          {dueDateBadge.text}
        </span>
      )}

      {card.checklist_progress && (
        <div className="mt-2 flex items-center gap-2">
          <ProgressBar
            completed={card.checklist_progress.completed}
            total={card.checklist_progress.total}
            className="w-16 shrink-0"
          />
          <span className="text-xs text-muted-foreground">
            {card.checklist_progress.completed}/{card.checklist_progress.total} (
            {card.checklist_progress.percent}%)
          </span>
        </div>
      )}
    </>
  );
}
