import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { Card } from '../cards/use-cards';
import { Card as CardComponent } from '../cards/card';

interface ColumnCardListProps {
  cards: Card[];
  newCardId?: number;
}

export function ColumnCardList({ cards, newCardId }: ColumnCardListProps) {
  if (!cards || cards.length === 0) {
    return null;
  }

  return (
    <div className="flex-1 overflow-y-auto p-2">
      <SortableContext
        items={cards.map((c) => `card-${c.id}`)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-2" data-card-count={cards.length}>
          {cards.map((card, index) => (
            <CardComponent
              key={card.id}
              card={card}
              index={index}
              isNew={card.id === newCardId}
            />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}