import { useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { listEntries } from '../api';
import type { Entry } from '../types';
import { FramedPhoto } from '../components/FramedPhoto';
import { useDocumentTitle } from '../components/Status';
import '../styles/field-diary.css';
import { Flower, Heart, Sparkle, Spiral, Squiggle, Star } from '../components/Doodles';
import { tiltFor } from '../text';
import {
  AUTORA,
  CATEGORIAS,
  CITAS,
  CONCLUSION,
  DESCRIPCION,
  ENTRADA_TITULO,
  ENTRADAS_ANALIZADAS,
  FICHA,
  IMPRESIONES,
  INTERESES,
  LLEGADAS,
  NOTA_ETICA,
  OBJETIVOS,
  POSICION,
  PREGUNTA,
  PREGUNTAS_PENDIENTES,
  PROCESO,
  SENSORIAL,
  TEMAS_FRECUENTES,
} from '../content/diarioCampo';

const INDICE = [
  { id: 'pregunta', label: 'Pregunta' },
  { id: 'posicion', label: 'Mi posición' },
  { id: 'entrada', label: 'Entrada de campo' },
  { id: 'categorias', label: 'Categorías y conclusión' },
  { id: 'proceso', label: 'Proceso' },
];

/** Párrafos de un array de textos. */
function Texto({ parrafos }: { parrafos: string[] }) {
  return (
    <>
      {parrafos.map((p, i) => (
        <p key={i}>{p}</p>
      ))}
    </>
  );
}

/** Marcas de conteo dibujadas a mano (grupos de cinco). */
function Conteo({ n }: { n: number }) {
  const grupos = Array.from({ length: Math.ceil(n / 5) }, (_, g) => Math.min(5, n - g * 5));
  return (
    <span className="fd-tally" aria-hidden="true">
      {grupos.map((cuantas, g) => (
        <svg key={g} viewBox="0 0 34 26" width="34" height="26">
          {Array.from({ length: Math.min(cuantas, 4) }, (_, i) => (
            <path key={i} d={`M${5 + i * 7} 3 l1 20`} stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
          ))}
          {cuantas === 5 && <path d="M1 18 L32 7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />}
        </svg>
      ))}
    </span>
  );
}

function Seccion({ id, numero, titulo, peso, children, className = '' }: {
  id: string;
  numero: string;
  titulo: string;
  peso?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={`fd-section ${className}`} aria-labelledby={`${id}-titulo`}>
      <header className="fd-section__head">
        <span className="fd-section__num hand" aria-hidden="true">
          {numero}
        </span>
        <h2 id={`${id}-titulo`} className="section__title">
          {titulo}
        </h2>
        {peso && <span className="fd-weight">{peso}</span>}
      </header>
      {children}
    </section>
  );
}

/** Fotos de las entradas analizadas, tal y como están publicadas ahora. */
function useFotosAnalizadas() {
  const [fotos, setFotos] = useState<Entry[] | null>(null);
  const [error, setError] = useState(false);
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    const ctrl = new AbortController();
    setError(false);
    listEntries({ sort: 'asc' }, ctrl.signal)
      .then((res) => setFotos(res.entries.filter((e) => ENTRADAS_ANALIZADAS.includes(e.id) && e.photo)))
      .catch(() => {
        if (!ctrl.signal.aborted) setError(true);
      });
    return () => ctrl.abort();
  }, [intento]);

  return { fotos, error, reintentar: () => setIntento((n) => n + 1) };
}

