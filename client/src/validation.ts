import type { FieldErrors } from './types';

// Mismas reglas que el servidor (server/src/validation.ts), para avisar antes de enviar.
export const LIMITS = {
  name: { min: 1, max: 40 },
  pronouns: { min: 1, max: 30 },
  interest: { min: 2, max: 80 },
  positiveExperience: { min: 20, max: 2000 },
  negativeExperience: { min: 0, max: 2000 },
  differenceReflection: { min: 10, max: 1500 },
  age: { min: 13, max: 99 },
} as const;

// 4 MB: Vercel rechaza peticiones de más de 4,5 MB.
export const MAX_PHOTO_BYTES = 4 * 1024 * 1024;
export const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export type TextField = keyof Omit<typeof LIMITS, 'age'>;

export interface FormValues {
  name: string;
  age: string;
  pronouns: string;
  interest: string;
  positiveExperience: string;
  negativeExperience: string;
  differenceReflection: string;
}

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

const PERSONAL_INFO = [
  { re: /[^\s@]+@[^\s@]+\.[a-z]{2,}/i, what: 'correos electrónicos' },
  { re: /(?:\+?\d[\s.\-()]*){9,}/, what: 'números de teléfono' },
  { re: /(?:https?:\/\/|www\.)\S+/i, what: 'enlaces' },
  { re: /(?:^|[\s(])@[\p{L}\d_.]{3,}/u, what: 'usuarios de redes sociales' },
];

export function validateForm(values: FormValues): FieldErrors {
  const errors: FieldErrors = {};

  for (const field of Object.keys(LABELS) as TextField[]) {
    const value = values[field].trim();
    const { min, max } = LIMITS[field];
    const label = LABELS[field];
    if (min > 0 && value.length === 0) errors[field] = REQUIRED[field];
    else if (value.length > 0 && value.length < min)
      errors[field] = `${label}: escribe al menos ${min} caracteres (ahora hay ${value.length}).`;
    else if (value.length > max) errors[field] = `${label}: máximo ${max} caracteres (ahora hay ${value.length}).`;
    else {
      const hit = PERSONAL_INFO.find((p) => p.re.test(value));
      if (hit) errors[field] = `Por tu seguridad, no incluyas ${hit.what}. Este diario no publica datos de contacto.`;
    }
  }

  const age = values.age.trim();
  const n = Number(age);
  if (!age) errors.age = 'Indica tu edad.';
  else if (!Number.isInteger(n) || n < LIMITS.age.min || n > LIMITS.age.max)
    errors.age = `La edad debe ser un número entero entre ${LIMITS.age.min} y ${LIMITS.age.max}.`;

  return errors;
}

export function validatePhoto(file: File): string | null {
  if (!PHOTO_TYPES.includes(file.type)) return 'La fotografía debe ser JPG, PNG o WebP.';
  if (file.size > MAX_PHOTO_BYTES)
    return `La fotografía pesa ${(file.size / 1024 / 1024).toFixed(1)} MB. El máximo es 4 MB.`;
  return null;
}
