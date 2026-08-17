// Kiểu dữ liệu và bộ dựng payload cho việc nộp ván chơi lên backend.
// File này thuần — không gọi mạng, không giữ trạng thái.

import type { GameMode } from '../setup';

/** Một hợp chất đã ghép được, ghi lại ngay lúc engine phát sự kiện. */
export interface CompoundHit {
  cation_id: string;
  anion_id: string;
  dropped: number;
  /** Mốc thời gian trong ván (ms), lấy từ `engine.elapsed`. */
  at_ms: number;
}

/** Một đồng phân đã dựng đúng. */
export interface IsomerHit {
  canonical_key: string;
  gained: number;
  bonus: number;
  /** Mốc thời gian trong ván (ms), lấy từ `engine.now`. */
  at_ms: number;
}

export interface InorganicRunPayload {
  level_reached: number;
  rows_dropped: number;
  grids_cleared: number;
  cation_ids: string[];
  anion_ids: string[];
  compounds: CompoundHit[];
}

export interface OrganicRunPayload {
  difficulty: string;
  carbons: number;
  total_count: number;
  won: boolean;
  end_reason: 'timeout' | 'complete';
  isomers: IsomerHit[];
}

export type RunPayload = InorganicRunPayload | OrganicRunPayload;

export interface StartedRun {
  runId: string;
  /** Hạt giống RNG do server cấp — dành cho chế độ thử thách cùng đề sau này. */
  seed: number;
}

export interface FinishedRun {
  /** Điểm server tự tính lại — đây mới là điểm được lưu. */
  score: number;
  scoreVerified: boolean;
  reason: string | null;
}

/** Một dòng bảng xếp hạng. Chỉ gồm ván đã được server xác thực điểm. */
export interface LeaderboardRow {
  rank: number;
  playerId: string;
  displayName: string;
  avatarUrl: string | null;
  bestScore: number;
  runs: number;
  achievedAt: string;
}

/** Một ván trong lịch sử của chính người chơi. */
export interface RunSummary {
  id: string;
  mode: GameMode;
  status: string;
  score: number;
  scoreVerified: boolean;
  startedAt: string;
  durationMs: number | null;
}

export type LeaderboardPeriod = 'day' | 'week' | 'all';

export const PERIOD_LABEL: Record<LeaderboardPeriod, string> = {
  day: 'Hôm nay',
  week: 'Tuần này',
  all: 'Mọi thời đại',
};

export const MODE_LABEL: Record<GameMode, string> = {
  inorganic: 'Vô cơ',
  organic: 'Hữu cơ',
};

/** "1 phút 23 giây" từ số ms; null khi ván chưa kết thúc. */
export const formatDuration = (ms: number | null): string => {
  if (ms === null) return '—';
  const total = Math.round(ms / 1000);
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return minutes > 0 ? `${minutes}p ${seconds}s` : `${seconds}s`;
};

export const formatDate = (iso: string): string =>
  new Date(iso).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

/** Bộ gom sự kiện của một ván vô cơ, đổ ra payload lúc kết thúc. */
export class InorganicRunRecorder {
  private readonly compounds: CompoundHit[] = [];
  private rowsDropped = 0;
  private gridsCleared = 0;
  private level = 1;

  constructor(
    private readonly cationIds: string[],
    private readonly anionIds: string[],
  ) {}

  recordCompound(hit: CompoundHit): void {
    this.compounds.push(hit);
  }

  recordRowDrop(): void {
    this.rowsDropped += 1;
  }

  recordGridCleared(): void {
    this.gridsCleared += 1;
  }

  recordLevel(level: number): void {
    this.level = Math.max(this.level, level);
  }

  toPayload(): InorganicRunPayload {
    return {
      level_reached: this.level,
      rows_dropped: this.rowsDropped,
      grids_cleared: this.gridsCleared,
      cation_ids: this.cationIds,
      anion_ids: this.anionIds,
      compounds: this.compounds,
    };
  }
}

export const modeOf = (mode: GameMode): GameMode => mode;
