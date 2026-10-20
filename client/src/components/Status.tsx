import { useEffect, type ReactNode } from 'react';
import { Spiral } from './Doodles';

export function Loading({ label = 'Pasando las páginas…' }: { label?: string }) {
  return (
    <div className="status status--loading" role="status">
      <Spiral size={40} className="spin" />
      <p className="hand">{label}</p>
    </div>
  );
}

export function ErrorNote({ title = 'Vaya…', children, onRetry }: { title?: string; children: ReactNode; onRetry?: () => void }) {
  return (
    <div className="status status--error note note--pink" role="alert">
      <p className="hand status__title">{title}</p>
      <p>{children}</p>
      {onRetry && (
        <button type="button" className="btn btn--small" onClick={onRetry}>
          Intentar de nuevo
        </button>
      )}
    </div>
  );
}

export function useDocumentTitle(title: string) {
  useEffect(() => {
    document.title = title ? `${title} · we are not so different` : 'we are not so different';
  }, [title]);
}
