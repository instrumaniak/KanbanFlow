import { useState, useCallback, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import type { Schema } from 'hast-util-sanitize';
import { useUpdateCard, type Card as CardType } from './use-cards';
import { LabelPicker } from '../labels/label-picker';

const markdownSanitizeSchema: Schema = {
  ...defaultSchema,
  tagNames: [
    'h1', 'h2', 'h3', 'p', 'ul', 'ol', 'li', 'blockquote', 'pre', 'code',
    'em', 'strong', 'a', 'br', 'hr', 'img', 'table', 'thead', 'tbody',
    'tr', 'th', 'td', 'input',
  ],
  attributes: {
    ...defaultSchema.attributes,
    a: [...(defaultSchema.attributes?.a ?? []), 'target', 'rel'],
    img: [...(defaultSchema.attributes?.img ?? []), 'src', 'alt', 'title'],
    input: [...(defaultSchema.attributes?.input ?? []), 'type', 'checked', 'disabled'],
  },
  protocols: {
    ...defaultSchema.protocols,
    href: ['http', 'https', 'mailto'],
    src: ['http', 'https'],
  },
};
import {
  Sheet,
  SheetContent,
  SheetHeader,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
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
  const [descriptionMode, setDescriptionMode] = useState<'edit' | 'preview'>('edit');
  const isMountedRef = useRef(true);
  const isDirtyRef = useRef(false);
  const pendingSaveRef = useRef(false);
  const latestCardRef = useRef(card);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const updateCard = useUpdateCard();
  const { toast } = useToast();

  useEffect(() => {
    latestCardRef.current = card;
  });

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
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Description</h3>
                <Tabs
                  value={descriptionMode}
                  onValueChange={(v) => {
                    if (v === 'edit' || v === 'preview') setDescriptionMode(v);
                  }}
                >
                  <TabsList aria-label="Description mode">
                    <TabsTrigger value="edit">Edit</TabsTrigger>
                    <TabsTrigger value="preview">Preview</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              <Tabs
                value={descriptionMode}
                onValueChange={(v) => {
                  if (v === 'edit' || v === 'preview') setDescriptionMode(v);
                }}
              >
                <TabsContent value="edit">
                  <Textarea
                    value={description}
                    onChange={handleDescriptionChange}
                    onBlur={handleDescriptionBlur}
                    placeholder="Add a more detailed description..."
                    aria-label="Card description"
                    className="min-h-[200px] resize-y font-mono text-sm"
                    disabled={isSavingDescription}
                  />
                </TabsContent>
                <TabsContent value="preview">
                  <div className="min-h-[200px] rounded-md border border-input bg-background p-3 overflow-auto text-sm space-y-2">
                    {description.trim() ? (
                      <ReactMarkdown
                        rehypePlugins={[[rehypeSanitize, markdownSanitizeSchema]]}
                        components={{
                          h1: ({ children }) => <h1 className="text-lg font-bold">{children}</h1>,
                          h2: ({ children }) => <h2 className="text-base font-semibold">{children}</h2>,
                          p: ({ children }) => <p className="leading-relaxed">{children}</p>,
                          ul: ({ children }) => <ul className="list-disc pl-5">{children}</ul>,
                          ol: ({ children }) => <ol className="list-decimal pl-5">{children}</ol>,
                          code: ({ children }) => <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">{children}</code>,
                          pre: ({ children }) => <pre className="rounded bg-muted p-2 overflow-auto">{children}</pre>,
                          a: ({ children, href }) => (
                            <a href={href} className="text-primary underline" target="_blank" rel="noopener noreferrer">
                              {children}
                            </a>
                          ),
                        }}
                      >
                        {description}
                      </ReactMarkdown>
                    ) : (
                      <p className="text-muted-foreground text-sm italic">
                        Nothing to preview
                      </p>
                    )}
                  </div>
                </TabsContent>
              </Tabs>

              {isSavingDescription && (
                <span className="text-xs text-muted-foreground">Saving...</span>
              )}
            </div>

            <Separator />

            <div className="space-y-2">
              <h3 className="text-sm font-medium">Labels</h3>
              <LabelPicker card={card} />
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
