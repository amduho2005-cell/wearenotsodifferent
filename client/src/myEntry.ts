/*
 * Identificación sencilla de "mi entrada" sin cuentas: este navegador recuerda
 * el id de la entrada y su código de edición en localStorage. Con esos dos datos
 * se puede recuperar la entrada desde otro navegador.
 */

const STORAGE_KEY = 'wansd:my-entry';

export interface MyEntryRef {
  id: string;
  editKey: string;
}

export function loadMyEntry(): MyEntryRef | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<MyEntryRef>;
    return typeof parsed.id === 'string' && typeof parsed.editKey === 'string'
      ? { id: parsed.id, editKey: parsed.editKey }
      : null;
  } catch {
    return null;
  }
}

/** Devuelve false si el navegador no permite guardar (modo privado estricto, etc.). */
export function saveMyEntry(ref: MyEntryRef): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ref));
    return true;
  } catch {
    return false;
  }
}

export function forgetMyEntry(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* nada que hacer */
  }
}
