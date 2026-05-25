import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Sheet, SheetContent } from './sheet';

describe('Sheet', () => {
  it('keeps panel sizing classes off the overlay', () => {
    render(
      <Sheet open onOpenChange={() => undefined}>
        <SheetContent className="w-[400px] p-0" aria-label="Example sheet">
          <div>Sheet body</div>
        </SheetContent>
      </Sheet>,
    );

    const overlay = document.querySelector('[data-slot="sheet-overlay"]');
    const content = screen.getByLabelText('Example sheet');

    expect(overlay).not.toBeNull();
    expect(overlay).toHaveClass('fixed', 'inset-0', 'z-50', 'bg-black/50');
    expect(overlay).not.toHaveClass('w-[400px]', 'p-0');
    expect(content).toHaveClass('w-[400px]', 'p-0');
  });
});
