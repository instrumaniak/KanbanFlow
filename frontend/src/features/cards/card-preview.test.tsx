import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CardPreview } from './card-preview';

describe('CardPreview', () => {
  const mockCard = {
    id: 1,
    title: 'Preview Card',
    column_id: 1,
    position: 0,
    description: 'Preview description',
    labels: [
      { id: 1, name: 'Bug', color: 'red', created_at: '2024-01-01', updated_at: '2024-01-01' },
      { id: 2, name: 'Feature', color: 'green', created_at: '2024-01-01', updated_at: '2024-01-01' },
      { id: 3, name: 'Urgent', color: 'orange', created_at: '2024-01-01', updated_at: '2024-01-01' },
      { id: 4, name: 'Important', color: 'blue', created_at: '2024-01-01', updated_at: '2024-01-01' },
    ],
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
  };

  it('renders the shared card body content', () => {
    render(<CardPreview card={mockCard} />);

    expect(screen.getByText('Preview Card')).toBeInTheDocument();
    expect(screen.getByText('Preview description')).toBeInTheDocument();
    expect(screen.getByText('Bug')).toBeInTheDocument();
    expect(screen.getByText('Feature')).toBeInTheDocument();
    expect(screen.getByText('Urgent')).toBeInTheDocument();
    expect(screen.getByText('+1')).toBeInTheDocument();
  });

  it('renders optional actions beside the title', () => {
    render(
      <CardPreview
        card={mockCard}
        actions={<button type="button">Menu</button>}
      />
    );

    expect(screen.getByRole('button', { name: 'Menu' })).toBeInTheDocument();
  });
});
