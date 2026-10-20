import { existsSync } from 'node:fs';
import path from 'node:path';
import express, { type NextFunction, type Request, type Response } from 'express';
import multer from 'multer';
import { CLIENT_DIST, UPLOADS_DIR } from './paths.js';
import { createEntry, getEntry, isPhotoInUse, listEntries, toPublic, updateEntry } from './store.js';
import { validateEntryInput } from './validation.js';
import { deleteUploadedPhoto, finalizeUpload, MAX_PHOTO_BYTES, photoUpload, usesBlobStorage } from './uploads.js';
import { editKeyMatches, generateEditKey, hashEditKey } from './editKey.js';
import { HttpError } from './types.js';
import { rateLimit, RULES } from './rateLimit.js';

// API_PORT (y no PORT) para no chocar con herramientas que definen PORT para el cliente.
const PORT = Number(process.env.API_PORT) || 4000;
const app = express();

app.disable('x-powered-by');
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  next();
});
app.use(express.json({ limit: '10kb' }));

// Solo en local sin Blob: las fotos se sirven desde server/uploads/.
if (!usesBlobStorage) app.use('/uploads', express.static(UPLOADS_DIR, { maxAge: '1h', index: false }));

// ---------- API ----------

app.get('/api/entries', async (req, res) => {
  const q = typeof req.query.q === 'string' ? req.query.q.slice(0, 100) : '';
  const sort = req.query.sort === 'asc' ? 'asc' : 'desc';
  const limit = Number(req.query.limit);
  res.json(await listEntries({ q, sort, limit: Number.isInteger(limit) && limit > 0 ? Math.min(limit, 100) : undefined }));
});

app.get('/api/entries/:id', async (req, res) => {
  const entry = await getEntry(req.params.id);
  if (!entry) throw new HttpError(404, 'No encontramos esta entrada. Puede que el enlace no sea correcto.');
  res.json({ entry: toPublic(entry) });
});

/** Ejecuta multer y convierte sus errores en mensajes claros. */
function receivePhoto(req: Request, res: Response, next: NextFunction) {
  photoUpload(req, res, (err: unknown) => {
    if (!err) return next();
    if (err instanceof multer.MulterError) {
      const message =
        err.code === 'LIMIT_FILE_SIZE'
          ? `La fotografía pesa demasiado. El máximo es ${MAX_PHOTO_BYTES / 1024 / 1024} MB.`
          : err.code === 'LIMIT_FIELD_VALUE'
            ? 'Uno de los textos es demasiado largo.'
            : 'No pudimos procesar el formulario. Inténtalo de nuevo.';
      return next(new HttpError(err.code === 'LIMIT_FILE_SIZE' ? 413 : 400, message, err.code === 'LIMIT_FILE_SIZE' ? { photo: message } : undefined));
    }
    next(err);
  });
}

async function requireEditKey(req: Request, _res: Response, next: NextFunction) {
  const entry = await getEntry(String(req.params.id));
  if (!entry) return next(new HttpError(404, 'No encontramos esta entrada.'));
  if (entry.isSample || !entry.editKeyHash) {
    return next(new HttpError(403, 'Las entradas de ejemplo no se pueden editar.'));
  }
  if (!editKeyMatches(req.get('x-edit-key'), entry.editKeyHash)) {
    return next(new HttpError(403, 'El código de edición no coincide con esta entrada.'));
  }
  next();
}

// El límite va antes de recibir la foto, para no subir nada a Blob si se rechaza.
app.post('/api/entries', rateLimit(RULES.create), receivePhoto, async (req, res, next) => {
  try {
    const { data, errors } = validateEntryInput(req.body ?? {});
    if (errors) throw new HttpError(400, 'Revisa los campos marcados antes de guardar.', errors);

    const photo = req.file ? await finalizeUpload(req.file) : null;
    const editKey = generateEditKey();
    const entry = await createEntry({ ...data!, photo, editKeyHash: hashEditKey(editKey) });
    res.status(201).json({ entry: toPublic(entry), editKey });
  } catch (err) {
    next(err);
  }
});

app.put('/api/entries/:id', rateLimit(RULES.edit), requireEditKey, receivePhoto, async (req, res, next) => {
  let newPhoto: string | null = null;
  try {
    const { data, errors } = validateEntryInput(req.body ?? {});
    if (errors) throw new HttpError(400, 'Revisa los campos marcados antes de guardar.', errors);

    const changes: Parameters<typeof updateEntry>[1] = { ...data! };
    if (req.file) {
      newPhoto = await finalizeUpload(req.file);
      changes.photo = newPhoto;
    } else if (req.body.removePhoto === 'true') {
      changes.photo = null;
    }

    const result = await updateEntry(req.params.id as string, changes);
    if (!result) throw new HttpError(404, 'No encontramos esta entrada.');

    // La foto anterior solo se borra cuando la nueva versión ya está guardada.
    const oldPhoto = result.before.photo;
    if (oldPhoto && oldPhoto !== result.after.photo && !(await isPhotoInUse(oldPhoto))) {
      await deleteUploadedPhoto(oldPhoto).catch(() => undefined);
    }
    res.json({ entry: toPublic(result.after) });
  } catch (err) {
    if (newPhoto) await deleteUploadedPhoto(newPhoto).catch(() => undefined);
    next(err);
  }
});

/** Permite recuperar la entrada propia en otro navegador con su id y su código. */
app.post('/api/entries/:id/verify', rateLimit(RULES.verify), async (req, res) => {
  const entry = await getEntry(String(req.params.id));
  if (!entry || !editKeyMatches(req.body?.editKey, entry.editKeyHash)) {
    throw new HttpError(403, 'No encontramos ninguna entrada con ese identificador y código de edición.');
  }
  res.json({ entry: toPublic(entry) });
});

app.use('/api', () => {
  throw new HttpError(404, 'Ruta de la API no encontrada.');
});

// ---------- Cliente compilado (opcional: npm run build en client/) ----------

if (existsSync(CLIENT_DIST)) {
  app.use(express.static(CLIENT_DIST));
  app.use((req, res, next) => {
    if (req.method !== 'GET' || req.path.startsWith('/uploads/')) return next();
    res.sendFile(path.join(CLIENT_DIST, 'index.html'));
  });
}

// ---------- Errores ----------

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message, fields: err.fields });
    return;
  }
  if (err instanceof SyntaxError) {
    res.status(400).json({ error: 'La petición no tiene un formato válido.' });
    return;
  }
  console.error(err);
  if (err instanceof Error && err.name.startsWith('Mongo')) {
    res.status(503).json({ error: 'No pudimos conectar con la base de datos. Inténtalo de nuevo en unos segundos.' });
    return;
  }
  res.status(500).json({ error: 'Algo salió mal en el servidor. Tus datos no se han modificado.' });
});

// Vercel importa la app desde este export; en local se arranca el servidor.
export default app;

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`📔 we are not so different · API escuchando en http://localhost:${PORT}`);
  });
}
