import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { listEntries, type ListResult } from '../api';
import { EntryCard } from '../components/EntryCard';
import { SearchBar } from '../components/SearchBar';
import { ErrorNote, Loading, useDocumentTitle } from '../components/Status';
import { Flower, Squiggle } from '../components/Doodles';
import { searchTerms } from '../text';

export function Diary() {
  useDocumentTitle('Diario');
  const [params, setParams] = useSearchParams();
  const q = params.get('q') ?? '';
  const sort = params.get('sort') === 'asc' ? 'asc' : 'desc';

  const [input, setInput] = useState(q);
  const [result, setResult] = useState<ListResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  // Si la URL cambia desde fuera (p. ej. botón atrás), sincronizar el campo de búsqueda.
  useEffect(() => setInput((current) => (current.trim() === q ? current : q)), [q]);

  const updateParams = useCallback(
    (next: { q?: string; sort?: string }) => {
      const merged = new URLSearchParams(params);
      for (const [k, v] of Object.entries(next)) {
        if (v) merged.set(k, v);
        else merged.delete(k);
      }
      setParams(merged, { replace: true });
    },
    [params, setParams],
  );

  // Búsqueda mientras se escribe, con una pequeña pausa.
  useEffect(() => {
    const value = input.trim();
    if (value === q) return;
    const t = setTimeout(() => updateParams({ q: value }), 300);
    return () => clearTimeout(t);
  }, [input, q, updateParams]);

  useEffect(() => {
    const ctrl = new AbortController();
    setLoading(true);
    setError(null);
    listEntries({ q, sort }, ctrl.signal)
      .then(setResult)
      .catch((err: Error) => {
        if (err.name !== 'AbortError') setError(err.message);
      })
      .finally(() => {
        if (!ctrl.signal.aborted) setLoading(false);
      });
    return () => ctrl.abort();
  }, [q, sort, reloadToken]);

  const terms = useMemo(() => searchTerms(q), [q]);

  return (
    <div className="diary">
      <header className="page-head">
        <p className="hand page-head__kicker">todas las páginas</p>
        <h1 className="page-title">El diario</h1>
        <Squiggle className="ink-lavender" size={160} />
        <p className="page-head__intro">
          Cada tarjeta es la página de una persona. Busca cualquier palabra: un interés, un nombre, unos pronombres, algo que
          te haya pasado a ti también.
        </p>
      </header>

      <div className="diary__tools paper">
        <SearchBar value={input} onChange={setInput} onSubmit={(v) => updateParams({ q: v })} />
        <label className="sort">
          <span className="hand">Ordenar por fecha</span>
          <select value={sort} onChange={(e) => updateParams({ sort: e.target.value === 'asc' ? 'asc' : '' })}>
            <option value="desc">Más recientes primero</option>
            <option value="asc">Más antiguas primero</option>
          </select>
        </label>
      </div>

      <p className="diary__count" role="status" aria-live="polite">
        {result && !loading
          ? q
            ? `${result.total} ${result.total === 1 ? 'página encontrada' : 'páginas encontradas'} para «${q}»`
            : `${result.total} ${result.total === 1 ? 'página' : 'páginas'} en el diario`
          : ''}
      </p>

      {error ? (
        <ErrorNote onRetry={() => setReloadToken((n) => n + 1)}>{error}</ErrorNote>
      ) : !result ? (
        <Loading />
      ) : result.entries.length === 0 ? (
        <div className="empty paper">
          <Flower size={44} className="ink-sage" />
          {q ? (
            <>
              <p className="hand">Ninguna página menciona «{q}» todavía.</p>
              <p>Prueba con otra palabra, o escribe tú esa historia.</p>
              <div className="empty__actions">
                <button type="button" className="btn btn--ghost" onClick={() => setInput('')}>
                  Ver todas las páginas
                </button>
                <Link to="/mi-entrada" className="btn">
                  Escribir mi entrada
                </Link>
              </div>
            </>
          ) : (
            <>
              <p className="hand">El diario todavía está en blanco.</p>
              <Link to="/mi-entrada" className="btn">
                Escribir la primera página
              </Link>
            </>
          )}
        </div>
      ) : (
        <div className={`card-grid ${loading ? 'is-loading' : ''}`}>
          {result.entries.map((entry) => (
            <EntryCard key={entry.id} entry={entry} terms={terms} />
          ))}
        </div>
      )}
    </div>
  );
}
