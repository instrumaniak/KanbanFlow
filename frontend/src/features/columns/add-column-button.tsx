import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AddColumnButtonProps {
  onClick: () => void;
}

export function AddColumnButton({ onClick }: AddColumnButtonProps) {
  return (
    <Button
      variant="outline"
      className="h-12 w-80 shrink-0 border-2 border-dashed border-muted-foreground/30 text-muted-foreground hover:border-muted-foreground/50 hover:bg-transparent"
      onClick={onClick}
    >
      <Plus className="mr-2 h-4 w-4" />
      Add Column
    </Button>
  );
}