// Hex (offset-row) grid geometry for the bubble field.
// Every row holds COLS cells; odd rows are shifted right by one radius, which
// is what makes the classic staggered bubble-shooter packing.

export const R = 20; // bubble radius
/**
 * Minimum centre-to-centre distance at which a shot collides with a bubble.
 * Kept below 2R so a shot can pass through a one-cell-wide gap.
 */
export const HIT_DIST = 2 * R - 8;
export const COLS = 13;
export const ROW_H = R * Math.sqrt(3);

export const PLAY_LEFT = 10;
export const PLAY_RIGHT = PLAY_LEFT + COLS * 2 * R + R; // 550
export const WIDTH = PLAY_RIGHT + PLAY_LEFT; // 560
export const HEIGHT = 700;

export const GRID_TOP = R + 10; // y of row 0 centre
export const DEATH_Y = HEIGHT - 150; // grid may not cross this line
export const CANNON_X = WIDTH / 2;
export const CANNON_Y = HEIGHT - 62;
export const MAX_ROWS = Math.floor((DEATH_Y - GRID_TOP) / ROW_H) + 1;

/** Toạ độ ô lưới dạng "row,col". */
export type CellKey = string;

export const isOffsetRow = (row: number): boolean => Math.abs(row % 2) === 1;
export const cellX = (row: number, col: number): number =>
  PLAY_LEFT + R + col * 2 * R + (isOffsetRow(row) ? R : 0);
export const cellY = (row: number): number => GRID_TOP + row * ROW_H;
export const key = (row: number, col: number): CellKey => `${row},${col}`;
export const parseKey = (k: CellKey): [row: number, col: number] => {
  const [row, col] = k.split(',').map(Number);
  return [row, col];
};

// Neighbour cells of (row, col), clipped to the board.
export function neighborCells(row: number, col: number): [number, number][] {
  const shifted = isOffsetRow(row);
  const dCol = shifted ? 0 : -1; // column delta of the "left" diagonal neighbour
  const raw: [number, number][] = [
    [row, col - 1],
    [row, col + 1],
    [row - 1, col + dCol],
    [row - 1, col + dCol + 1],
    [row + 1, col + dCol],
    [row + 1, col + dCol + 1],
  ];
  return raw.filter(([r, c]) => r >= 0 && c >= 0 && c < COLS);
}
