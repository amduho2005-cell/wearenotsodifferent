import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { listEntries } from '../api';
import type { Entry } from '../types';
import { EntryCard } from '../components/EntryCard';
import { SearchBar } from '../components/SearchBar';
import { ErrorNote, Loading, useDocumentTitle } from '../components/Status';
import { Arrow, Flower, Heart, Sparkle, Spiral, Squiggle, Star } from '../components/Doodles';

export function Home() {
  useDocumentTitle('');
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [recent, setRecent] = useState<Entry[] | null>(null);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback((signal?: AbortSignal) => {
    setError(null);
    listEntries({ sort: 'desc', limit: 3 }, signal)
      .then((res) => {
        setRecent(res.entries);
        setTotal(res.total);
      })
      .catch((err: Error) => {
        if (err.name !== 'AbortError') setError(err.message);
      });
  }, []);

  useEffect(() => {
    const ctrl = new AbortController();
    load(ctrl.signal);
    return () => ctrl.abort();
  }, [load]);

  const search = (q: string) => navigate(q ? `/entradas?q=${encodeURIComponent(q)}` : '/entradas');

  return (
    <>
      <section className="hero">
        <div className="hero__paper paper torn">
          <span className="tape tape--sage tape--corner-left" aria-hidden="true" />
          <span className="tape tape--lavender tape--corner-right" aria-hidden="true" />
          <Star className="hero__doodle hero__doodle--star ink-lavender" size={36} />
          <Spiral className="hero__doodle hero__doodle--spiral ink-bluegray" size={44} />
          <Sparkle className="hero__doodle hero__doodle--sparkle ink-sage" size={26} />

          <p className="hero__kicker hand">un diario colectivo</p>
          <h1 className="hero__title">we are not so different</h1>
          <p className="hero__phrase">
            <span className="highlighter">Lo que te gusta también forma parte de ti</span>
          </p>
          <Squiggle className="hero__squiggle ink-bluegray" size={180} />
          <p className="hero__intro">
            Aquí, personas de todas las edades comparten su interés más friki, lo bonito que les ha traído y, si quieren,
            las veces en que alguien se burló de ellas por eso. Leer sus páginas es una forma de entender el bullying desde
            dentro y de descubrir que, en el fondo, nos parecemos más de lo que creemos.
          </p>

          <SearchBar value={query} onChange={setQuery} onSubmit={search} label="¿Qué te gustaría encontrar?" />

          <div className="hero__actions">
            <Link to="/entradas" className="btn">
              Leer todas las entradas{total ? ` (${total})` : ''}
            </Link>
            <Link to="/mi-entrada" className="btn btn--ghost">
              Escribir mi entrada
            </Link>
          </div>
        </div>

        <aside className="hero__notes" aria-label="Cómo funciona">
          <div className="note note--lavender" style={{ ['--tilt' as string]: '-2deg' }}>
            <p className="hand note__title">1 · Lee</p>
            <p>Cada persona tiene una sola página: su foto, su interés y lo que ha vivido gracias a él.</p>
          </div>
          <div className="note note--sage" style={{ ['--tilt' as string]: '1.5deg' }}>
            <p className="hand note__title">2 · Escribe</p>
            <p>Puedes usar un seudónimo. La experiencia negativa es opcional: nadie tiene que inventarse nada.</p>
          </div>
          <div className="note note--blue" style={{ ['--tilt' as string]: '-1deg' }}>
            <p className="hand note__title">3 · Reconócete</p>
            <p>Sin likes, sin seguidores, sin comentarios. Solo historias para leer con calma.</p>
          </div>
          <Arrow className="hero__arrow ink-charcoal" size={80} />
        </aside>
      </section>

      <section className="section" aria-labelledby="recientes">
        <div className="section__head">
          <h2 id="recientes" className="section__title">
            Páginas recientes <Heart size={26} className="ink-lavender" />
          </h2>
          <Link to="/entradas" className="link-hand">
            ver todas las entradas →
          </Link>
        </div>

        {error ? (
          <ErrorNote onRetry={() => load()}>{error}</ErrorNote>
        ) : !recent ? (
          <Loading />
        ) : recent.length === 0 ? (
          <div className="empty paper">
            <Flower size={44} className="ink-sage" />
            <p className="hand">El diario todavía está en blanco.</p>
            <Link to="/mi-entrada" className="btn">
              Escribir la primera página
            </Link>
          </div>
        ) : (
          <div className="card-grid">
            {recent.map((entry) => (
              <EntryCard key={entry.id} entry={entry} />
            ))}
          </div>
        )}
      </section>

      <section className="section why paper lined-soft" aria-labelledby="porque">
        <span className="tape tape--bluegray tape--top" aria-hidden="true" />
        <h2 id="porque" className="section__title">
          ¿Por qué un diario?
        </h2>
        <p>
          Muchas burlas empiezan por algo que a alguien le apasiona: un anime, un juego de rol, una colección de bichos.
          Cuando esas historias se cuentan en primera persona, dejan de ser «cosas de raritos» y se convierten en lo que
          son: experiencias humanas. Este diario no es una red social; es un lugar para leer, reconocerse y empatizar.
        </p>
        <Link to="/sobre-el-proyecto" className="link-hand">
          conoce el proyecto →
        </Link>
      </section>
    </>
  );
}
