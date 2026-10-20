import { Link } from 'react-router-dom';
import type { Entry } from '../types';
import { excerptFor, highlight, tiltFor } from '../text';
import { FramedPhoto } from './FramedPhoto';

const TAPES = ['lavender', 'sage', 'bluegray', 'beige'];

export function EntryCard({ entry, terms = [] }: { entry: Entry; terms?: string[] }) {
  const tilt = tiltFor(entry.id);
  const tape = TAPES[Math.abs(Math.round(tilt * 10)) % TAPES.length];

  return (
    <article className="entry-card" style={{ ['--tilt' as string]: `${tilt}deg` }}>
      <Link to={`/entradas/${entry.id}`} className="entry-card__link">
        <div className="polaroid entry-card__photo">
          <span className={`tape tape--${tape} tape--top`} aria-hidden="true" />
          <FramedPhoto src={entry.photo} framing={entry.photoFraming} alt="" name={entry.name} />
        </div>
        <div className="entry-card__body">
          <h3 className="entry-card__name">{highlight(entry.name, terms)}</h3>
          <p className="entry-card__interest">
            <span className="visually-hidden">Interés: </span>
            {highlight(entry.interest, terms)}
          </p>
          <p className="entry-card__excerpt">{highlight(excerptFor(entry, terms), terms)}</p>
          <span className="entry-card__more">
            Leer su página <span aria-hidden="true">→</span>
          </span>
        </div>
        {entry.isSample && <span className="sticker">ejemplo ficticio</span>}
      </Link>
    </article>
  );
}
