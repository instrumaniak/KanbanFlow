interface CardProps {
  card: {
    id: number;
    title: string;
    column_id?: number;
    position?: number;
    created_at?: string;
    updated_at?: string;
  };
  isNew?: boolean;
}

export function Card({ card, isNew }: CardProps) {
  return (
    <div className={`rounded bg-card p-3 text-sm shadow-sm hover:bg-accent/50 ${isNew ? 'animate-slide-up' : ''}`}>
      {card.title}
    </div>
  );
}