import { useState } from 'react';
import type { Checklist as ChecklistType } from './checklists.api';
import { ChecklistItem } from './checklist-item';
import { AddChecklistItemForm } from './add-checklist-item-form';
import { useDeleteChecklist, useUpdateChecklist } from './use-checklists';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/components/ui/use-toast';
import { Check } from 'lucide-react';

interface ChecklistProps {
  checklist: ChecklistType;
}

export function Checklist({ checklist }: ChecklistProps) {
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [title, setTitle] = useState(checklist.title);
  const deleteMutation = useDeleteChecklist();
  const updateMutation = useUpdateChecklist();
  const { toast } = useToast();

  const completedCount = checklist.items.filter((item) => item.is_completed).length;
  const totalCount = checklist.items.length;
  const percent = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);
  const isComplete = percent === 100 && totalCount > 0;

  const handleDelete = () => {
    deleteMutation.mutate(checklist.id, {
      onError: () => {
        toast({ title: 'Failed to delete checklist', type: 'destructive' });
      },
    });
  };

  const handleTitleSave = () => {
    if (title.trim() === '') {
      setTitle(checklist.title);
      setIsEditingTitle(false);
      return;
    }
    if (title.trim() !== checklist.title) {
      updateMutation.mutate(
        { id: checklist.id, data: { title: title.trim() } },
        {
          onError: () => {
            setTitle(checklist.title);
            toast({ title: 'Failed to save title', type: 'destructive' });
          },
        },
      );
    }
    setIsEditingTitle(false);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTitleSave();
    } else if (e.key === 'Escape') {
      setTitle(checklist.title);
      setIsEditingTitle(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        {isEditingTitle ? (
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleTitleSave}
            onKeyDown={handleTitleKeyDown}
            className="h-6 text-sm font-medium flex-1 mr-2"
            autoFocus
          />
        ) : (
          <h4
            className="font-medium text-sm cursor-pointer hover:bg-muted px-1 rounded"
            onClick={() => setIsEditingTitle(true)}
          >
            {checklist.title}
          </h4>
        )}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {completedCount}/{totalCount} ({percent}%)
          </span>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
              >
                <span className="sr-only">Delete checklist</span>
                <span className="text-muted-foreground">×</span>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete checklist?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete "{checklist.title}" and all its items.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
      <div className="w-full bg-secondary rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all ${
            isComplete ? 'bg-emerald-500' : 'bg-primary'
          }`}
          style={{ width: `${percent}%` }}
        />
      </div>
      {isComplete && (
        <div className="flex items-center gap-1 text-emerald-500">
          <Check className="h-4 w-4" />
          <span className="text-xs font-medium">Complete</span>
        </div>
      )}
      <div className="space-y-1">
        {checklist.items.map((item) => (
          <ChecklistItem key={item.id} item={item} />
        ))}
      </div>
      {isAddingItem ? (
        <AddChecklistItemForm
          checklistId={checklist.id}
          onComplete={() => setIsAddingItem(false)}
        />
      ) : (
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-muted-foreground"
          onClick={() => setIsAddingItem(true)}
        >
          + Add item
        </Button>
      )}
    </div>
  );
}
