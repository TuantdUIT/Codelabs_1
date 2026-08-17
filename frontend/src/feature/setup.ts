import type { DifficultyId } from './organic/organic-engine';

export type GameMode = 'inorganic' | 'organic';

/** Cấu hình một ván chơi, chọn ở màn hình bắt đầu rồi truyền xuống engine. */
export interface GameSetup {
  mode: GameMode;
  /** Chỉ dùng cho chế độ hữu cơ. */
  difficultyId: DifficultyId;
  /** Chỉ dùng cho chế độ vô cơ. */
  cationIds: string[];
  anionIds: string[];
}

/** Đoạn đường dẫn tương ứng mỗi chế độ, dùng cho URL kiểu /cach-choi/vo-co. */
export const MODE_SLUG: Record<GameMode, string> = {
  inorganic: 'vo-co',
  organic: 'huu-co',
};

export const modeFromSlug = (slug: string | undefined): GameMode | null => {
  const found = (Object.keys(MODE_SLUG) as GameMode[]).find((mode) => MODE_SLUG[mode] === slug);
  return found ?? null;
};

/** Trạng thái nhạc nền dùng chung giữa màn hình bắt đầu và lúc đang chơi. */
export interface MusicState {
  trackId: string;
  volume: number;
  muted: boolean;
}
