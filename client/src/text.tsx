import type { ReactNode } from 'react';
import type { Entry } from './types';

/** Pliega un texto carácter a carácter (minúsculas, sin tildes) conservando la longitud. */
function foldChars(text: string): string {
  let out = '';
  for (const ch of text) {
    const folded = ch.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
    // Mantener 1:1 con las unidades UTF-16 del original para que los índices coincidan.
    out += folded.length === ch.length ? folded : ch;
  }
  return out;
}

export function searchTerms(q: string): string[] {
  return foldChars(q).split(/\s+/).filter(Boolean);
}

/** Resalta con <mark> las apariciones de los términos de búsqueda. */
export function highlight(text: string, terms: string[]): ReactNode {
  if (!terms.length) return text;
  const folded = foldChars(text);
  const ranges: [number, number][] = [];
  for (const term of terms) {
    let from = 0;
    let at: number;
    while ((at = folded.indexOf(term, from)) !== -1) {
      ranges.push([at, at + term.length]);
      from = at + term.length;
    }
  }
  if (!ranges.length) return text;
  ranges.sort((a, b) => a[0] - b[0]);
  const merged: [number, number][] = [];
  for (const r of ranges) {
    const last = merged[merged.length - 1];
    if (last && r[0] <= last[1]) last[1] = Math.max(last[1], r[1]);
    else merged.push([...r]);
  }
  const nodes: ReactNode[] = [];
  let cursor = 0;
  merged.forEach(([s, e], i) => {
    if (s > cursor) nodes.push(text.slice(cursor, s));
    nodes.push(<mark key={i}>{text.slice(s, e)}</mark>);
    cursor = e;
  });
  if (cursor < text.length) nodes.push(text.slice(cursor));
  return nodes;
}

function clip(text: string, start: number, length: number): string {
  let s = Math.max(0, start);
  let e = Math.min(text.length, s + length);
  if (s > 0) s = text.indexOf(' ', s) + 1 || s;
  if (e < text.length) e = text.lastIndexOf(' ', e) > s ? text.lastIndexOf(' ', e) : e;
  return `${s > 0 ? '… ' : ''}${text.slice(s, e).trim()}${e < text.length ? ' …' : ''}`;
}

/**
 * Extracto breve para las tarjetas. Si hay búsqueda, muestra el fragmento de texto
 * donde aparece el primer término, para que se entienda por qué salió la entrada.
 */
export function excerptFor(entry: Entry, terms: string[], length = 170): string {
  const fields = [entry.positiveExperience, entry.negativeExperience, entry.differenceReflection];
  for (const term of terms) {
    for (const field of fields) {
      const at = foldChars(field).indexOf(term);
      if (at !== -1) return clip(field, at - 60, length);
    }
  }
  return clip(entry.positiveExperience, 0, length);
}

const dateFormat = new Intl.DateTimeFormat('es', { day: 'numeric', month: 'long', year: 'numeric' });

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : dateFormat.format(d);
}

/** Pequeña rotación estable por entrada, para que el collage parezca hecho a mano. */
export function tiltFor(id: string, max = 2.2): number {
  let h = 0;
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) | 0;
  return ((Math.abs(h) % 1000) / 1000) * max * 2 - max;
}
