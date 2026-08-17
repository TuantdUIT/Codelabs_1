export interface MusicButtonProps {
  /** Không có tên bài (đang tắt nhạc) thì nút cũng biến mất. */
  trackName?: string;
  muted: boolean;
  onToggleMute: () => void;
}

export default function MusicButton({ trackName, muted, onToggleMute }: MusicButtonProps) {
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
