import { MongoClient, type Collection } from 'mongodb';
import type { StoredEntry } from './types.js';

const uri = process.env.MONGODB_URI;
if (!uri) {
  throw new Error(
    'Falta la variable de entorno MONGODB_URI. Crea server/.env a partir de server/.env.example (ver README).',
  );
}

// Una sola conexión por proceso. En serverless (Vercel), guardarla en globalThis
// permite reutilizarla entre invocaciones en lugar de abrir una nueva cada vez.
const g = globalThis as unknown as { _wansdMongo?: Promise<MongoClient> };
const clientPromise = (g._wansdMongo ??= new MongoClient(uri, { serverSelectionTimeoutMS: 10_000 }).connect());

let indexesReady: Promise<unknown> | undefined;

export async function entriesCollection(): Promise<Collection<StoredEntry>> {
  const client = await clientPromise;
  const col = client.db(process.env.MONGODB_DB || 'wansd').collection<StoredEntry>('entries');
  // Se crean una vez por proceso; si ya existen, MongoDB no hace nada.
  indexesReady ??= Promise.all([col.createIndex({ id: 1 }, { unique: true }), col.createIndex({ createdAt: -1 })]).catch(
    (err) => {
      indexesReady = undefined; // reintentar en la siguiente petición
      throw err;
    },
  );
  await indexesReady;
  return col;
}

export async function closeDb(): Promise<void> {
  if (g._wansdMongo) await (await g._wansdMongo).close();
}
