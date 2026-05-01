import { type Card } from './columns.api';
import { Card as CardComponent } from '../cards/card';

interface ColumnCardListProps {
  cards: Card[];
}

export function ColumnCardList({ cards }: ColumnCardListProps) {
  if (cards.length === 0) {
    return null;
  }

  return (
    <div className="flex-1 overflow-y-auto p-2">
      <div className="space-y-2">
        {cards.map((card) => (
          <CardComponent key={card.id} card={{ ...card, column_id: 0, position: 0, created_at: '', updated_at: '' }} />
        ))}
      </div>
    </div>
  );
}
