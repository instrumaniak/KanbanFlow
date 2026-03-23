import { useToast } from '@/components/ui/use-toast';

export function useToastHelpers() {
  const { toast } = useToast();

  return {
    showSuccess: (title: string, description?: string) => {
      toast({ title, description, type: 'success' });
    },
    showError: (title: string, description?: string) => {
      toast({ title, description, type: 'error' });
    },
    showDestructive: (title: string, onUndo: () => void, description?: string) => {
      toast({
        title,
        description,
        type: 'destructive',
        action: { label: 'Undo', onClick: onUndo },
      });
    },
  };
}
