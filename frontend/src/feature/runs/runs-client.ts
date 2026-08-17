// Gọi API ván chơi. Mọi request đều đi qua AuthClient.authorizedFetch nên tự
// gắn Bearer token và tự xin token mới khi hết hạn.
//
// Nguyên tắc: chưa đăng nhập thì game vẫn chơi bình thường, chỉ là không lưu —
// nên mọi lỗi ở đây đều nuốt và trả null, không bao giờ chặn người chơi.

import { API_BASE_URL } from '../auth/auth';
import type { AuthClient } from '../auth/auth-client';
import type { GameMode } from '../setup';
import type {
  FinishedRun,
  LeaderboardPeriod,
  LeaderboardRow,
  RunPayload,
  RunSummary,
  StartedRun,
} from './runs';

const CLIENT_VERSION = '0.2.0';

/** Dạng thô backend trả về (snake_case), đổi sang camelCase ngay tại chỗ nhận. */
interface RawLeaderboardRow {
  rank: number;
  player_id: string;
  display_name: string;
  avatar_url: string | null;
  best_score: number;
  runs: number;
  achieved_at: string;
}

interface RawRunRow {
  id: string;
  mode: GameMode;
  status: string;
  score: number;
  score_verified: boolean;
  started_at: string;
  duration_ms: number | null;
}

export class RunsClient {
  constructor(private readonly auth: AuthClient) {}

  async start(mode: GameMode): Promise<StartedRun | null> {
    if (!this.auth.isAuthenticated) return null;
    try {
      const response = await this.auth.authorizedFetch('/runs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode, client_version: CLIENT_VERSION }),
      });
      if (!response.ok) return null;
      const data = await response.json();
      return { runId: data.run_id, seed: data.seed };
    } catch {
      return null;
    }
  }

  /** Bảng xếp hạng là công khai — không cần đăng nhập, nên gọi fetch thẳng. */
  async leaderboard(mode: GameMode, period: LeaderboardPeriod): Promise<LeaderboardRow[]> {
    const params = new URLSearchParams({ mode, period, limit: '20' });
    const response = await fetch(`${API_BASE_URL}/leaderboard?${params}`);
    if (!response.ok) throw new Error('Không tải được bảng xếp hạng');
    const rows = (await response.json()) as RawLeaderboardRow[];
    return rows.map((row) => ({
      rank: row.rank,
      playerId: row.player_id,
      displayName: row.display_name,
      avatarUrl: row.avatar_url,
      bestScore: row.best_score,
      runs: row.runs,
      achievedAt: row.achieved_at,
    }));
  }

  async myRuns(): Promise<RunSummary[]> {
    const response = await this.auth.authorizedFetch('/runs/me?limit=20');
    if (!response.ok) throw new Error('Không tải được lịch sử ván chơi');
    const rows = (await response.json()) as RawRunRow[];
    return rows.map((row) => ({
      id: row.id,
      mode: row.mode,
      status: row.status,
      score: row.score,
      scoreVerified: row.score_verified,
      startedAt: row.started_at,
      durationMs: row.duration_ms,
    }));
  }

  async finish(runId: string, score: number, payload: RunPayload): Promise<FinishedRun | null> {
    try {
      const response = await this.auth.authorizedFetch(`/runs/${runId}/finish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ score, payload }),
      });
      if (!response.ok) return null;
      const data = await response.json();
      return {
        score: data.score,
        scoreVerified: data.score_verified,
        reason: data.reason ?? null,
      };
    } catch {
      return null;
    }
  }
}
