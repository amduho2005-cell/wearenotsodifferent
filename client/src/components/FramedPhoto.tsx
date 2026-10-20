import type { PhotoFraming } from '../types';
import { DEFAULT_FRAMING } from '../types';
import { PhotoPlaceholder } from './Doodles';

interface Props {
  src: string | null;
  framing?: PhotoFraming;
  alt: string;
  name: string;
  className?: string;
}

/**
 * Muestra una foto recortada en formato 4:5 respetando el encuadre elegido:
 * el punto (x %, y %) de la imagen queda anclado al mismo punto del marco
 * y el zoom se aplica alrededor de él.
 */
export function FramedPhoto({ src, framing = DEFAULT_FRAMING, alt, name, className }: Props) {
  return (
    <div className={`framed-photo ${className ?? ''}`}>
      {src ? (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          draggable={false}
          style={{
            objectPosition: `${framing.x}% ${framing.y}%`,
            transformOrigin: `${framing.x}% ${framing.y}%`,
            transform: `scale(${framing.zoom})`,
          }}
        />
      ) : (
        <PhotoPlaceholder initial={name.trim().charAt(0).toUpperCase() || '?'} />
      )}
    </div>
  );
}
