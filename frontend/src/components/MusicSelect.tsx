import { useEffect, useRef, useState } from 'react';
import { OFF, TRACKS, trackById } from '../feature/music';

interface MusicSelectProps {
  trackId: string;
  volume: number;
  onChange: (trackId: string) => void;
  onVolume: (volume: number) => void;
  onPreview: () => void;
  previewing: boolean;
}

/** Mục trong danh sách chọn: một bài nhạc, hoặc lựa chọn "tắt nhạc". */
interface TrackOption {
  id: string;
  name: string;
  tag: string;
}

export default function MusicSelect({ trackId, volume, onChange, onVolume, onPreview, previewing }: MusicSelectProps) {
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

  const current = trackById(trackId);
  const options: TrackOption[] = [{ id: OFF, name: 'Tắt nhạc', tag: 'Chơi trong yên lặng' }, ...TRACKS];

  return (
    <div className="ion-select music-select" ref={rootRef}>
      <span className="ion-select__label">Nhạc nền</span>
      <div className="music-select__row">
        <button
          type="button"
          className={`ion-select__toggle${open ? ' is-open' : ''}`}
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
        >
          <span>
            {current ? '🎵' : '🔇'} <b>{current ? current.name : 'Tắt nhạc'}</b>
            {current && <em className="music-select__tag">{current.tag}</em>}
          </span>
          <span className="ion-select__caret">▾</span>
        </button>
        <button
          type="button"
          className="btn btn--ghost music-select__preview"
          onClick={onPreview}
          disabled={!current}
          title="Nghe thử"
        >
          {previewing ? '⏹ Dừng' : '▶ Nghe thử'}
        </button>
      </div>

      {open && (
        <div className="ion-select__panel">
          <p className="ion-select__hint">Nhạc được tổng hợp trực tiếp trong trình duyệt, phát lặp trong lúc chơi.</p>
          <ul className="ion-select__options">
            {options.map((track) => (
              <li key={track.id}>
                <label className={`ion-option${trackId === track.id ? ' is-on' : ''}`}>
                  <input
                    type="radio"
                    name="music-track"
                    checked={trackId === track.id}
                    onChange={() => {
                      onChange(track.id);
                      setOpen(false);
                    }}
                  />
                  <span className="ion-option__formula music-option__name">{track.name}</span>
                  <span className="ion-option__name">{track.tag}</span>
                </label>
              </li>
            ))}
          </ul>
        </div>
      )}

      <label className="music-select__volume">
        <span>Âm lượng</span>
        <input
          type="range"
          min="0"
          max="100"
          value={Math.round(volume * 100)}
          onChange={(e) => onVolume(Number(e.target.value) / 100)}
        />
        <b>{Math.round(volume * 100)}%</b>
      </label>
    </div>
  );
}
