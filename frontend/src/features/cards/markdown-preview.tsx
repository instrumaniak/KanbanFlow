import ReactMarkdown from 'react-markdown';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import type { Schema } from 'hast-util-sanitize';

const markdownSanitizeSchema: Schema = {
  ...defaultSchema,
  tagNames: [
    'h1', 'h2', 'h3', 'p', 'ul', 'ol', 'li', 'blockquote', 'pre', 'code',
    'em', 'strong', 'a', 'br', 'hr', 'img', 'table', 'thead', 'tbody',
    'tr', 'th', 'td', 'input',
  ],
  attributes: {
    ...defaultSchema.attributes,
    a: [...(defaultSchema.attributes?.a ?? []), 'target', 'rel'],
    img: [...(defaultSchema.attributes?.img ?? []), 'src', 'alt', 'title'],
    input: [...(defaultSchema.attributes?.input ?? []), 'type', 'checked', 'disabled'],
  },
  protocols: {
    ...defaultSchema.protocols,
    href: ['http', 'https', 'mailto'],
    src: ['http', 'https'],
  },
};

interface MarkdownPreviewProps {
  content: string;
}

export function MarkdownPreview({ content }: MarkdownPreviewProps) {
  return (
    <div className="min-h-[200px] rounded-md border border-input bg-background p-3 overflow-auto text-sm space-y-2">
      {content.trim() ? (
        <ReactMarkdown
          rehypePlugins={[[rehypeSanitize, markdownSanitizeSchema]]}
          components={{
            h1: ({ children }) => <h1 className="text-lg font-bold">{children}</h1>,
            h2: ({ children }) => <h2 className="text-base font-semibold">{children}</h2>,
            p: ({ children }) => <p className="leading-relaxed">{children}</p>,
            ul: ({ children }) => <ul className="list-disc pl-5">{children}</ul>,
            ol: ({ children }) => <ol className="list-decimal pl-5">{children}</ol>,
            code: ({ children }) => <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">{children}</code>,
            pre: ({ children }) => <pre className="rounded bg-muted p-2 overflow-auto">{children}</pre>,
            a: ({ children, href }) => (
              <a href={href} className="text-primary underline" target="_blank" rel="noopener noreferrer">
                {children}
              </a>
            ),
          }}
        >
          {content}
        </ReactMarkdown>
      ) : (
        <p className="text-muted-foreground text-sm italic">
          Nothing to preview
        </p>
      )}
    </div>
  );
}
