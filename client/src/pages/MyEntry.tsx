import { useCallback, useEffect, useId, useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ApiError, createEntry, getEntry, updateEntry, verifyEditKey } from '../api';
import { DEFAULT_FRAMING, type Entry, type FieldErrors, type FieldName, type PhotoFraming } from '../types';
import { forgetMyEntry, loadMyEntry, saveMyEntry, type MyEntryRef } from '../myEntry';
import { LIMITS, PHOTO_TYPES, validateForm, validatePhoto, type FormValues, type TextField } from '../validation';
import { PhotoFramer } from '../components/PhotoFramer';
import { ErrorNote, Loading, useDocumentTitle } from '../components/Status';
import { Heart, Sparkle, Squiggle } from '../components/Doodles';

const EMPTY: FormValues = {
  name: '',
  age: '',
  pronouns: '',
  interest: '',
  positiveExperience: '',
  negativeExperience: '',
  differenceReflection: '',
};

const FIELD_ORDER: FieldName[] = [
  'photo',
  'name',
  'age',
  'pronouns',
  'interest',
  'positiveExperience',
  'negativeExperience',
  'differenceReflection',
];

interface PhotoState {
  /** Foto ya guardada en el servidor. */
  saved: string | null;
  /** Archivo nuevo elegido (todavía sin subir). */
  file: File | null;
  preview: string | null;
  removed: boolean;
}

const toValues = (e: Entry): FormValues => ({
  name: e.name,
  age: String(e.age),
  pronouns: e.pronouns,
  interest: e.interest,
  positiveExperience: e.positiveExperience,
  negativeExperience: e.negativeExperience,
  differenceReflection: e.differenceReflection,
});

type Mode = 'loading' | 'create' | 'edit' | 'load-error';

