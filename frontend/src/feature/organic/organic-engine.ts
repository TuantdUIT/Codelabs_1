import { MAX_VALENCE, alkaneFormula, alkaneStem, canonicalKey, enumerateAlkanes } from './organic';
import type { Adjacency, Isomer } from './organic';

// Bàn chơi là lưới VUÔNG: mỗi ô có đúng 4 ô kề, khớp luôn với hóa trị IV của
// cacbon — nên "5 gốc CH₃ bao quanh" là điều không thể dựng được.
export const CELL = 62;
export const COLS = 9; // x: -4..4
export const ROWS = 7; // y: -3..3
export const WIDTH = 560;
export const HEIGHT = 540;
export const ORIGIN_X = WIDTH / 2;
export const ORIGIN_Y = 232;
export const ATOM_R = 21;
export const STOCK_Y = HEIGHT - 62;

export const MIN_X = -(COLS - 1) / 2;
export const MAX_X = (COLS - 1) / 2;
export const MIN_Y = -(ROWS - 1) / 2;
export const MAX_Y = (ROWS - 1) / 2;

export type DifficultyId = 'easy' | 'medium' | 'hard';

export interface Difficulty {
  id: DifficultyId;
  label: string;
  /** Các số cacbon có thể ra đề ở mức này. */
  carbons: number[];
  seconds: number;
  note: string;
}

export const DIFFICULTIES: Difficulty[] = [
  { id: 'easy', label: 'Dễ', carbons: [4, 5], seconds: 30, note: '4–5 cacbon · 2–3 đồng phân' },
  { id: 'medium', label: 'Trung bình', carbons: [6], seconds: 45, note: '6 cacbon · 5 đồng phân' },
  { id: 'hard', label: 'Khó', carbons: [7], seconds: 60, note: '7 cacbon · 9 đồng phân' },
];

/** Một ô trên bàn ghép, toạ độ nguyên quanh gốc (0,0). */
export interface Cell {
  x: number;
  y: number;
}

/** Kết quả kiểm tra một ô có đặt được gốc CH₃ hay không. */
export type Placement = { ok: true; source: Cell | null } | { ok: false; reason: string };

/** Kết quả kiểm tra một nguyên tử có gỡ ra được hay không. */
export type Removable = { ok: true } | { ok: false; reason: string };

export type FlashKind = 'warn' | 'info';

export interface Flash {
  text: string;
  kind: FlashKind;
  /** Mốc thời gian (ms trong vòng đời engine) mà lời nhắc biến mất. */
  until: number;
}

/** Kết quả cuối ván hữu cơ — dùng cho cả sự kiện gameover lẫn màn hình kết thúc. */
export interface OrganicResult {
  reason: 'timeout' | 'complete';
  won: boolean;
  score: number;
  /** Số đồng phân đã dựng được. */
  found: number;
  total: number;
}

export type OrganicEvent =
  | { type: 'ready'; engine: OrganicEngine }
  | { type: 'place' }
  | { type: 'remove' }
  | { type: 'flash'; text: string; kind: FlashKind }
  | { type: 'board'; placed: number; left: number; found: string[] }
  | { type: 'tick'; seconds: number }
  | { type: 'solved'; isomer: Isomer; gained: number; bonus: number; found: number; total: number }
  | ({ type: 'gameover' } & OrganicResult);

export type OrganicEventHandler = (event: OrganicEvent) => void;

export interface OrganicEngineOptions {
  onEvent?: OrganicEventHandler;
  difficultyId?: DifficultyId;
}

export const cellKey = (x: number, y: number): string => `${x},${y}`;
export const bondKey = (a: string, b: string): string => [a, b].sort().join('|');
export const cellPx = (x: number, y: number): { px: number; py: number } => ({
  px: ORIGIN_X + x * CELL,
  py: ORIGIN_Y + y * CELL,
});
export const inBounds = (x: number, y: number): boolean => x >= MIN_X && x <= MAX_X && y >= MIN_Y && y <= MAX_Y;
export const neighborsOf = (x: number, y: number): [number, number][] =>
  ([
    [x + 1, y],
    [x - 1, y],
    [x, y + 1],
    [x, y - 1],
  ] as [number, number][]).filter(([nx, ny]) => inBounds(nx, ny));

const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

export class OrganicEngine {
  readonly onEvent: OrganicEventHandler;
  readonly difficulty: Difficulty;
  readonly carbons: number;
  readonly isomers: Isomer[];
  readonly formula: string;
  readonly stem: string;

