import { useState, useCallback, useRef, useEffect } from 'react';
import { useUpdateCard, type Card as CardType } from './use-cards';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';

interface CardDetailPanelProps {
  card: CardType;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CardDetailPanel({ card, open, onOpenChange }: CardDetailPanelProps) {
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description ?? '');
  const [isSavingTitle, setIsSavingTitle] = useState(false);
  const [isSavingDescription, setIsSavingDescription] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const updateCard = useUpdateCard();

  useEffect(() => {
    setTitle(card.title);
    setDescription(card.description ?? '');
  }, [card.title, card.description, card.id]);

  const handleTitleBlur = useCallback(() => {
    const trimmed = title.trim();
    if (trimmed === '') {
      setTitle(card.title);
      return;
    }
    if (trimmed !== card.title) {
      setIsSavingTitle(true);
      updateCard.mutate(
        { id: card.id, data: { title: trimmed } },
        {
          onSettled: () => setIsSavingTitle(false),
        },
      );
    }
  }, [title, card.title, card.id, updateCard]);

  const handleDescriptionBlur = useCallback(() => {
    const newValue = description.trim();
    const oldValue = (card.description ?? '').trim();
    if (newValue !== oldValue) {
      setIsSavingDescription(true);
      updateCard.mutate(
        { id: card.id, data: { description: newValue || null } },
        {
          onSettled: () => setIsSavingDescription(false),
        },
      );
    }
  }, [description, card.description, card.id, updateCard]);

  const formattedDueDate = card.due_date
    ? new Date(card.due_date).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-[400px] sm:w-[540px] p-0"
        aria-label="Card details"
      >
        <ScrollArea className="h-full">
          <div className="p-6 space-y-6">
            <SheetHeader className="space-y-4 text-left">
              <div className="space-y-2">
                <label htmlFor="card-title" className="text-sm font-medium">
                  Title
                </label>
                <input
                  id="card-title"
                  ref={titleInputRef}
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={handleTitleBlur}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      (e.target as HTMLInputElement).blur();
                    }
                  }}
                  aria-label="Card title"
                  className="w-full bg-transparent text-lg font-semibold outline-none border-b border-transparent focus:border-primary transition-colors disabled:opacity-50"
                  disabled={isSavingTitle}
                />
                {isSavingTitle && (
                  <span className="text-xs text-muted-foreground">Saving...</span>
                )}
              </div>
            </SheetHeader>

            <Separator />

            <div className="space-y-2">
              <h3 className="text-sm font-medium">Description</h3>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onBlur={handleDescriptionBlur}
                placeholder="Add a more detailed description..."
                aria-label="Card description"
                className="min-h-[120px] resize-y"
                disabled={isSavingDescription}
              />
              {isSavingDescription && (
                <span className="text-xs text-muted-foreground">Saving...</span>
              )}
            </div>

            <Separator />

            <div className="space-y-2">
              <h3 className="text-sm font-medium">Labels</h3>
              <p className="text-muted-foreground text-sm">
                Labels will be available in a future update.
              </p>
            </div>

            <Separator />

            <div className="space-y-2">
              <h3 className="text-sm font-medium">Due Date</h3>
              {formattedDueDate ? (
                <Badge variant="secondary">{formattedDueDate}</Badge>
              ) : (
                <p className="text-muted-foreground text-sm">No due date set</p>
              )}
            </div>

            <Separator />

            <div className="space-y-2">
              <h3 className="text-sm font-medium">Checklist</h3>
              <p className="text-muted-foreground text-sm">
                Checklists will be available in a future update.
              </p>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
