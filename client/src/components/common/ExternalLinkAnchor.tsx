import type { ReactNode } from 'react';

interface ExternalLinkAnchorProps {
  href: string;
  children: ReactNode;
  className?: string;
  title?: string;
}

export function ExternalLinkAnchor({ href, children, className = '', title }: Readonly<ExternalLinkAnchorProps>) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title={title}
      className={`inline-flex items-center gap-1 text-xs text-gray-400 hover:text-indigo-500 transition-colors group min-w-0 ${className}`}
    >
      <span className="truncate">{children}</span>
      <svg
        className="h-3 w-3 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
        <polyline points="15 3 21 3 21 9" />
        <line x1="10" y1="14" x2="21" y2="3" />
      </svg>
    </a>
  );
}
