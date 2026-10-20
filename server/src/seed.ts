import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { closeDb, entriesCollection } from './db.js';
import { searchTextOf } from './store.js';
import { SEED_FILE } from './paths.js';
import type { StoredEntry } from './types.js';

/*
 * Carga entradas en MongoDB desde un archivo JSON.
 *   npm run seed                        → datos de ejemplo (data/entries.seed.json)
 *   npm run seed -- ruta/entries.json   → por ejemplo, para migrar el antiguo entries.json
 * Si una entrada con el mismo id ya existe, se sobrescribe; el resto no se toca.
 */

const file = process.argv[2] ? path.resolve(process.argv[2]) : SEED_FILE;

try {
  const entries = JSON.parse(await readFile(file, 'utf8')) as StoredEntry[];
  if (!Array.isArray(entries)) throw new Error(`${file} debe contener un array de entradas.`);

  const col = await entriesCollection();
  for (const entry of entries) {
    const { _id, ...doc } = entry as StoredEntry & { _id?: unknown };
    await col.updateOne({ id: doc.id }, { $set: { ...doc, searchText: searchTextOf(doc) } }, { upsert: true });
  }
  console.log(`🌱 ${entries.length} entradas cargadas en MongoDB desde ${path.basename(file)}`);
} finally {
  await closeDb();
}
