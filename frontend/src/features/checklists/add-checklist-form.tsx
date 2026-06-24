import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useCreateChecklist } from './use-checklists';
import { useToast } from '@/components/ui/use-toast';

interface AddChecklistFormProps {
  cardId: number;
  onComplete: () => void;
}

export function AddChecklistForm({ cardId, onComplete }: AddChecklistFormProps) {
  const [title, setTitle] = useState('Checklist');
  const createMutation = useCreateChecklist();
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim() === '') return;

    createMutation.mutate(
      {
        title: title.trim(),
        card_id: cardId,
      },
      {
        onSuccess: () => {
          setTitle('Checklist');
          onComplete();
        },
        onError: (error) => {
          toast({ title: 'Failed to create checklist', description: error.message, type: 'destructive' });
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
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Checklist title..."
        className="h-7 text-sm"
        autoFocus
      />
      <Button type="submit" size="sm" className="h-7">
        Add
      </Button>
    </form>
  );
}
