import type { Card } from '../cards/use-cards';
import { Card as CardComponent } from '../cards/card';

interface ColumnCardListProps {
  cards: Card[];
  newCardId?: number;
}

export function ColumnCardList({ cards, newCardId }: ColumnCardListProps) {
  if (cards.length === 0) {
    return null;
  }

  return (
    <div className="flex-1 overflow-y-auto p-2">
      <div className="space-y-2">
        {cards.map((card) => (
          <CardComponent key={card.id} card={card} isNew={card.id === newCardId} />
        ))}
      </div>
    </div>
  );
}