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

/** Trạng thái nhạc nền dùng chung giữa màn hình bắt đầu và lúc đang chơi. */
export interface MusicState {
  trackId: string;
  volume: number;
  muted: boolean;
}
