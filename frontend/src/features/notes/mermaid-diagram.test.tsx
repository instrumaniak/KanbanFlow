import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MermaidDiagram } from './mermaid-diagram';

vi.mock('mermaid', () => ({
  default: {
    initialize: vi.fn(),
    render: vi.fn(),
  },
}));

import mermaid from 'mermaid';
const mockMermaidRender = mermaid.render as ReturnType<typeof vi.fn>;

describe('MermaidDiagram', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders container with role img', () => {
    mockMermaidRender.mockResolvedValue({ svg: '<svg>diagram</svg>' });
    const { container } = render(<MermaidDiagram code="graph TD; A-->B;" />);
    const div = container.firstChild as HTMLElement;
    expect(div).toHaveAttribute('role', 'img');
  });

  it('renders SVG when mermaid succeeds', async () => {
    mockMermaidRender.mockResolvedValue({ svg: '<svg>mock-svg</svg>' });
    const { container } = render(<MermaidDiagram code="graph TD; A-->B;" />);
    await vi.dynamicImportSettled();
    await new Promise((r) => setTimeout(r, 0));
    expect(container.querySelector('svg')).toBeTruthy();
  });

  it('shows error fallback when mermaid fails', async () => {
    mockMermaidRender.mockRejectedValue(new Error('Parse error'));
    render(<MermaidDiagram code="invalid" />);
    await vi.dynamicImportSettled();
    await new Promise((r) => setTimeout(r, 0));
    expect(await screen.findByText('Failed to render diagram')).toBeInTheDocument();
  });

  it('calls mermaid.initialize on render', () => {
    mockMermaidRender.mockResolvedValue({ svg: '<svg>diagram</svg>' });
    render(<MermaidDiagram code="graph TD; A-->B;" />);
    expect(mermaid.initialize).toHaveBeenCalledWith({ startOnLoad: false, theme: 'default' });
  });

  it('sets aria-label from code', () => {
    mockMermaidRender.mockResolvedValue({ svg: '<svg>diagram</svg>' });
    const { container } = render(<MermaidDiagram code="graph TD; A-->B;" />);
    const div = container.firstChild as HTMLElement;
    expect(div).toHaveAttribute('aria-label', 'Diagram: graph TD; A-->B;');
  });
});
