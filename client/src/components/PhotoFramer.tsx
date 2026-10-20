import { useRef, type PointerEvent } from 'react';
import type { PhotoFraming } from '../types';
import { DEFAULT_FRAMING } from '../types';
import { FramedPhoto } from './FramedPhoto';

interface Props {
  src: string;
  framing: PhotoFraming;
  onChange: (framing: PhotoFraming) => void;
  name: string;
}

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));
const round = (n: number) => Math.round(n * 10) / 10;

/** Previsualización con encuadre: arrastrar para mover y deslizadores para ajustar con precisión. */
export function PhotoFramer({ src, framing, onChange, name }: Props) {
  const drag = useRef<{ x: number; y: number; start: PhotoFraming } | null>(null);

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY, start: framing };
  };

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!drag.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const { start } = drag.current;
    // Arrastrar hacia la derecha muestra más de la parte izquierda de la foto.
    const dx = ((e.clientX - drag.current.x) / rect.width) * 100 * (1.4 / start.zoom);
    const dy = ((e.clientY - drag.current.y) / rect.height) * 100 * (1.4 / start.zoom);
    onChange({ ...start, x: round(clamp(start.x - dx, 0, 100)), y: round(clamp(start.y - dy, 0, 100)) });
  };

  const endDrag = () => {
    drag.current = null;
  };

  return (
    <div className="framer">
      <div
        className="framer-stage polaroid"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        title="Arrastra para mover la foto"
      >
        <span className="tape tape--lavender tape--top" aria-hidden="true" />
        <FramedPhoto src={src} framing={framing} alt="Vista previa de tu fotografía" name={name} />
        <p className="polaroid-caption">vista previa · arrastra para mover</p>
      </div>

      <fieldset className="framer-controls">
        <legend>Encuadre</legend>
        <label>
          <span>Acercar</span>
          <input
            type="range"
            min={1}
            max={3}
            step={0.05}
            value={framing.zoom}
            onChange={(e) => onChange({ ...framing, zoom: Number(e.target.value) })}
          />
        </label>
        <label>
          <span>Horizontal</span>
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={framing.x}
            onChange={(e) => onChange({ ...framing, x: Number(e.target.value) })}
          />
        </label>
        <label>
          <span>Vertical</span>
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={framing.y}
            onChange={(e) => onChange({ ...framing, y: Number(e.target.value) })}
          />
        </label>
        <button type="button" className="btn btn--small btn--ghost" onClick={() => onChange(DEFAULT_FRAMING)}>
          Centrar de nuevo
        </button>
      </fieldset>
    </div>
  );
}
