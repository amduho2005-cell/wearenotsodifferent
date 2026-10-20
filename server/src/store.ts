import { randomBytes } from 'node:crypto';
import { entriesCollection } from './db.js';
import type { PublicEntry, StoredEntry } from './types.js';

/*
 * Almacenamiento en MongoDB (colección "entries").
 *
 * MongoDB escribe cada documento de forma atómica, así que ya no hace falta la
 * cola de escrituras ni el archivo temporal de la versión con JSON. El campo
 * "id" tiene un índice único (ver db.ts).
 */

/** Campos que nunca salen de la base de datos hacia el público. */
const HIDDEN = { _id: 0, editKeyHash: 0, searchText: 0 } as const;

export function toPublic(entry: StoredEntry): PublicEntry {
  const { editKeyHash: _key, searchText: _search, ...rest } = entry;
  return rest;
}

/** Minúsculas y sin tildes, para que "dragon" encuentre "dragón". */
export function fold(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

export function searchTextOf(e: StoredEntry): string {
  return fold(
    [e.name, String(e.age), e.pronouns, e.interest, e.positiveExperience, e.negativeExperience, e.differenceReflection].join(
      '\n',
    ),
  );
}

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export interface ListOptions {
  q?: string;
  sort?: 'asc' | 'desc';
  limit?: number;
}

export async function listEntries({ q = '', sort = 'desc', limit }: ListOptions) {
  const col = await entriesCollection();
  const terms = fold(q).split(/\s+/).filter(Boolean);
  // Todas las palabras deben aparecer, en cualquier campo público.
  const filter = terms.length ? { $and: terms.map((t) => ({ searchText: { $regex: escapeRegex(t) } })) } : {};

  const total = await col.countDocuments(filter);
  let cursor = col.find(filter, { projection: HIDDEN }).sort({ createdAt: sort === 'asc' ? 1 : -1 });
  if (limit && limit > 0) cursor = cursor.limit(limit);
  return { total, entries: (await cursor.toArray()) as PublicEntry[] };
}

export async function getEntry(id: string): Promise<StoredEntry | undefined> {
  const col = await entriesCollection();
  return (await col.findOne({ id }, { projection: { _id: 0, searchText: 0 } })) ?? undefined;
}

export async function createEntry(data: Omit<StoredEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<StoredEntry> {
  const col = await entriesCollection();
  const now = new Date().toISOString();
  for (;;) {
    const entry: StoredEntry = { id: `entrada-${randomBytes(4).toString('hex')}`, ...data, createdAt: now, updatedAt: now };
    try {
      // Se inserta una copia: el driver añade _id al objeto que recibe.
      await col.insertOne({ ...entry, searchText: searchTextOf(entry) });
      return entry;
    } catch (err) {
      // 11000 = id repetido (muy improbable): se genera otro.
      if ((err as { code?: number }).code !== 11000) throw err;
    }
  }
}

export async function updateEntry(
  id: string,
  changes: Partial<Omit<StoredEntry, 'id' | 'createdAt' | 'updatedAt' | 'editKeyHash' | 'searchText'>>,
): Promise<{ before: StoredEntry; after: StoredEntry } | undefined> {
  const col = await entriesCollection();
  const before = await getEntry(id);
  if (!before) return undefined;

  const after: StoredEntry = { ...before, ...changes, updatedAt: new Date().toISOString() };
  const result = await col.updateOne(
    { id },
    { $set: { ...changes, updatedAt: after.updatedAt, searchText: searchTextOf(after) } },
  );
  return result.matchedCount ? { before, after } : undefined;
}

export async function isPhotoInUse(photo: string): Promise<boolean> {
  const col = await entriesCollection();
  return (await col.countDocuments({ photo }, { limit: 1 })) > 0;
}
