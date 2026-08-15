// Hex (offset-row) grid geometry for the bubble field.
// Every row holds COLS cells; odd rows are shifted right by one radius, which
// is what makes the classic staggered bubble-shooter packing.

export const R = 20; // bubble radius
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

export const isOffsetRow = (row) => Math.abs(row % 2) === 1;
export const cellX = (row, col) => PLAY_LEFT + R + col * 2 * R + (isOffsetRow(row) ? R : 0);
export const cellY = (row) => GRID_TOP + row * ROW_H;
export const key = (row, col) => `${row},${col}`;
export const parseKey = (k) => k.split(',').map(Number);

// Neighbour cells of (row, col), clipped to the board.
export function neighborCells(row, col) {
  const shifted = isOffsetRow(row);
  const dCol = shifted ? 0 : -1; // column delta of the "left" diagonal neighbour
  const raw = [
    [row, col - 1],
    [row, col + 1],
    [row - 1, col + dCol],
    [row - 1, col + dCol + 1],
    [row + 1, col + dCol],
    [row + 1, col + dCol + 1],
  ];
  return raw.filter(([r, c]) => r >= 0 && c >= 0 && c < COLS);
}
