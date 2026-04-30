import { type Card } from './columns.api';

interface ColumnCardListProps {
  cards: Card[];
}

export function ColumnCardList({ cards }: ColumnCardListProps) {
  if (cards.length === 0) {
    return (
      <div className="flex-1 p-2">
        <div className="rounded bg-muted/50 py-8 text-center text-sm text-muted-foreground">
          No cards yet
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-2">
      <div className="space-y-2">
        {cards.map((card) => (
          <div
            key={card.id}
            className="rounded bg-card p-3 text-sm shadow-sm hover:bg-accent/50"
          >
            {card.title}
          </div>
        ))}
      </div>
    </div>
  );
}