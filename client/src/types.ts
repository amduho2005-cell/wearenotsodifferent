export interface PhotoFraming {
  x: number;
  y: number;
  zoom: number;
}

export interface Entry {
  id: string;
  photo: string | null;
  photoFraming: PhotoFraming;
  name: string;
  age: number;
  pronouns: string;
  interest: string;
  positiveExperience: string;
  negativeExperience: string;
  differenceReflection: string;
  createdAt: string;
  updatedAt: string;
  isSample?: boolean;
}

export type FieldName =
  | 'photo'
  | 'name'
  | 'age'
  | 'pronouns'
  | 'interest'
  | 'positiveExperience'
  | 'negativeExperience'
  | 'differenceReflection';

export type FieldErrors = Partial<Record<FieldName, string>>;

export const DEFAULT_FRAMING: PhotoFraming = { x: 50, y: 50, zoom: 1 };
