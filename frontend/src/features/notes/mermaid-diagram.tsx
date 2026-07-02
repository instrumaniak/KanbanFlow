import { useEffect, useRef, useId } from 'react';
import mermaid from 'mermaid';
import DOMPurify from 'dompurify';

interface MermaidDiagramProps {
  code: string;
}

export function MermaidDiagram({ code }: MermaidDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);
  const id = useId();

  if (!initializedRef.current) {
    mermaid.initialize({ startOnLoad: false, theme: 'default' });
    initializedRef.current = true;
  }

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const renderDiagram = async () => {
      if (!container) return;
      try {
        const { svg } = await mermaid.render(id, code);
        container.innerHTML = DOMPurify.sanitize(svg);
      } catch {
        container.innerHTML = '<pre class="text-red-500 text-sm">Failed to render diagram</pre>';
      }
    };

    renderDiagram();

    return () => {
      container.innerHTML = '';
    };
  }, [code, id]);

  return (
    <div
      ref={containerRef}
      className="my-4 flex justify-center"
      role="img"
      aria-label={`Diagram: ${code.slice(0, 50)}`}
    />
  );
}
