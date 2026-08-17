import { initialOf, loginUrl } from '../feature/auth/auth';
import type { AuthUser } from '../feature/auth/auth';

interface AuthBarProps {
  user: AuthUser | null;
  /** Đang hỏi backend xem có phiên cũ không — chưa biết đăng nhập hay chưa. */
  loading: boolean;
  onLogout: () => void;
}

export default function AuthBar({ user, loading, onLogout }: AuthBarProps) {
  if (loading) {
    return (
      <div className="authbar">
        <span className="authbar__hint">Đang kiểm tra phiên đăng nhập…</span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="authbar">
        <span className="authbar__hint">Đăng nhập để lưu điểm và lên bảng xếp hạng</span>
        {/* Điều hướng cả trang chứ không fetch: OAuth cần trình duyệt tự đi tới Google. */}
        <a className="btn btn--ghost" href={loginUrl('google')}>
          Đăng nhập bằng Google
        </a>
      </div>
    );
  }

  return (
    <div className="authbar">
      {user.avatarUrl ? (
        <img className="authbar__avatar" src={user.avatarUrl} alt="" referrerPolicy="no-referrer" />
      ) : (
        <span className="authbar__avatar authbar__avatar--letter">{initialOf(user)}</span>
      )}
      <span className="authbar__name" title={user.email ?? undefined}>
        {user.displayName}
      </span>
      <button type="button" className="btn btn--ghost" onClick={onLogout}>
        Đăng xuất
      </button>
    </div>
  );
}
