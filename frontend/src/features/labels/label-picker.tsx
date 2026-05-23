import { useState } from 'react';
import type { Label, Card } from '../cards/cards.api';
import { useLabels } from './use-labels';
import { useAssignCardLabel, useRemoveCardLabel } from '../cards/use-cards';
import { useToast } from '@/components/ui/use-toast';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LabelPickerProps {
  card: Card;
}

export function LabelPicker({ card }: LabelPickerProps) {
  const { data: labels, isLoading } = useLabels();
  const assignLabel = useAssignCardLabel();
  const removeLabel = useRemoveCardLabel();
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);

  const cardLabelIds = new Set(card.labels?.map((l) => l.id) ?? []);

  const handleToggle = (label: Label) => {
    if (cardLabelIds.has(label.id)) {
      removeLabel.mutate(
        { cardId: card.id, labelId: label.id },
        {
          onError: () => {
            toast({ title: 'Failed to remove label', variant: 'destructive' });
          },
        },
      );
    } else {
      assignLabel.mutate(
        { cardId: card.id, labelId: label.id },
        {
          onError: () => {
            toast({ title: 'Failed to assign label', variant: 'destructive' });
          },
        },
      );
    }
  };

  if (isLoading) {
    return <p className="text-muted-foreground text-sm">Loading labels...</p>;
  }

  if (!labels || labels.length === 0) {
    return (
      <div className="space-y-2">
        <p className="text-muted-foreground text-sm">No labels available.</p>
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs"
          onClick={() => setIsCreating(true)}
        >
          <Plus className="mr-1 h-3 w-3" />
          Create Label
        </Button>
        {isCreating && (
          <p className="text-xs text-muted-foreground">
            Label creation UI coming soon.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {labels.map((label) => {
          const isAssigned = cardLabelIds.has(label.id);
          return (
            <button
              key={label.id}
              type="button"
              onClick={() => handleToggle(label)}
              className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium text-white transition-opacity hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-ring ${
                isAssigned ? 'opacity-100 ring-2 ring-ring' : 'opacity-50'
              }`}
              style={{ backgroundColor: label.color }}
              title={isAssigned ? `Remove ${label.name}` : `Add ${label.name}`}
              disabled={assignLabel.isPending || removeLabel.isPending}
            >
              {label.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
