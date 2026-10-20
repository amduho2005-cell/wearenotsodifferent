import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

/*
 * "Código de edición": identificador sencillo para reconocer la entrada propia
 * sin un sistema de cuentas. Se entrega una sola vez al crear la entrada y en el
 * JSON solo se guarda su hash.
 */

export function generateEditKey(): string {
  const hex = randomBytes(6).toString('hex');
  return `${hex.slice(0, 4)}-${hex.slice(4, 8)}-${hex.slice(8, 12)}`;
}

function canonical(key: string): string {
  return key.toLowerCase().replace(/[^0-9a-f]/g, '');
}

export function hashEditKey(key: string): string {
  return createHash('sha256').update(canonical(key)).digest('hex');
}

export function editKeyMatches(key: unknown, storedHash: string | undefined): boolean {
  if (typeof key !== 'string' || !storedHash || canonical(key).length !== 12) return false;
  const a = Buffer.from(hashEditKey(key), 'hex');
  const b = Buffer.from(storedHash, 'hex');
  return a.length === b.length && timingSafeEqual(a, b);
}
