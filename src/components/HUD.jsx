export default function HUD({ score, lives, level, message }) {
  return (
    <div className="hud">
      <div className="hud__stat">
        <span className="hud__label">Điểm</span>
        <span className="hud__value">{score}</span>
      </div>
      <div className="hud__stat">
        <span className="hud__label">Mạng</span>
        <span className="hud__value">{'❤️'.repeat(Math.max(0, lives))}</span>
      </div>
      <div className="hud__stat">
        <span className="hud__label">Cấp</span>
        <span className="hud__value">{level}</span>
      </div>
      <div className="hud__message">{message}</div>
    </div>
  );
}
