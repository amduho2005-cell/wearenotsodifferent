import { createHash } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import { rateLimitsCollection } from './db.js';
import { HttpError } from './types.js';

/*
 * Límite de peticiones por IP para las rutas que escriben.
 *
 * En Vercel cada invocación puede ejecutarse en una instancia distinta, así que
 * los contadores no pueden vivir en memoria: se guardan en MongoDB (colección
 * "rateLimits"), uno por ruta, IP y ventana de tiempo. Un índice TTL borra los
 * contadores caducados. De la IP solo se guarda un hash, nunca la dirección.
 */

/** Primera IP de X-Forwarded-For (la del cliente; Vercel sobrescribe la cabecera), o X-Real-IP. */
export function clientIp(req: Request): string {
  const forwarded = req.get('x-forwarded-for')?.split(',')[0]?.trim();
  return forwarded || req.get('x-real-ip')?.trim() || req.socket.remoteAddress || 'desconocida';
}

interface Rule {
  /** Nombre corto para el contador. */
  name: string;
  /** Peticiones permitidas por ventana. */
  max: number;
  windowMs: number;
  message: string;
}

function rule(name: string, envVar: string, fallback: number, windowMinutes: number, message: string): Rule {
  const fromEnv = Number(process.env[envVar]);
  return {
    name,
    max: Number.isInteger(fromEnv) && fromEnv > 0 ? fromEnv : fallback,
    windowMs: windowMinutes * 60_000,
    message,
  };
}

/*
 * Varias personas pueden compartir IP (un instituto, una biblioteca, datos
 * móviles), por eso los límites son holgados y se pueden cambiar con variables
 * de entorno sin tocar el código.
 */
export const RULES = {
  create: rule(
    'create',
    'RATE_LIMIT_CREATE',
    10,
    60,
    'Se han creado demasiadas entradas desde tu conexión en poco tiempo. Espera un rato e inténtalo de nuevo.',
  ),
  edit: rule(
    'edit',
    'RATE_LIMIT_EDIT',
    30,
    60,
    'Has guardado cambios demasiadas veces en poco tiempo. Espera un rato e inténtalo de nuevo.',
  ),
  verify: rule(
    'verify',
    'RATE_LIMIT_VERIFY',
    10,
    15,
    'Demasiados intentos de recuperar una entrada desde tu conexión. Espera unos minutos e inténtalo de nuevo.',
  ),
} satisfies Record<string, Rule>;

async function hit(key: string, expiresAt: Date): Promise<number> {
  const col = await rateLimitsCollection();
  for (let attempt = 0; ; attempt++) {
    try {
      const doc = await col.findOneAndUpdate(
        { _id: key },
        { $inc: { count: 1 }, $setOnInsert: { expiresAt } },
        { upsert: true, returnDocument: 'after' },
      );
      return doc?.count ?? 1;
    } catch (err) {
      // 11000: dos peticiones simultáneas crearon el mismo contador; la segunda vez ya existe.
      if ((err as { code?: number }).code !== 11000 || attempt > 0) throw err;
    }
  }
}

export function rateLimit(r: Rule) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const now = Date.now();
    const windowStart = Math.floor(now / r.windowMs) * r.windowMs;
    const ipHash = createHash('sha256').update(clientIp(req)).digest('hex').slice(0, 32);
    const count = await hit(`${r.name}:${ipHash}:${windowStart}`, new Date(windowStart + r.windowMs));

    if (count > r.max) {
      res.setHeader('Retry-After', String(Math.ceil((windowStart + r.windowMs - now) / 1000)));
      return next(new HttpError(429, r.message));
    }
    next();
  };
}