  /** "x,y" -> vị trí nguyên tử */
  atoms: Map<string, Cell>;
  /** "x1,y1|x2,y2" — liên kết được ghi rõ, không suy ra từ vị trí */
  bonds: Set<string>;
  /** Nguyên tử đang chọn: gốc CH₃ mới sẽ mọc ra từ đây. */
  active: Cell | null;
  /** Khóa đẳng cấu đã giải. */
  found: Set<string>;

  readonly limitMs: number;
  remaining: number;
  lastWholeSecond: number;

  score: number;
  gameOver: boolean;
  won: boolean;
  hover: Cell | null;
  flash: Flash | null;
  now: number;

  constructor({ onEvent, difficultyId }: OrganicEngineOptions = {}) {
    this.onEvent = onEvent || (() => {});
    this.difficulty = DIFFICULTIES.find((d) => d.id === difficultyId) ?? DIFFICULTIES[0];
    this.carbons = pick(this.difficulty.carbons);
    this.isomers = enumerateAlkanes(this.carbons);
    this.formula = alkaneFormula(this.carbons);
    this.stem = alkaneStem(this.carbons);

    this.atoms = new Map();
    this.bonds = new Set();
    this.active = null;
    this.found = new Set();
    this.limitMs = this.difficulty.seconds * 1000;
    this.remaining = this.limitMs;
    this.lastWholeSecond = this.difficulty.seconds;

    this.score = 0;
    this.gameOver = false;
    this.won = false;
    this.hover = null;
    this.flash = null;
    this.now = 0;
  }

  get placed(): number {
    return this.atoms.size;
  }

  get carbonsLeft(): number {
    return this.carbons - this.atoms.size;
  }

  // ------------------------------------------------ hình học & luật đặt
  degreeAt(x: number, y: number): number {
    return this.bondedNeighbors(x, y).length;
  }

  bondedNeighbors(x: number, y: number): [number, number][] {
    const me = cellKey(x, y);
    return neighborsOf(x, y).filter(([nx, ny]) => this.bonds.has(bondKey(me, cellKey(nx, ny))));
  }

  // Nguyên tử mà gốc CH₃ mới sẽ mọc ra: ưu tiên nguyên tử đang chọn, nếu không
  // thì lấy nguyên tử kề duy nhất (đường tắt để nối mạch thẳng chỉ bằng 1 cú bấm).
  sourceFor(x: number, y: number): Cell | null {
    const active = this.active;
    if (active) {
      const near = neighborsOf(x, y).some(([nx, ny]) => nx === active.x && ny === active.y);
      if (near) return active;
    }
    const touching = neighborsOf(x, y).filter(([nx, ny]) => this.atoms.has(cellKey(nx, ny)));
    if (touching.length === 1) return { x: touching[0][0], y: touching[0][1] };
    return null;
  }

  // Vì sao một ô không đặt được — dùng cho cả việc tô màu ô đang rê chuột.
  placement(x: number, y: number): Placement {
    if (!inBounds(x, y)) return { ok: false, reason: 'Ngoài bàn chơi' };
    if (this.atoms.has(cellKey(x, y))) return { ok: false, reason: 'Ô đã có nguyên tử' };
    if (this.atoms.size >= this.carbons) return { ok: false, reason: `Đã đủ ${this.carbons} cacbon` };
    if (this.atoms.size === 0) return { ok: true, source: null };

    const source = this.sourceFor(x, y);
    if (!source) {
      const touching = neighborsOf(x, y).filter(([nx, ny]) => this.atoms.has(cellKey(nx, ny)));
      return {
        ok: false,
        reason: touching.length ? 'Bấm chọn nguyên tử nguồn trước' : 'Phải nối vào mạch có sẵn',
      };
    }
    if (this.degreeAt(source.x, source.y) >= MAX_VALENCE) {
      return { ok: false, reason: `Cacbon chỉ có tối đa ${MAX_VALENCE} liên kết` };
    }
    return { ok: true, source };
  }

  removable(x: number, y: number): Removable {
    if (!this.atoms.has(cellKey(x, y))) return { ok: false, reason: 'Ô trống' };
    if (this.degreeAt(x, y) > 1) return { ok: false, reason: 'Chỉ gỡ được nhóm CH₃ ở đầu mạch' };
    return { ok: true };
  }

