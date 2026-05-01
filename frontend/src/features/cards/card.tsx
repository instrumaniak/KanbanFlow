interface CardProps {
  card: {
    id: number;
    title: string;
    column_id?: number;
    position?: number;
    created_at?: string;
    updated_at?: string;
  };
}

export function Card({ card }: CardProps) {
  return (
    <div className="rounded bg-card p-3 text-sm shadow-sm hover:bg-accent/50">
      {card.title}
    </div>
  );
}