import { useState } from 'react';
import { useBoards } from '@/features/boards/use-boards';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Link2, X } from 'lucide-react';

interface NoteLinkSelectorProps {
  linkBoardId: number | undefined;
  onLinkBoard: (boardId: number | undefined) => void;
}

export function NoteLinkSelector({ linkBoardId, onLinkBoard }: NoteLinkSelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const { data: boardsData } = useBoards();

  const boards = boardsData?.data ?? [];
  const selectedBoard = boards.find((b) => b.id === linkBoardId);
  const filteredBoards = boards.filter(
    (b) => b.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-1">
      <label className="text-sm font-medium">Linked to</label>
      <div className="flex items-center gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start text-sm font-normal"
            >
              <Link2 className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
              {selectedBoard ? selectedBoard.name : 'None'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[280px] p-2" align="start">
            <Input
              placeholder="Search boards..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-7 text-sm mb-2"
              autoFocus
            />
            <ScrollArea className="max-h-48">
              {filteredBoards.length > 0 ? (
                <div className="space-y-0.5">
                  {filteredBoards.map((board) => (
                    <button
                      key={board.id}
                      className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent text-left"
                      onClick={() => {
                        onLinkBoard(board.id);
                        setOpen(false);
                        setSearch('');
                      }}
                    >
                      <div
                        className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: board.background_color || '#0079BF' }}
                      />
                      <span className="flex-1 truncate">{board.name}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground px-2 py-4 text-center">
                  No boards found
                </p>
              )}
            </ScrollArea>
          </PopoverContent>
        </Popover>
        {linkBoardId && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => onLinkBoard(undefined)}
            aria-label="Remove link"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}
