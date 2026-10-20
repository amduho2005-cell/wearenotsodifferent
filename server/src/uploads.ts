import { promises as fs } from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import multer from 'multer';
import { del, put } from '@vercel/blob';
import { UPLOADS_DIR } from './paths.js';
import { HttpError } from './types.js';

/*
 * Fotografías.
 *
 * - En Vercel (o en local si hay BLOB_READ_WRITE_TOKEN) se guardan en Vercel Blob
 *   y en la base de datos se guarda su URL pública.
 * - En local sin token se guardan en server/uploads/ y se sirven en /uploads/.
 *
 * El límite es de 4 MB porque Vercel rechaza peticiones de más de 4,5 MB.
 */

export const MAX_PHOTO_BYTES = 4 * 1024 * 1024;
const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);
const FORMAT_MESSAGE = 'La fotografía debe ser JPG, PNG o WebP.';
const CONTENT_TYPES = { jpg: 'image/jpeg', png: 'image/png', webp: 'image/webp' } as const;

type ImageType = keyof typeof CONTENT_TYPES;

/** Vercel no tiene disco persistente: allí siempre se usa Blob. */
export const usesBlobStorage = Boolean(process.env.VERCEL || process.env.BLOB_READ_WRITE_TOKEN);

export const photoUpload = multer({
  // En memoria: la foto se valida antes de guardarla en ningún sitio.
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_PHOTO_BYTES, files: 1, fields: 20, fieldSize: 16 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME.has(file.mimetype)) cb(null, true);
    else cb(new HttpError(400, FORMAT_MESSAGE, { photo: FORMAT_MESSAGE }));
  },
}).single('photo');

/** Comprueba la "firma" del archivo, sin fiarse de la extensión ni del tipo declarado. */
function detectImageType(buf: Buffer): ImageType | null {
  if (buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpg';
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'png';
  if (buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') return 'webp';
  return null;
}

/** Valida y guarda la foto subida. Devuelve la URL o ruta pública con la que se mostrará. */
export async function finalizeUpload(file: Express.Multer.File): Promise<string> {
  const type = detectImageType(file.buffer);
  if (!type) {
    throw new HttpError(400, FORMAT_MESSAGE, {
      photo: 'El archivo no parece una imagen JPG, PNG o WebP válida.',
    });
  }
  const name = `${randomUUID()}.${type}`;

  if (usesBlobStorage) {
    const blob = await put(`fotos/${name}`, file.buffer, { access: 'public', contentType: CONTENT_TYPES[type] });
    return blob.url;
  }

  await fs.mkdir(UPLOADS_DIR, { recursive: true });
  await fs.writeFile(path.join(UPLOADS_DIR, name), file.buffer);
  return `/uploads/${name}`;
}

const OWN_LOCAL_UPLOAD = /^\/uploads\/[0-9a-f-]{36}\.(jpg|png|webp)$/;

function isOwnBlobUrl(url: string): boolean {
  try {
    const { protocol, hostname, pathname } = new URL(url);
    return protocol === 'https:' && hostname.endsWith('.blob.vercel-storage.com') && pathname.startsWith('/fotos/');
  } catch {
    return false;
  }
}

/** Borra una foto subida por una persona (nunca las ilustraciones de ejemplo ni rutas extrañas). */
export async function deleteUploadedPhoto(photo: string | null): Promise<void> {
  if (!photo) return;
  if (isOwnBlobUrl(photo)) {
    await del(photo);
  } else if (OWN_LOCAL_UPLOAD.test(photo)) {
    await fs.rm(path.join(UPLOADS_DIR, path.basename(photo)), { force: true });
  }
}