export function FieldDiary() {
  useDocumentTitle('Diario de campo');
  const { fotos, error, reintentar } = useFotosAnalizadas();
  const tapes = ['lavender', 'sage', 'bluegray', 'beige'];

  return (
    <article className="fd">
      <header className="page-head">
        <p className="hand page-head__kicker">cuaderno de campo creativo · por {AUTORA}</p>
        <h1 className="page-title">Diario de campo</h1>
        <Squiggle className="ink-sage" size={160} />
        <p className="page-head__intro">
          Una pequeña investigación sobre la escena cultural que se formó en este sitio: quiénes escribieron, qué contaron
          y qué les une. Texto, recortes y collage a partir de las entradas reales del diario colectivo.
        </p>
        <nav className="fd-index" aria-label="Secciones del diario de campo">
          {INDICE.map((s) => (
            <a key={s.id} href={`#${s.id}`} className="fd-index__link">
              {s.label}
            </a>
          ))}
        </nav>
      </header>

      {/* 1 · Pregunta y objetivos */}
      <Seccion id="pregunta" numero="1" titulo="Pregunta y objetivos de investigación">
        <div className="fd-grid fd-grid--question">
          <div className="paper lined-soft fd-question">
            <span className="tape tape--lavender tape--top" aria-hidden="true" />
            <p className="label-hand">Mi pregunta</p>
            <p className="fd-question__text">{PREGUNTA}</p>
            <p className="label-hand">Objetivos</p>
            <ol className="fd-objectives">
              {OBJETIVOS.map((o) => (
                <li key={o}>{o}</li>
              ))}
            </ol>
          </div>
          <aside className="note note--sage fd-ficha" style={{ ['--tilt' as string]: '1.6deg' }} aria-label="Ficha de observación">
            <p className="hand note__title">
              Ficha de observación <Star size={20} className="ink-charcoal" />
            </p>
            <dl>
              {FICHA.map((f) => (
                <div key={f.etiqueta}>
                  <dt>{f.etiqueta}</dt>
                  <dd>{f.valor}</dd>
                </div>
              ))}
            </dl>
          </aside>
        </div>
      </Seccion>

      {/* 2 · Posición */}
      <Seccion id="posicion" numero="2" titulo="Mi posición como investigadora" peso="10 %">
        <div className="paper fd-text fd-position">
          <span className="tape tape--sage tape--corner-left" aria-hidden="true" />
          <span className="sticker sticker--static">observación participante</span>
          <Texto parrafos={POSICION} />
        </div>
      </Seccion>

      {/* 3 · Entrada del cuaderno de campo */}
      <Seccion id="entrada" numero="3" titulo="Cuaderno de campo creativo" peso="70 %" className="fd-entry">
        <p className="fd-entry__title hand">{ENTRADA_TITULO}</p>

        <div className="fd-grid fd-grid--entry">
          <div className="fd-ticket">
            <p className="fd-block-label">
              <span>1</span> Fecha, hora y espacio
            </p>
            <p className="fd-ticket__big hand">lun. 19 · oct · 2026</p>
            <p>
              <strong>20:19 → 23:26</strong> (hora de Ecuador)
            </p>
            <p>Escena virtual: el diario colectivo «we are not so different».</p>
          </div>

          <div className="paper lined fd-text fd-block--wide">
            <p className="fd-block-label">
              <span>2</span> Descripción de la escena
            </p>
            <Texto parrafos={DESCRIPCION} />
          </div>
        </div>

        {/* Línea de tiempo dibujada */}
        <figure className="fd-timeline paper" aria-labelledby="fd-timeline-cap">
          <figcaption id="fd-timeline-cap" className="hand">
            Así llegaron las páginas aquella noche
          </figcaption>
          <ol className="fd-timeline__list">
            {LLEGADAS.map((l) => (
              <li key={l.nombre} className={l.nombre === AUTORA ? 'is-me' : ''}>
                <span className="fd-timeline__dot" aria-hidden="true" />
                <span className="fd-timeline__time">{l.hora}</span>
                <span className="fd-timeline__name hand">
                  {l.nombre}
                  {l.nombre === AUTORA && ' (yo)'}
                </span>
              </li>
            ))}
          </ol>
          <p className="fd-timeline__note hand">
            siete páginas en diecisiete minutos
          </p>
        </figure>

        <div className="fd-grid fd-grid--two">
          <div className="note note--blue fd-sense" style={{ ['--tilt' as string]: '-1.2deg' }}>
            <p className="fd-block-label">
              <span>3</span> Impresiones sensoriales
            </p>
            <Texto parrafos={SENSORIAL} />
          </div>
          <div className="paper fd-text fd-feelings">
            <span className="tape tape--beige tape--top" aria-hidden="true" />
            <p className="fd-block-label">
              <span>4</span> Mis impresiones y reflexiones
            </p>
            <Texto parrafos={IMPRESIONES} />
          </div>
        </div>

        {/* Collage: material visual + frases */}
        <div className="fd-collage-wrap">
          <p className="fd-block-label fd-block-label--center">
            <span>5</span> Frases de quienes escribieron · material visual
          </p>
          <div className="fd-collage">
            {CITAS.map((c, i) => (
              <blockquote
                key={c.texto}
                className={`note note--${c.color} fd-quote`}
                // Notas en posiciones impares y fotos en pares: el collage las intercala.
                style={{ ['--tilt' as string]: `${(i % 2 ? 1 : -1) * (1 + (i % 3))}deg`, order: i * 2 + 1 }}
              >
                <p>«{c.texto}»</p>
                <cite className="hand">{c.autor}</cite>
              </blockquote>
            ))}

            {fotos?.map((e, i) => (
              <figure
                key={e.id}
                className="polaroid fd-photo"
                style={{ ['--tilt' as string]: `${tiltFor(e.id, 4)}deg`, order: i * 2 }}
              >
                <span className={`tape tape--${tapes[i % tapes.length]} tape--top`} aria-hidden="true" />
                <FramedPhoto src={e.photo} framing={e.photoFraming} alt={`Fotografía elegida por ${e.name}`} name={e.name} />
                <figcaption className="polaroid-caption">
                  <Link to={`/entradas/${e.id}`}>{e.name}</Link>
                </figcaption>
              </figure>
            ))}

            {!fotos && !error && <p className="fd-collage__status hand">pegando las fotos…</p>}
            {error && !fotos && (
              <p className="fd-collage__status">
                No se pudieron cargar las fotos ahora mismo.{' '}
                <button type="button" className="btn btn--small btn--ghost" onClick={reintentar}>
                  Intentar de nuevo
                </button>
              </p>
            )}

            <div className="fd-stickers" style={{ order: 7 }} aria-label="Intereses que aparecen en las entradas">
              <p className="hand fd-stickers__title">lo que nos gusta</p>
              <ul>
                {INTERESES.map((t, i) => (
                  <li key={t} style={{ ['--tilt' as string]: `${((i * 37) % 7) - 3}deg` }}>
                    {t}
                  </li>
                ))}
              </ul>
            </div>

            <Heart className="fd-doodle fd-doodle--a ink-lavender" size={34} />
            <Spiral className="fd-doodle fd-doodle--b ink-bluegray" size={40} />
            <Sparkle className="fd-doodle fd-doodle--c ink-sage" size={26} />
            <Flower className="fd-doodle fd-doodle--d ink-lavender" size={38} />
          </div>
        </div>

        <div className="fd-grid fd-grid--two">
          <div className="paper fd-text">
            <p className="fd-block-label">
              <span>6</span> Tres categorías culturales
            </p>
            <ol className="fd-cat-mini">
              {CATEGORIAS.map((c) => (
                <li key={c.titulo}>
                  <strong>{c.titulo}</strong> · <span className="fd-muted">{c.frecuencia}</span>
                </li>
              ))}
            </ol>
            <a href="#categorias" className="link-hand">
              ver el análisis completo ↓
            </a>
          </div>
          <div className="note note--pink fd-pending" style={{ ['--tilt' as string]: '1.4deg' }}>
            <p className="fd-block-label">
              <span>?</span> Lo que quiero observar después
            </p>
            <ul className="checklist">
              {PREGUNTAS_PENDIENTES.map((q) => (
                <li key={q}>{q}</li>
              ))}
            </ul>
          </div>
        </div>
      </Seccion>

      {/* 4 · Categorías y conclusión */}
      <Seccion id="categorias" numero="4" titulo="Tres categorías culturales y conclusión" peso="10 %">
        <div className="fd-categories">
          {CATEGORIAS.map((c, i) => (
            <div key={c.titulo} className="paper fd-category" style={{ ['--tilt' as string]: `${[-0.8, 0.6, -0.4][i]}deg` }}>
              <span className={`tape tape--${tapes[i]} tape--top`} aria-hidden="true" />
              <p className="fd-category__num hand">{i + 1}</p>
              <h3 className="fd-category__title hand">{c.titulo}</h3>
              <p className="fd-category__freq">{c.frecuencia}</p>
              <Texto parrafos={c.descripcion} />
              <p className="fd-category__who">
                <span className="label-hand">Aparece en: </span>
                {c.quienes}
              </p>
            </div>
          ))}
        </div>

        <div className="fd-grid fd-grid--two">
          <div className="note note--lavender fd-frequent" style={{ ['--tilt' as string]: '-0.8deg' }}>
            <p className="hand note__title">Temas más frecuentes (de 9 entradas)</p>
            <ul>
              {TEMAS_FRECUENTES.map((t) => (
                <li key={t.tema}>
                  <span>{t.tema}</span>
                  <span className="fd-frequent__count">
                    <Conteo n={t.veces} /> <strong>{t.veces}</strong>
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div className="paper lined-soft fd-text fd-conclusion">
            <p className="label-hand">¿Qué encontré?</p>
            <Texto parrafos={CONCLUSION} />
          </div>
        </div>
      </Seccion>

      {/* 5 · Proceso */}
      <Seccion id="proceso" numero="5" titulo="Reflexión sobre el proceso de observación" peso="10 %">
        <div className="paper fd-text fd-process">
          <span className="tape tape--bluegray tape--corner-right" aria-hidden="true" />
          <Texto parrafos={PROCESO} />
        </div>
      </Seccion>

      <aside className="fd-ethics" aria-label="Nota ética">
        <Heart size={18} className="ink-lavender" /> <span>{NOTA_ETICA}</span>
      </aside>

      <div className="about__cta">
        <Link to="/entradas" className="btn btn--ghost">
          Leer las entradas
        </Link>
        <Link to="/sobre-el-proyecto" className="btn">
          Sobre el proyecto
        </Link>
      </div>
    </article>
  );
}
