import { useId, type FormEvent } from 'react';

interface Props {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: (value: string) => void;
  label?: string;
  autoFocus?: boolean;
}

export function SearchBar({ value, onChange, onSubmit, label = 'Buscar en el diario', autoFocus }: Props) {
  const id = useId();

  const submit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit?.(value.trim());
  };

  return (
    <form className="search" role="search" onSubmit={submit}>
      <label htmlFor={id} className="search__label hand">
        {label}
      </label>
      <div className="search__row">
        <svg className="search__icon" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
          <circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" strokeWidth="2" />
          <path d="M15.5 15.5l5 5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
        </svg>
        <input
          id={id}
          type="search"
          value={value}
          maxLength={100}
          autoFocus={autoFocus}
          placeholder="Prueba con «anime», «colegio», «dados», «elle»…"
          onChange={(e) => onChange(e.target.value)}
        />
        {value && (
          <button type="button" className="search__clear" onClick={() => onChange('')} aria-label="Borrar la búsqueda">
            ×
          </button>
        )}
        <button type="submit" className="btn btn--small">
          Buscar
        </button>
      </div>
    </form>
  );
}
