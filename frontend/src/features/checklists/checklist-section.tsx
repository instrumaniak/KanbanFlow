import { useState } from 'react';
import type { Checklist as ChecklistType } from './checklists.api';
import { Checklist } from './checklist';
import { AddChecklistForm } from './add-checklist-form';
import { Button } from '@/components/ui/button';

interface ChecklistSectionProps {
  cardId: number;
  checklists: ChecklistType[];
}

export function ChecklistSection({ cardId, checklists }: ChecklistSectionProps) {
  const [isAddingChecklist, setIsAddingChecklist] = useState(false);

  return (
    <div className="space-y-4">
      {checklists.length > 0 ? (
        <div className="space-y-4">
          {checklists.map((checklist) => (
            <Checklist key={checklist.id} checklist={checklist} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No checklists yet</p>
      )}

      {isAddingChecklist ? (
        <AddChecklistForm cardId={cardId} onComplete={() => setIsAddingChecklist(false)} />
      ) : (
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-muted-foreground"
          onClick={() => setIsAddingChecklist(true)}
        >
          + Add Checklist
        </Button>
      )}
    </div>
  );
}
