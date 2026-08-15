import MusicButton from './MusicButton.jsx';

export default function HUD({ score, level, message, trackName, muted, onToggleMute }) {
  return (
    <div className="hud">
      <div className="hud__stat">
        <span className="hud__label">Điểm</span>
        <span className="hud__value">{score}</span>
      </div>
      <div className="hud__stat">
        <span className="hud__label">Cấp</span>
        <span className="hud__value">{level}</span>
      </div>
      <div className="hud__message">{message}</div>
      <MusicButton trackName={trackName} muted={muted} onToggleMute={onToggleMute} />
    </div>
  );
}
