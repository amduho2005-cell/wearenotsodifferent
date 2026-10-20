/** Encuadre de la fotografía: punto de anclaje (0-100 %) y zoom (1-3). */
export interface PhotoFraming {
  x: number;
  y: number;
  zoom: number;
}

/** Campos que la persona escribe en su entrada. */
export interface EntryInput {
  name: string;
  age: number;
  pronouns: string;
  interest: string;
  positiveExperience: string;
  negativeExperience: string;
  differenceReflection: string;
  photoFraming: PhotoFraming;
}

/** Entrada tal y como se muestra públicamente. */
export interface PublicEntry extends EntryInput {
  id: string;
  photo: string | null;
  createdAt: string;
  updatedAt: string;
  /** true en los datos de ejemplo ficticios. */
  isSample?: boolean;
}

/** Entrada tal y como se guarda en MongoDB (incluye datos que nunca se publican). */
export interface StoredEntry extends PublicEntry {
  editKeyHash?: string;
  /** Todos los campos públicos en minúsculas y sin tildes, para la búsqueda. */
  searchText?: string;
  /** true si se ha ocultado por moderación (npm run moderate): no aparece en ningún sitio. */
  hidden?: boolean;
}

export type FieldName = keyof Omit<EntryInput, 'photoFraming'> | 'photo';
export type FieldErrors = Partial<Record<FieldName, string>>;

/** Error con mensaje pensado para mostrarse a la persona usuaria. */
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
    public fields?: FieldErrors,
  ) {
    super(message);
  }
}
