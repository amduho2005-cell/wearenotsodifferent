// Garabatos decorativos dibujados a mano (SVG). Todos son decorativos: aria-hidden.

interface DoodleProps {
  className?: string;
  size?: number;
}

const base = (size: number, className?: string) => ({
  width: size,
  height: size,
  className: `doodle ${className ?? ''}`,
  'aria-hidden': true as const,
  focusable: 'false' as const,
});

export function Star({ className, size = 28 }: DoodleProps) {
  return (
    <svg viewBox="0 0 32 32" {...base(size, className)}>
      <path
        d="M16 3l3.6 8.2 8.9.8-6.7 5.9 2 8.7L16 22l-7.8 4.6 2-8.7L3.5 12l8.9-.8z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Sparkle({ className, size = 24 }: DoodleProps) {
  return (
    <svg viewBox="0 0 24 24" {...base(size, className)}>
      <path d="M12 2c.8 5 2.6 7.6 9 10-6.4 2.4-8.2 5-9 10-.8-5-2.6-7.6-9-10 6.4-2.4 8.2-5 9-10z" fill="currentColor" />
    </svg>
  );
}

export function Heart({ className, size = 28 }: DoodleProps) {
  return (
    <svg viewBox="0 0 32 32" {...base(size, className)}>
      <path
        d="M16 27C6 20 2.5 14.5 4.5 9.5 6.5 4.8 12.5 4.6 16 9.6c3.5-5 9.5-4.8 11.5-.1 2 5-1.5 10.5-11.5 17.5z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Spiral({ className, size = 34 }: DoodleProps) {
  return (
    <svg viewBox="0 0 40 40" {...base(size, className)}>
      <path
        d="M20 20c0-2 3-2 3 0 0 3.5-6 3.5-6 0 0-5 9-5 9 0 0 6.5-12 6.5-12 0 0-8 15-8 15 0"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Squiggle({ className, size = 120 }: DoodleProps) {
  return (
    <svg viewBox="0 0 120 16" width={size} height={size / 7.5} className={`doodle ${className ?? ''}`} aria-hidden="true" focusable="false">
      <path
        d="M2 10c8-8 14 4 22-2s14 6 22 0 14-6 22 0 14 6 22 0 14-6 22 0"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Arrow({ className, size = 70 }: DoodleProps) {
  return (
    <svg viewBox="0 0 80 50" width={size} height={(size * 5) / 8} className={`doodle ${className ?? ''}`} aria-hidden="true" focusable="false">
      <path
        d="M4 8c18 30 42 34 66 26M58 24l12 10-15 6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Flower({ className, size = 36 }: DoodleProps) {
  return (
    <svg viewBox="0 0 40 40" {...base(size, className)}>
      <g fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="20" cy="20" r="4" />
        <path d="M20 16c-4-8 4-12 4-4M24 20c8-3 10 5 2 4M20 24c3 8-5 10-4 2M16 20c-8 3-10-5-2-4M17 17c-6-4-1-9 2-2" />
      </g>
    </svg>
  );
}

/** Ilustración de reemplazo cuando una entrada no tiene fotografía. */
export function PhotoPlaceholder({ initial }: { initial: string }) {
  return (
    <svg viewBox="0 0 400 500" className="photo-placeholder" role="img" aria-label="Sin fotografía">
      <rect width="400" height="500" fill="var(--lavender-soft)" />
      <circle cx="200" cy="200" r="78" fill="none" stroke="var(--charcoal)" strokeWidth="5" strokeDasharray="14 10" />
      <path d="M90 430c20-90 200-90 220 0" fill="none" stroke="var(--charcoal)" strokeWidth="5" strokeDasharray="14 10" />
      <text x="200" y="232" textAnchor="middle" fontFamily="Caveat, cursive" fontSize="96" fill="var(--charcoal)">
        {initial}
      </text>
    </svg>
  );
}
