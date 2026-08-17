import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { ionLabel } from '../feature/in-organic/ions';
import type { Ion, IonType } from '../feature/in-organic/ions';

interface IonSelectProps {
  label: string;
  hint: string;
  /** Toàn bộ ion có thể chọn. */
  pool: Ion[];
  /** Id các ion đang chọn. */
  selected: string[];
  colorOf: (id: string) => string;
  onChange: (ids: string[]) => void;
  min: number;
  max: number;
  type: IonType;
}

export default function IonSelect({ label, hint, pool, selected, colorOf, onChange, min, max, type }: IonSelectProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const atMin = selected.length <= min;
  const atMax = selected.length >= max;

  const toggle = (id: string) => {
    if (selected.includes(id)) {
      if (atMin) return;
      onChange(selected.filter((x) => x !== id));
    } else {
      if (atMax) return;
      // giữ đúng thứ tự trong bảng ion để màu không nhảy lung tung
      onChange(pool.filter((ion) => ion.id === id || selected.includes(ion.id)).map((ion) => ion.id));
    }
  };

  return (
    <div className="ion-select" ref={rootRef}>
      <span className="ion-select__label">{label}</span>
      <button
        type="button"
        className={`ion-select__toggle${open ? ' is-open' : ''}`}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span>
          Đã chọn <b>{selected.length}</b>/{max}
        </span>
        <span className="ion-select__caret">▾</span>
      </button>

      {open && (
        <div className="ion-select__panel">
          <p className="ion-select__hint">
            {hint} — chọn từ {min} đến {max} ion.
          </p>
          <ul className="ion-select__options">
            {pool.map((ion) => {
              const isOn = selected.includes(ion.id);
              const locked = isOn ? atMin : atMax;
              return (
                <li key={ion.id}>
                  <label className={`ion-option${isOn ? ' is-on' : ''}${locked ? ' is-locked' : ''}`}>
                    <input type="checkbox" checked={isOn} disabled={locked} onChange={() => toggle(ion.id)} />
                    <i className="ion-option__dot" style={{ background: isOn ? colorOf(ion.id) : 'transparent' }} />
                    <span className="ion-option__formula">{ionLabel(ion, type)}</span>
                    <span className="ion-option__name">{ion.name}</span>
                  </label>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <div className="ion-select__chips">
        {pool
          .filter((ion) => selected.includes(ion.id))
          .map((ion) => (
            <span
              key={ion.id}
              className="need-chip"
              style={{ '--ion-color': colorOf(ion.id) } as CSSProperties}
              title={ion.name}
            >
              {ionLabel(ion, type)}
            </span>
          ))}
      </div>
    </div>
  );
}
