import { useState, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useCreateChecklistItem } from './use-checklists';
import { useToast } from '@/components/ui/use-toast';

interface AddChecklistItemFormProps {
  checklistId: number;
  cardId: number;
  onComplete: () => void;
}

export function AddChecklistItemForm({ checklistId, cardId, onComplete }: AddChecklistItemFormProps) {
  const [text, setText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const createMutation = useCreateChecklistItem();
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim() === '') return;

    createMutation.mutate(
      {
        checklistId,
        data: { text: text.trim() },
        cardId,
      },
      {
        onSuccess: () => {
          setText('');
          inputRef.current?.focus();
        },
        onError: (error) => {
          toast({ title: 'Failed to add item', description: error.message, type: 'destructive' });
        },
      },
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onComplete();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <Input
        ref={inputRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Add an item..."
        className="h-7 text-sm"
        autoFocus
      />
      <Button type="submit" size="sm" className="h-7">
        Add
      </Button>
    </form>
  );
}
