// Giữ phiên đăng nhập ở phía trình duyệt.
//
// Access token chỉ nằm TRONG BỘ NHỚ, không vào localStorage/sessionStorage: XSS
// đọc được storage, còn refresh token thì nằm ở cookie HttpOnly nên JavaScript
// không chạm tới. Mất tab là mất access token, nhưng `restore()` xin lại được
// bằng cookie đó.

import { apiUrl, toUser } from './auth';
import type { AuthUser } from './auth';

interface TokenPayload {
  access_token: string;
  expires_in: number;
}

/** Xin token mới sớm hơn hạn 30s để không bay giữa chừng một request. */
const RENEW_MARGIN_MS = 30_000;

export class AuthClient {
  private accessToken: string | null = null;
  private expiresAt = 0;
  /** Gộp nhiều lời gọi refresh song song thành một request duy nhất. */
  private pending: Promise<string | null> | null = null;

  get isAuthenticated(): boolean {
    return this.accessToken !== null;
  }

  /** Xin access token bằng cookie refresh. Trả null nếu chưa/không còn đăng nhập. */
  async refresh(): Promise<string | null> {
    this.pending ??= this.requestToken().finally(() => {
      this.pending = null;
    });
    return this.pending;
  }

  private async requestToken(): Promise<string | null> {
    const response = await fetch(apiUrl('/auth/refresh'), {
      method: 'POST',
      credentials: 'include', // bắt buộc: cookie refresh là cross-origin (5173 -> 8001)
    });
    if (!response.ok) {
      this.clear();
      return null;
    }
    const payload = (await response.json()) as TokenPayload;
    this.accessToken = payload.access_token;
    this.expiresAt = Date.now() + payload.expires_in * 1000;
    return this.accessToken;
  }

  /** Gọi lúc mở trang: có cookie hợp lệ thì trả người chơi, không thì trả null. */
  async restore(): Promise<AuthUser | null> {
    const token = await this.refresh();
    if (!token) return null;
    return this.me();
  }

  async me(): Promise<AuthUser | null> {
    const response = await this.authorizedFetch('/auth/me');
    if (!response.ok) return null;
    return toUser(await response.json());
  }

  async logout(): Promise<void> {
    try {
      await fetch(apiUrl('/auth/logout'), { method: 'POST', credentials: 'include' });
    } finally {
      this.clear();
    }
  }

  /**
   * `fetch` có sẵn Bearer token, tự xin token mới khi hết hạn hoặc gặp 401.
   * Các module sau (gameplay, bảng xếp hạng) dùng lại đúng hàm này.
   */
  async authorizedFetch(path: string, init: RequestInit = {}): Promise<Response> {
    if (!this.accessToken || Date.now() > this.expiresAt - RENEW_MARGIN_MS) {
      await this.refresh();
    }

    const response = await fetch(apiUrl(path), this.withAuth(init));
    if (response.status !== 401) return response;

    // Token có thể vừa bị thu hồi phía server — thử xin lại đúng một lần.
    const renewed = await this.refresh();
    if (!renewed) return response;
    return fetch(apiUrl(path), this.withAuth(init));
  }

  private withAuth(init: RequestInit): RequestInit {
    const headers = new Headers(init.headers);
    if (this.accessToken) headers.set('Authorization', `Bearer ${this.accessToken}`);
    return { ...init, headers, credentials: 'include' };
  }

  private clear(): void {
    this.accessToken = null;
    this.expiresAt = 0;
  }
}
