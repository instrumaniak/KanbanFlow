import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  projectName?: string;
  boardName?: string;
  projectId?: string;
  boardId?: string;
}

export function Breadcrumbs({
  projectName,
  boardName,
  projectId,
  boardId,
}: BreadcrumbsProps) {
  if (!projectName) return null;

  const items: BreadcrumbItem[] = [
    {
      label: `Project: ${projectName}`,
      href: boardName && projectId ? `/projects/${projectId}` : undefined,
    },
  ];

  if (boardName) {
    items.push({
      label: `Board: ${boardName}`,
    });
  }

  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex items-center gap-1.5 text-sm text-muted-foreground">
        {items.map((item, index) => (
          <li key={item.label} className="flex items-center gap-1.5">
            {index > 0 && <ChevronRight className="h-3.5 w-3.5" />}
            {item.href ? (
              <Link
                to={item.href}
                className="transition-colors hover:text-foreground"
              >
                {item.label}
              </Link>
            ) : (
              <span className="text-foreground">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
