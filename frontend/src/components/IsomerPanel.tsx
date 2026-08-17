import type { OrganicEngine } from '../feature/organic/organic-engine';

interface IsomerPanelProps {
  /** null khi canvas chưa kịp dựng engine. */
  engine: OrganicEngine | null;
  /** Khóa đẳng cấu của các đồng phân đã dựng đúng. */
  foundKeys: string[];
  seconds: number;
  onClear: () => void;
}

export default function IsomerPanel({ engine, foundKeys, seconds, onClear }: IsomerPanelProps) {
  if (!engine) return null;
  const total = engine.isomers.length;
  const found = foundKeys.length;
  const ratio = Math.max(0, Math.min(1, seconds / engine.difficulty.seconds));

  return (
    <>
      <div className="panel">
        <h3>Đề bài</h3>
        <div className="quest">
          <span className="quest__formula">{engine.formula}</span>
          <span className="quest__name">{engine.stem}</span>
        </div>
        <p className="quest__brief">
          Dựng lại <strong>{total} đồng phân</strong> của {engine.formula} bằng các gốc CH₃ bên trái — mỗi đồng phân có{' '}
          <strong>{engine.difficulty.seconds}s</strong>, giải xong là đồng hồ chạy lại.
        </p>
        <div className={`quest__timer${ratio < 0.25 ? ' is-low' : ''}`}>
          <div className="quest__timer-bar" style={{ width: `${ratio * 100}%` }} />
          <span>{seconds}s</span>
        </div>
        <button type="button" className="btn btn--ghost quest__clear" onClick={onClear}>
          ↺ Xóa bàn chơi
        </button>
      </div>

      <div className="panel">
        <h3>
          Đồng phân {found}/{total}
        </h3>
        <ul className="isomer-list">
          {engine.isomers.map((isomer, index) => {
            const done = foundKeys.includes(isomer.key);
            return (
              <li key={isomer.key} className={`isomer${done ? ' is-found' : ''}`}>
                <span className="isomer__mark">{done ? '✓' : index + 1}</span>
                <span className="isomer__name">{done ? isomer.name : '• • •'}</span>
              </li>
            );
          })}
        </ul>
        <p className="panel__empty">Tên chỉ hiện ra sau khi bạn dựng đúng cấu trúc.</p>
      </div>
    </>
  );
}
