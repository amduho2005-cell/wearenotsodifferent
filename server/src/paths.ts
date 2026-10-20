import path from 'node:path';
import { fileURLToPath } from 'node:url';

// src/ (con tsx) y dist/ (compilado) están al mismo nivel, así que la raíz es la carpeta superior.
const here = path.dirname(fileURLToPath(import.meta.url));

export const SERVER_ROOT = path.resolve(here, '..');
export const DATA_DIR = path.join(SERVER_ROOT, 'data');
export const SEED_FILE = path.join(DATA_DIR, 'entries.seed.json');
export const UPLOADS_DIR = path.join(SERVER_ROOT, 'uploads');
export const CLIENT_DIST = path.resolve(SERVER_ROOT, '..', 'client', 'dist');
