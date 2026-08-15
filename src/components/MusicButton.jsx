export default function MusicButton({ trackName, muted, onToggleMute }) {
  if (!trackName) return null;
  return (
    <button
      type="button"
      className={`hud__music${muted ? ' is-muted' : ''}`}
      onClick={onToggleMute}
      title={muted ? 'Bật nhạc' : 'Tắt tiếng'}
    >
      {muted ? '🔇' : '🔊'} <span>{trackName}</span>
    </button>
  );
}
