// Kiểu dữ liệu và hằng số của phần đăng nhập. File này thuần — không gọi mạng,
// không giữ trạng thái — nên dùng được ở cả component lẫn `auth-client.ts`.

/** Nhà cung cấp đăng nhập backend đang bật. Thêm 'facebook' khi backend bật xong. */
export type AuthProvider = 'google';

/** Người chơi đã đăng nhập, khớp với `PlayerOut` của backend. */
export interface AuthUser {
  id: string;
  displayName: string;
  email: string | null;
  avatarUrl: string | null;
}

/** Dạng thô backend trả về (snake_case) trước khi đổi sang camelCase. */
interface PlayerPayload {
  id: string;
  display_name: string;
  email: string | null;
  avatar_url: string | null;
}

export const API_BASE_URL: string = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8001';

/** Backend chuyển hướng về đây sau khi Google xác nhận. */
export const CALLBACK_PATH = '/auth/callback';

export const loginUrl = (provider: AuthProvider = 'google'): string =>
  `${API_BASE_URL}/auth/${provider}/login`;

export const apiUrl = (path: string): string => `${API_BASE_URL}${path}`;

export const toUser = (payload: PlayerPayload): AuthUser => ({
  id: payload.id,
  displayName: payload.display_name,
  email: payload.email,
  avatarUrl: payload.avatar_url,
});

/** Trang hiện tại có phải nơi backend vừa trả người chơi về không. */
export const isCallbackRoute = (): boolean => window.location.pathname === CALLBACK_PATH;

/** Xoá /auth/callback khỏi thanh địa chỉ, tránh người chơi F5 vào một URL vô nghĩa. */
export const clearCallbackRoute = (): void => {
  if (isCallbackRoute()) window.history.replaceState(null, '', '/');
};

/** Chữ cái đầu để vẽ avatar dự phòng khi provider không trả ảnh. */
export const initialOf = (user: AuthUser): string =>
  (user.displayName.trim()[0] ?? '?').toUpperCase();
