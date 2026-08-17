/** Một dòng nhật ký: hợp chất vừa tổng hợp được và điểm nhận về. */
export interface CompoundLogEntry {
  formula: string;
  name: string;
  gained: number;
}

interface CompoundLogProps {
  entries: CompoundLogEntry[];
}

export default function CompoundLog({ entries }: CompoundLogProps) {
  return (
    <div className="compound-log">
      <h3>Hợp chất đã tổng hợp</h3>
      {entries.length === 0 ? (
        <p className="compound-log__empty">Bắn tự do: cụm ion liền kề cân bằng điện tích sẽ tự phản ứng.</p>
      ) : (
        <ul>
          {entries.map((entry, index) => (
            <li key={`${entry.formula}-${index}`}>
              <span className="compound-log__formula">{entry.formula}</span>
              <span className="compound-log__name">{entry.name}</span>
              <span className="compound-log__points">+{entry.gained}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