export function MyEntry() {
  const [ref, setRef] = useState<MyEntryRef | null>(() => loadMyEntry());
  const [mode, setMode] = useState<Mode>(ref ? 'loading' : 'create');
  const [entry, setEntry] = useState<Entry | null>(null);
  const [values, setValues] = useState<FormValues>(EMPTY);
  const [framing, setFraming] = useState<PhotoFraming>(DEFAULT_FRAMING);
  const [photo, setPhoto] = useState<PhotoState>({ saved: null, file: null, preview: null, removed: false });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<ReactNode>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState(false);

  const summaryRef = useRef<HTMLDivElement>(null);
  const successRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useDocumentTitle(mode === 'edit' ? 'Editar mi entrada' : 'Escribir mi entrada');

  const fillFrom = useCallback((e: Entry) => {
    setEntry(e);
    setValues(toValues(e));
    setFraming(e.photoFraming ?? DEFAULT_FRAMING);
    setPhoto({ saved: e.photo, file: null, preview: null, removed: false });
    setErrors({});
    setFormError(null);
  }, []);

  // Cargar la entrada que este navegador recuerda como propia.
  const loadOwn = useCallback(
    (signal?: AbortSignal) => {
      if (!ref) return;
      setMode('loading');
      setLoadError(null);
      getEntry(ref.id, signal)
        .then((res) => {
          fillFrom(res.entry);
          setMode('edit');
        })
        .catch((err: Error) => {
          if (err.name === 'AbortError') return;
          if (err instanceof ApiError && err.status === 404) {
            forgetMyEntry();
            setRef(null);
            setNotice('Este navegador recordaba una entrada que ya no existe en el diario, así que puedes escribir una nueva.');
            setMode('create');
          } else {
            setLoadError(err.message);
            setMode('load-error');
          }
        });
    },
    [ref, fillFrom],
  );

  useEffect(() => {
    const ctrl = new AbortController();
    loadOwn(ctrl.signal);
    return () => ctrl.abort();
    // Solo al montar: después, ref cambia porque la propia página la actualiza.
  }, []);

  // Liberar la URL temporal de la vista previa.
  useEffect(() => {
    return () => {
      if (photo.preview) URL.revokeObjectURL(photo.preview);
    };
  }, [photo.preview]);

  const setField = (field: keyof FormValues) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = e.target.value;
    setValues((v) => ({ ...v, [field]: value }));
    if (errors[field]) setErrors((errs) => ({ ...errs, [field]: undefined }));
  };

  const onPickPhoto = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // permite volver a elegir el mismo archivo
    if (!file) return;
    const problem = validatePhoto(file);
    if (problem) {
      setErrors((errs) => ({ ...errs, photo: problem }));
      return;
    }
    setErrors((errs) => ({ ...errs, photo: undefined }));
    setPhoto((p) => ({ ...p, file, preview: URL.createObjectURL(file), removed: false }));
    setFraming(DEFAULT_FRAMING);
  };

  const removePhoto = () => {
    setPhoto((p) => ({ ...p, file: null, preview: null, removed: true }));
    setFraming(DEFAULT_FRAMING);
    setErrors((errs) => ({ ...errs, photo: undefined }));
  };

  const focusFirstError = (errs: FieldErrors) => {
    const first = FIELD_ORDER.find((f) => errs[f]);
    requestAnimationFrame(() => {
      summaryRef.current?.focus();
      if (first) document.getElementById(`field-${first}`)?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    });
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setFormError(null);
    setNotice(null);
    setNewKey(null);

    const errs = validateForm(values);
    if (Object.keys(errs).length) {
      setErrors(errs);
      setFormError('Hay algunos campos que revisar antes de guardar.');
      focusFirstError(errs);
      return;
    }

    const form = new FormData();
    for (const [k, v] of Object.entries(values)) form.append(k, v.trim());
    form.append('photoX', String(framing.x));
    form.append('photoY', String(framing.y));
    form.append('photoZoom', String(framing.zoom));
    if (photo.file) form.append('photo', photo.file);
    else if (photo.removed) form.append('removePhoto', 'true');

    setSaving(true);
    try {
      if (mode === 'edit' && ref) {
        const res = await updateEntry(ref.id, ref.editKey, form);
        fillFrom(res.entry);
        setNotice(
          <>
            ¡Cambios guardados! <Link to={`/entradas/${res.entry.id}`}>Ver tu página en el diario →</Link>
          </>,
        );
      } else {
        const res = await createEntry(form);
        const nextRef = { id: res.entry.id, editKey: res.editKey };
        const remembered = saveMyEntry(nextRef);
        setRef(nextRef);
        fillFrom(res.entry);
        setNewKey(res.editKey);
        setMode('edit');
        if (!remembered) {
          setFormError(
            'Tu entrada se guardó, pero este navegador no permite recordarla. Apunta tu identificador y tu código para poder editarla después.',
          );
        }
      }
      requestAnimationFrame(() => successRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' }));
    } catch (err) {
      const apiErr = err instanceof ApiError ? err : null;
      if (apiErr?.fields) {
        setErrors(apiErr.fields);
        focusFirstError(apiErr.fields);
      }
      setFormError(
        apiErr?.status === 403
          ? `${apiErr.message} Si cambiaste de navegador, usa «Olvidar en este navegador» y recupera tu entrada con tu código.`
          : (err as Error).message,
      );
      requestAnimationFrame(() => summaryRef.current?.focus());
    } finally {
      setSaving(false);
    }
  };

  const forget = () => {
    const ok = window.confirm(
      'Este navegador dejará de reconocer tu entrada. Tu página seguirá en el diario, pero para volver a editarla necesitarás tu identificador y tu código de edición. ¿Continuar?',
    );
    if (!ok) return;
    forgetMyEntry();
    setRef(null);
    setEntry(null);
    setValues(EMPTY);
    setFraming(DEFAULT_FRAMING);
    setPhoto({ saved: null, file: null, preview: null, removed: false });
    setErrors({});
    setFormError(null);
    setNewKey(null);
    setShowKey(false);
    setNotice('Listo. Este navegador ya no recuerda ninguna entrada.');
    setMode('create');
  };

  const copyKey = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
      window.prompt('Copia tu código de edición:', text);
    }
  };

  if (mode === 'loading') return <Loading label="Buscando tu página…" />;
  if (mode === 'load-error') {
    return (
      <div className="narrow">
        <ErrorNote title="No pudimos cargar tu entrada" onRetry={() => loadOwn()}>
          {loadError}
        </ErrorNote>
      </div>
    );
  }

  const previewSrc = photo.preview ?? (photo.removed ? null : photo.saved);
  const errorCount = Object.values(errors).filter(Boolean).length;

  return (
    <div className="my-entry">
      <header className="page-head">
        <p className="hand page-head__kicker">{mode === 'edit' ? 'tu página del diario' : 'una página en blanco para ti'}</p>
        <h1 className="page-title">{mode === 'edit' ? 'Editar mi entrada' : 'Escribir mi entrada'}</h1>
        <Squiggle className="ink-lavender" size={160} />
        <p className="page-head__intro">
          Cada persona tiene una sola página, y puedes editarla siempre que quieras. Escribe con calma: no hay respuestas
          correctas.
        </p>
      </header>

      {newKey && ref && (
        <div className="key-note note note--sage" ref={successRef} role="status">
          <p className="hand note__title">
            ¡Tu página ya forma parte del diario! <Heart size={24} className="ink-charcoal" />
          </p>
          <p>
            Este navegador la recordará para que puedas editarla. Si cambias de navegador o de ordenador, necesitarás estos
            dos datos. <strong>Guárdalos: el código no se puede volver a mostrar desde el servidor.</strong>
          </p>
          <dl className="key-note__data">
            <div>
              <dt>Identificador</dt>
              <dd>
                <code>{ref.id}</code>
              </dd>
            </div>
            <div>
              <dt>Código de edición</dt>
              <dd>
                <code>{newKey}</code>
              </dd>
            </div>
          </dl>
          <div className="key-note__actions">
            <button type="button" className="btn btn--small" onClick={() => copyKey(`${ref.id} · ${newKey}`)}>
              {copied ? '¡Copiado!' : 'Copiar los dos'}
            </button>
            <Link to={`/entradas/${ref.id}`} className="btn btn--small btn--ghost">
              Ver mi página
            </Link>
          </div>
        </div>
      )}

      {notice && (
        <div className="notice" role="status" ref={newKey ? undefined : successRef}>
          <Sparkle size={18} className="ink-sage" /> <span>{notice}</span>
        </div>
      )}

      {mode === 'create' && <RecoverBox onRecovered={(r, e) => { setRef(r); fillFrom(e); setMode('edit'); setNotice('¡Te hemos reconocido! Ya puedes editar tu entrada.'); }} />}

      <form className="entry-form paper" onSubmit={onSubmit} noValidate>
        <span className="tape tape--bluegray tape--corner-left" aria-hidden="true" />

        <div
          ref={summaryRef}
          tabIndex={-1}
          className={`form-summary ${formError ? 'is-visible' : ''}`}
          role="alert"
          aria-live="assertive"
        >
          {formError && (
            <>
              <p>
                <strong>{formError}</strong>
              </p>
              {errorCount > 0 && (
                <ul>
                  {FIELD_ORDER.filter((f) => errors[f]).map((f) => (
                    <li key={f}>
                      <a href={`#field-${f}`}>{errors[f]}</a>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>

        {/* 1. Fotografía */}
        <fieldset className="field field--photo" id="field-photo">
          <legend className="field__label">
            <span className="field__num">1</span> Fotografía personal <span className="field__optional">(opcional)</span>
          </legend>
          <p className="field__hint" id="hint-photo">
            JPG, PNG o WebP de hasta 4 MB. Puede ser una foto tuya, un dibujo o algo que te represente. Después podrás
            ajustar el encuadre.
          </p>
          <div className="photo-picker">
            {previewSrc ? (
              <PhotoFramer src={previewSrc} framing={framing} onChange={setFraming} name={values.name} />
            ) : (
              <button type="button" className="photo-drop" onClick={() => fileInputRef.current?.click()}>
                <span className="hand">+ añadir una foto</span>
                <span className="photo-drop__small">o deja tu página con una ilustración</span>
              </button>
            )}
            <div className="photo-picker__actions">
              <input
                ref={fileInputRef}
                id="photo-input"
                type="file"
                accept={PHOTO_TYPES.join(',')}
                onChange={onPickPhoto}
                className="visually-hidden"
                aria-describedby={`hint-photo${errors.photo ? ' error-photo' : ''}`}
                aria-invalid={!!errors.photo}
              />
              <label htmlFor="photo-input" className="btn btn--small btn--ghost">
                {previewSrc ? 'Cambiar fotografía' : 'Elegir fotografía'}
              </label>
              {previewSrc && (
                <button type="button" className="btn btn--small btn--ghost" onClick={removePhoto}>
                  Quitar fotografía
                </button>
              )}
              {photo.file && <span className="photo-picker__file">{photo.file.name}</span>}
            </div>
          </div>
          {errors.photo && (
            <p className="field__error" id="error-photo">
              {errors.photo}
            </p>
          )}
        </fieldset>

        {/* 2-5. Datos breves */}
        <div className="field-row">
          <TextInput
            num={2}
            field="name"
            label="Nombre o seudónimo"
            hint="No hace falta que sea tu nombre real."
            value={values.name}
            onChange={setField('name')}
            error={errors.name}
            autoComplete="nickname"
          />
          <div className="field" id="field-age">
            <label className="field__label" htmlFor="input-age">
              <span className="field__num">3</span> Edad
            </label>
            <p className="field__hint" id="hint-age">
              Entre {LIMITS.age.min} y {LIMITS.age.max} años.
            </p>
            <input
              id="input-age"
              type="number"
              inputMode="numeric"
              min={LIMITS.age.min}
              max={LIMITS.age.max}
              step={1}
              value={values.age}
              onChange={setField('age')}
              aria-invalid={!!errors.age}
              aria-describedby={`hint-age${errors.age ? ' error-age' : ''}`}
              className="input input--short"
            />
            {errors.age && (
              <p className="field__error" id="error-age">
                {errors.age}
              </p>
            )}
          </div>
          <TextInput
            num={4}
            field="pronouns"
            label="Pronombres"
            hint="Por ejemplo: ella, él, elle, ella/elle…"
            value={values.pronouns}
            onChange={setField('pronouns')}
            error={errors.pronouns}
          />
        </div>

        <TextInput
          num={5}
          field="interest"
          label="Tu interés más friki"
          hint="Aquello que te apasiona aunque a veces te hayan mirado raro por ello."
          value={values.interest}
          onChange={setField('interest')}
          error={errors.interest}
        />

        {/* 6-8. Testimonios */}
        <TextArea
          num={6}
          field="positiveExperience"
          label="Una experiencia positiva que hayas vivido gracias a ese interés"
          hint="Una amistad, un logro, un momento en el que te sentiste en tu sitio…"
          value={values.positiveExperience}
          onChange={setField('positiveExperience')}
          error={errors.positiveExperience}
          rows={6}
        />
        <TextArea
          num={7}
          field="negativeExperience"
          label="Una experiencia negativa que hayas vivido por ese interés"
          optional
          hint="No tienes que inventar nada. Si no has vivido algo así, o prefieres no contarlo, déjalo en blanco."
          value={values.negativeExperience}
          onChange={setField('negativeExperience')}
          error={errors.negativeExperience}
          rows={6}
        />
        <TextArea
          num={8}
          field="differenceReflection"
          label="¿Te consideras extraño o diferente al resto?"
          hint="Cuéntalo con tus palabras."
          value={values.differenceReflection}
          onChange={setField('differenceReflection')}
          error={errors.differenceReflection}
          rows={4}
        />

        <p className="privacy-reminder">
          <Heart size={18} className="ink-lavender" /> Recuerda: no escribas apellidos, colegios, direcciones, teléfonos,
          correos ni redes sociales, ni datos de otras personas.
        </p>

        <div className="form-actions">
          <button type="submit" className="btn btn--big" disabled={saving}>
            {saving ? 'Guardando…' : mode === 'edit' ? 'Guardar cambios' : 'Guardar mi entrada'}
          </button>
          {mode === 'edit' && entry && (
            <Link to={`/entradas/${entry.id}`} className="btn btn--ghost">
              Ver mi página
            </Link>
          )}
        </div>
      </form>

      {mode === 'edit' && ref && (
        <section className="own-key paper" aria-labelledby="own-key-title">
          <h2 id="own-key-title" className="hand own-key__title">
            Tu identificación en este navegador
          </h2>
          <p>
            Identificador: <code>{ref.id}</code>
            {showKey && (
              <>
                {' '}
                · Código de edición: <code>{ref.editKey}</code>
              </>
            )}
          </p>
          <div className="own-key__actions">
            <button type="button" className="btn btn--small btn--ghost" onClick={() => setShowKey((s) => !s)}>
              {showKey ? 'Ocultar código' : 'Mostrar código'}
            </button>
            <button type="button" className="btn btn--small btn--ghost" onClick={forget}>
              Olvidar en este navegador
            </button>
          </div>
        </section>
      )}
    </div>
  );
}

// ---------- Campos ----------

interface FieldProps {
  num: number;
  field: TextField;
  label: string;
  hint?: string;
  value: string;
  error?: string;
  optional?: boolean;
  onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

function Counter({ field, value }: { field: TextField; value: string }) {
  const { min, max } = LIMITS[field];
  const len = value.trim().length;
  const state = len > max ? 'over' : len > 0 && len < min ? 'under' : '';
  return (
    <span className={`field__counter ${state}`} aria-hidden="true">
      {len} / {max}
    </span>
  );
}

function TextInput({ num, field, label, hint, value, error, onChange, autoComplete }: FieldProps & { autoComplete?: string }) {
  const id = `input-${field}`;
  return (
    <div className="field" id={`field-${field}`}>
      <label className="field__label" htmlFor={id}>
        <span className="field__num">{num}</span> {label}
      </label>
      {hint && (
        <p className="field__hint" id={`hint-${field}`}>
          {hint}
        </p>
      )}
      <div className="field__control">
        <input
          id={id}
          type="text"
          className="input"
          value={value}
          onChange={onChange}
          maxLength={LIMITS[field].max + 20}
          autoComplete={autoComplete ?? 'off'}
          aria-invalid={!!error}
          aria-describedby={[hint && `hint-${field}`, error && `error-${field}`].filter(Boolean).join(' ') || undefined}
        />
        <Counter field={field} value={value} />
      </div>
      {error && (
        <p className="field__error" id={`error-${field}`}>
          {error}
        </p>
      )}
    </div>
  );
}

function TextArea({ num, field, label, hint, value, error, optional, onChange, rows }: FieldProps & { rows: number }) {
  const id = `input-${field}`;
  const { min } = LIMITS[field];
  return (
    <div className="field" id={`field-${field}`}>
      <label className="field__label" htmlFor={id}>
        <span className="field__num">{num}</span> {label}{' '}
        {optional && <span className="field__optional">(opcional)</span>}
      </label>
      {hint && (
        <p className="field__hint" id={`hint-${field}`}>
          {hint}
          {min > 0 && ` Mínimo ${min} caracteres.`}
        </p>
      )}
      <div className="field__control">
        <textarea
          id={id}
          className="input textarea lined"
          rows={rows}
          value={value}
          onChange={onChange}
          aria-invalid={!!error}
          aria-describedby={[hint && `hint-${field}`, error && `error-${field}`].filter(Boolean).join(' ') || undefined}
        />
        <Counter field={field} value={value} />
      </div>
      {error && (
        <p className="field__error" id={`error-${field}`}>
          {error}
        </p>
      )}
    </div>
  );
}

// ---------- Recuperar entrada en otro navegador ----------

function RecoverBox({ onRecovered }: { onRecovered: (ref: MyEntryRef, entry: Entry) => void }) {
  const [open, setOpen] = useState(false);
  const [id, setId] = useState('');
  const [key, setKey] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const uid = useId();

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const cleanId = id.trim();
    const cleanKey = key.trim();
    if (!cleanId || !cleanKey) {
      setError('Escribe tu identificador y tu código de edición.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await verifyEditKey(cleanId, cleanKey);
      const ref = { id: res.entry.id, editKey: cleanKey };
      saveMyEntry(ref);
      onRecovered(ref, res.entry);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="recover">
      <button type="button" className="link-hand recover__toggle" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        ¿Ya escribiste tu página en otro navegador? {open ? '▲' : '▼'}
      </button>
      {open && (
        <form className="recover__form note note--blue" onSubmit={submit} noValidate>
          <p>Introduce los dos datos que recibiste al crear tu entrada para poder editarla desde aquí.</p>
          <div className="recover__fields">
            <label htmlFor={`${uid}-id`}>
              Identificador
              <input
                id={`${uid}-id`}
                className="input"
                value={id}
                onChange={(e) => setId(e.target.value)}
                placeholder="entrada-1a2b3c4d"
                autoComplete="off"
              />
            </label>
            <label htmlFor={`${uid}-key`}>
              Código de edición
              <input
                id={`${uid}-key`}
                className="input"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="abcd-1234-ef56"
                autoComplete="off"
              />
            </label>
          </div>
          {error && (
            <p className="field__error" role="alert">
              {error}
            </p>
          )}
          <button type="submit" className="btn btn--small" disabled={busy}>
            {busy ? 'Comprobando…' : 'Recuperar mi entrada'}
          </button>
        </form>
      )}
    </div>
  );
}
