import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ApiError, getEntry } from '../api';
import type { Entry } from '../types';
import { FramedPhoto } from '../components/FramedPhoto';
import { ErrorNote, Loading, useDocumentTitle } from '../components/Status';
import { Flower, Heart, Sparkle, Star } from '../components/Doodles';
import { formatDate } from '../text';
import { loadMyEntry } from '../myEntry';

/** Texto con párrafos respetando los saltos de línea que escribió la persona. */
function Paragraphs({ text }: { text: string }) {
  return (
    <>
      {text.split(/\n{2,}/).map((p, i) => (
        <p key={i}>{p}</p>
      ))}
    </>
  );
}

export function EntryPage() {
  const { id = '' } = useParams();
  const [entry, setEntry] = useState<Entry | null>(null);
  const [error, setError] = useState<{ message: string; notFound: boolean } | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  useDocumentTitle(entry ? `La página de ${entry.name}` : 'Entrada');

  useEffect(() => {
    const ctrl = new AbortController();
    setEntry(null);
    setError(null);
    getEntry(id, ctrl.signal)
      .then((res) => setEntry(res.entry))
      .catch((err: Error) => {
        if (err.name === 'AbortError') return;
        setError({ message: err.message, notFound: err instanceof ApiError && err.status === 404 });
      });
    return () => ctrl.abort();
  }, [id, reloadToken]);

  if (error) {
    return (
      <div className="narrow">
        <ErrorNote
          title={error.notFound ? 'Esta página no está en el diario' : 'No pudimos abrir esta página'}
          onRetry={error.notFound ? undefined : () => setReloadToken((n) => n + 1)}
        >
          {error.message}
        </ErrorNote>
        <p>
          <Link to="/entradas" className="link-hand">
            ← volver al diario
          </Link>
        </p>
      </div>
    );
  }
  if (!entry) return <Loading label="Abriendo el diario…" />;

  const isMine = loadMyEntry()?.id === entry.id;
  const edited = entry.updatedAt !== entry.createdAt;

  return (
    <article className="entry" aria-labelledby="entry-name">
      <nav className="entry__back" aria-label="Volver">
        <Link to="/entradas" className="link-hand">
          ← volver al diario
        </Link>
        {isMine && (
          <Link to="/mi-entrada" className="btn btn--small">
            Editar mi entrada
          </Link>
        )}
      </nav>

      <div className="spread">
        {/* Página izquierda: secciones 1 a 5 */}
        <section className="spread__page spread__page--left paper">
          {entry.isSample && <span className="sticker sticker--static">entrada de ejemplo · persona ficticia</span>}

          <figure className="polaroid entry__photo">
            <span className="tape tape--lavender tape--top" aria-hidden="true" />
            <FramedPhoto
              src={entry.photo}
              framing={entry.photoFraming}
              alt={entry.photo ? `Fotografía elegida por ${entry.name}` : ''}
              name={entry.name}
            />
            <figcaption className="polaroid-caption">{entry.name}</figcaption>
          </figure>

          <h1 id="entry-name" className="entry__name">
            {entry.name}
          </h1>

          <dl className="entry__facts">
            <div>
              <dt>Edad</dt>
              <dd>{entry.age} años</dd>
            </div>
            <div>
              <dt>Pronombres</dt>
              <dd>{entry.pronouns}</dd>
            </div>
          </dl>

          <div className="entry__interest">
            <p className="label-hand">Mi interés más friki</p>
            <p className="entry__interest-text">
              <Star size={22} className="ink-lavender" /> {entry.interest}
            </p>
          </div>

          <p className="entry__dates">
            Escrita el {formatDate(entry.createdAt)}
            {edited && <> · editada el {formatDate(entry.updatedAt)}</>}
          </p>
        </section>

        <div className="spread__binding" aria-hidden="true" />

        {/* Página derecha: secciones 6 a 8 */}
        <section className="spread__page spread__page--right paper lined">
          <div className="testimony">
            <h2 className="testimony__title">
              <Heart size={24} className="ink-sage" /> Lo bueno que he vivido gracias a esto
            </h2>
            <div className="testimony__text">
              <Paragraphs text={entry.positiveExperience} />
            </div>
          </div>

          <div className="testimony">
            <h2 className="testimony__title">
              <Sparkle size={20} className="ink-bluegray" /> Lo malo que he vivido por esto
            </h2>
            <div className="testimony__text">
              {entry.negativeExperience ? (
                <Paragraphs text={entry.negativeExperience} />
              ) : (
                <p className="testimony__empty">
                  {entry.name} prefirió no compartir una experiencia negativa. Y eso también está bien.
                </p>
              )}
            </div>
          </div>

          <div className="testimony">
            <h2 className="testimony__title">
              <Flower size={24} className="ink-lavender" /> ¿Me considero extraño o diferente al resto?
            </h2>
            <div className="testimony__text">
              <Paragraphs text={entry.differenceReflection} />
            </div>
          </div>
        </section>
      </div>

      <aside className="reflect note note--lavender" aria-label="Un momento para reflexionar">
        <p className="hand note__title">Antes de pasar la página…</p>
        <p>
          ¿Qué tienes en común con {entry.name}? ¿Alguna vez has visto a alguien recibir burlas por lo que le gusta? Tómate
          un momento. No hace falta responder en voz alta.
        </p>
        <div className="reflect__actions">
          <Link to="/entradas" className="btn btn--ghost">
            Seguir leyendo
          </Link>
          {!isMine && (
            <Link to="/mi-entrada" className="btn">
              Escribir mi página
            </Link>
          )}
        </div>
      </aside>
    </article>
  );
}