  // ------------------------------------------------ thao tác người chơi
  click(x: number, y: number): void {
    if (this.gameOver) return;
    const key = cellKey(x, y);

    if (this.atoms.has(key)) {
      // bấm lần đầu = chọn làm nguồn, bấm lại chính nó = gỡ ra (nếu là đầu mạch)
      if (this.active && this.active.x === x && this.active.y === y) this.remove(x, y);
      else this.active = { x, y };
      this.emitBoard();
      return;
    }

    const check = this.placement(x, y);
    if (!check.ok) {
      this.say(check.reason, 'warn');
      return;
    }
    this.atoms.set(key, { x, y });
    if (check.source) this.bonds.add(bondKey(key, cellKey(check.source.x, check.source.y)));
    this.active = { x, y };
    this.onEvent({ type: 'place' });
    this.emitBoard();
    if (this.atoms.size === this.carbons) this.checkStructure();
  }

  remove(x: number, y: number): void {
    const check = this.removable(x, y);
    if (!check.ok) {
      this.say(check.reason, 'warn');
      return;
    }
    const key = cellKey(x, y);
    const [attached] = this.bondedNeighbors(x, y);
    this.atoms.delete(key);
    if (attached) this.bonds.delete(bondKey(key, cellKey(attached[0], attached[1])));
    this.active = attached ? { x: attached[0], y: attached[1] } : null;
    this.onEvent({ type: 'remove' });
    this.emitBoard();
  }

  clearBoard(announce = true): void {
    if (this.gameOver || this.atoms.size === 0) return;
    this.resetBoard();
    if (announce) this.say('Đã xóa bàn chơi', 'info');
    this.emitBoard();
  }

  resetBoard(): void {
    this.atoms.clear();
    this.bonds.clear();
    this.active = null;
  }

  setHover(x: number, y: number): void {
    this.hover = inBounds(x, y) ? { x, y } : null;
  }

  // ------------------------------------------------ chấm bài
  adjacency(): Adjacency {
    const list = [...this.atoms.values()];
    const index = new Map(list.map((a, i) => [cellKey(a.x, a.y), i]));
    return list.map((a) =>
      this.bondedNeighbors(a.x, a.y)
        .map(([nx, ny]) => index.get(cellKey(nx, ny)))
        .filter((i): i is number => i !== undefined),
    );
  }

  checkStructure(): void {
    const key = canonicalKey(this.adjacency());
    const isomer = this.isomers.find((i) => i.key === key);
    if (!isomer) {
      // mọi cây n đỉnh bậc ≤4 đều nằm trong danh sách, nhánh này chỉ để phòng thân
      this.say('Cấu trúc không hợp lệ', 'warn');
      return;
    }
    if (this.found.has(key)) {
      this.say(`${isomer.name} — đồng phân này đã tìm rồi!`, 'warn');
      return;
    }

    this.found.add(key);
    const bonus = Math.round(200 * (this.remaining / this.limitMs));
    const gained = 100 + bonus;
    this.score += gained;
    this.remaining = this.limitMs; // giải được thì reset đồng hồ
    this.lastWholeSecond = this.difficulty.seconds;
    this.resetBoard();

    this.onEvent({ type: 'solved', isomer, gained, bonus, found: this.found.size, total: this.isomers.length });
    this.emitBoard();

    if (this.found.size === this.isomers.length) {
      this.won = true;
      this.finish('complete');
    }
  }

  say(text: string, kind: FlashKind): void {
    this.flash = { text, kind, until: this.now + 1800 };
    this.onEvent({ type: 'flash', text, kind });
  }

  // ------------------------------------------------ vòng lặp
  update(dtMs: number): void {
    this.now += dtMs;
    if (this.flash && this.now > this.flash.until) this.flash = null;
    if (this.gameOver) return;

    this.remaining -= dtMs;
    const whole = Math.max(0, Math.ceil(this.remaining / 1000));
    if (whole !== this.lastWholeSecond) {
      this.lastWholeSecond = whole;
      this.onEvent({ type: 'tick', seconds: whole });
    }
    if (this.remaining <= 0) {
      this.remaining = 0;
      this.finish('timeout');
    }
  }

  finish(reason: 'timeout' | 'complete'): void {
    if (this.gameOver) return;
    this.gameOver = true;
    this.onEvent({
      type: 'gameover',
      reason,
      won: this.won,
      score: this.score,
      found: this.found.size,
      total: this.isomers.length,
    });
  }

  emitBoard(): void {
    this.onEvent({ type: 'board', placed: this.atoms.size, left: this.carbonsLeft, found: [...this.found] });
  }
}
