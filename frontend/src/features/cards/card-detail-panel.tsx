import { useState, useCallback, useRef, useEffect } from 'react';
import { useUpdateCard, type Card as CardType } from './use-cards';
import {
  Sheet,
  SheetContent,
  SheetHeader,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';

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
  const isMountedRef = useRef(true);
  const isDirtyRef = useRef(false);
  const pendingSaveRef = useRef(false);
  const latestCardRef = useRef(card);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const updateCard = useUpdateCard();
  const { toast } = useToast();

  latestCardRef.current = card;

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!isDirtyRef.current && !pendingSaveRef.current) {
      setTitle(card.title);
      setDescription(card.description ?? '');
    }
  }, [card.title, card.description, card.id]);

  const safeSetIsSavingTitle = useCallback((value: boolean) => {
    if (isMountedRef.current) setIsSavingTitle(value);
  }, []);

  const safeSetIsSavingDescription = useCallback((value: boolean) => {
    if (isMountedRef.current) setIsSavingDescription(value);
  }, []);

  const handleTitleBlur = useCallback(() => {
    if (isSavingTitle) return;
    const trimmed = title.trim();
    const currentCard = latestCardRef.current;
    if (trimmed === '') {
      setTitle(currentCard.title);
      isDirtyRef.current = false;
      return;
    }
    if (trimmed !== currentCard.title) {
      isDirtyRef.current = false;
      pendingSaveRef.current = true;
      setIsSavingTitle(true);
      updateCard.mutate(
        { id: currentCard.id, data: { title: trimmed } },
        {
          onSettled: () => {
            pendingSaveRef.current = false;
            safeSetIsSavingTitle(false);
          },
          onError: () => {
            setTitle(latestCardRef.current.title);
            toast({ title: 'Failed to save title', variant: 'destructive' });
          },
        },
      );
    } else {
      isDirtyRef.current = false;
    }
  }, [title, isSavingTitle, updateCard, safeSetIsSavingTitle, toast]);

  const handleDescriptionBlur = useCallback(() => {
    if (isSavingDescription) return;
    const newValue = description.trim();
    const currentCard = latestCardRef.current;
    const oldValue = (currentCard.description ?? '').trim();
    if (newValue !== oldValue) {
      isDirtyRef.current = false;
      pendingSaveRef.current = true;
      setIsSavingDescription(true);
      updateCard.mutate(
        { id: currentCard.id, data: { description: newValue || null } },
        {
          onSettled: () => {
            pendingSaveRef.current = false;
            safeSetIsSavingDescription(false);
          },
          onError: () => {
            setDescription(latestCardRef.current.description ?? '');
            toast({ title: 'Failed to save description', variant: 'destructive' });
          },
        },
      );
    } else {
      isDirtyRef.current = false;
    }
  }, [description, isSavingDescription, updateCard, safeSetIsSavingDescription, toast]);

  const handleTitleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      isDirtyRef.current = true;
      setTitle(e.target.value);
    },
    [],
  );

  const handleDescriptionChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      isDirtyRef.current = true;
      setDescription(e.target.value);
    },
    [],
  );

  const formattedDueDate = card.due_date
    ? new Date(card.due_date).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange} modal={true}>
      <SheetContent
        side="right"
        className="w-[400px] sm:w-[540px] p-0"
        aria-label="Card details"
        onOpenAutoFocus={(e) => e.preventDefault()}
        onCloseAutoFocus={() => {
          isDirtyRef.current = false;
          pendingSaveRef.current = false;
        }}
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
                  onChange={handleTitleChange}
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
                onChange={handleDescriptionChange}
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
                <p className="text-muted-foreground text-sm">No due date</p>
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
