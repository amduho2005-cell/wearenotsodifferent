import type { EntryInput, FieldErrors, PhotoFraming } from './types.js';

export const LIMITS = {
  name: { min: 1, max: 40 },
  pronouns: { min: 1, max: 30 },
  interest: { min: 2, max: 80 },
  positiveExperience: { min: 20, max: 2000 },
  negativeExperience: { min: 0, max: 2000 },
  differenceReflection: { min: 10, max: 1500 },
  age: { min: 13, max: 99 },
} as const;

type TextField = 'name' | 'pronouns' | 'interest' | 'positiveExperience' | 'negativeExperience' | 'differenceReflection';

const LABELS: Record<TextField, string> = {
  name: 'Nombre o seudónimo',
  pronouns: 'Pronombres',
  interest: 'Interés',
  positiveExperience: 'Experiencia positiva',
  negativeExperience: 'Experiencia negativa',
  differenceReflection: 'Reflexión',
};

const REQUIRED: Record<TextField, string> = {
  name: 'Escribe un nombre o seudónimo.',
  pronouns: 'Indica tus pronombres.',
  interest: 'Cuéntanos cuál es tu interés.',
  positiveExperience: 'Cuenta una experiencia positiva que hayas vivido gracias a tu interés.',
  negativeExperience: '',
  differenceReflection: 'Responde a la pregunta: ¿te consideras extraño o diferente al resto?',
};

const SINGLE_LINE: TextField[] = ['name', 'pronouns', 'interest'];

/** Patrones de información personal que no debe publicarse en el diario. */
const PERSONAL_INFO = [
  { re: /[^\s@]+@[^\s@]+\.[a-z]{2,}/i, what: 'correos electrónicos' },
  { re: /(?:\+?\d[\s.\-()]*){9,}/, what: 'números de teléfono' },
  { re: /(?:https?:\/\/|www\.)\S+/i, what: 'enlaces' },
  { re: /(?:^|[\s(])@[\p{L}\d_.]{3,}/u, what: 'usuarios de redes sociales' },
];

export function findPersonalInfo(text: string): string | null {
  const hit = PERSONAL_INFO.find((p) => p.re.test(text));
  return hit ? hit.what : null;
}

function clean(value: unknown, singleLine: boolean): string {
  if (typeof value !== 'string') return '';
  let text = value.normalize('NFC').replace(/\r\n?/g, '\n');
  // Fuera caracteres de control (salvo saltos de línea y tabuladores).
  text = text.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '');
  if (singleLine) text = text.replace(/\s+/g, ' ');
  else text = text.replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n');
  return text.trim();
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

export function parseFraming(body: Record<string, unknown>): PhotoFraming {
  const num = (v: unknown, fallback: number) => {
    const n = typeof v === 'string' || typeof v === 'number' ? Number(v) : NaN;
    return Number.isFinite(n) ? n : fallback;
  };
  return {
    x: Math.round(clamp(num(body.photoX, 50), 0, 100) * 10) / 10,
    y: Math.round(clamp(num(body.photoY, 50), 0, 100) * 10) / 10,
    zoom: Math.round(clamp(num(body.photoZoom, 1), 1, 3) * 100) / 100,
  };
}

export function validateEntryInput(body: Record<string, unknown>): { data?: EntryInput; errors?: FieldErrors } {
  const errors: FieldErrors = {};
  const text = {} as Record<TextField, string>;

  for (const field of Object.keys(LABELS) as TextField[]) {
    const value = clean(body[field], SINGLE_LINE.includes(field));
    const { min, max } = LIMITS[field];
    const label = LABELS[field];
    text[field] = value;

    if (min > 0 && value.length === 0) {
      errors[field] = REQUIRED[field];
    } else if (value.length > 0 && value.length < min) {
      errors[field] = `${label}: escribe al menos ${min} caracteres (ahora hay ${value.length}).`;
    } else if (value.length > max) {
      errors[field] = `${label}: máximo ${max} caracteres (ahora hay ${value.length}).`;
    } else {
      const personal = findPersonalInfo(value);
      if (personal) {
        errors[field] = `Por tu seguridad, no incluyas ${personal}. Este diario no publica datos de contacto.`;
      }
    }
  }

  const rawAge = typeof body.age === 'string' ? body.age.trim() : body.age;
  const age = typeof rawAge === 'number' ? rawAge : rawAge === '' || rawAge == null ? NaN : Number(rawAge);
  if (rawAge === '' || rawAge == null) {
    errors.age = 'Indica tu edad.';
  } else if (!Number.isInteger(age) || age < LIMITS.age.min || age > LIMITS.age.max) {
    errors.age = `La edad debe ser un número entero entre ${LIMITS.age.min} y ${LIMITS.age.max}.`;
  }

  if (Object.keys(errors).length) return { errors };
  return { data: { ...text, age, photoFraming: parseFraming(body) } };
}
