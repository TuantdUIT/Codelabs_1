export default function CompoundLog({ entries }) {
  return (
    <div className="compound-log">
      <h3>Hợp chất đã tổng hợp</h3>
      {entries.length === 0 ? (
        <p className="compound-log__empty">Chưa có hợp chất nào — hãy bắn ion đối nghịch để phản ứng!</p>
      ) : (
        <ul>
          {entries.map((entry, i) => (
            <li key={i}>
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
