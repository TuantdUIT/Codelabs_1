import { atomLabel } from './organic';
import type { OrganicEngine } from './organic-engine';
import * as B from './organic-engine';

// Màu theo số liên kết — người chơi thấy ngay CH₃ → CH₂ → CH → C khi nối thêm.
const DEGREE_COLOR = ['#9d6bff', '#4f9cff', '#21c7b8', '#ffd93d', '#ff5fbf'];

export function drawOrganic(ctx: CanvasRenderingContext2D, engine: OrganicEngine): void {
  ctx.clearRect(0, 0, B.WIDTH, B.HEIGHT);
  drawBackground(ctx);
  drawTimer(ctx, engine);
  drawLattice(ctx, engine);
  drawBonds(ctx, engine);

  for (const atom of engine.atoms.values()) {
    const { px, py } = B.cellPx(atom.x, atom.y);
    drawAtom(ctx, px, py, engine.degreeAt(atom.x, atom.y), B.ATOM_R);
  }

  drawActive(ctx, engine);
  drawHover(ctx, engine);
  drawStock(ctx, engine);
  drawFlash(ctx, engine);
}

function drawBackground(ctx: CanvasRenderingContext2D): void {
  const gradient = ctx.createLinearGradient(0, 0, 0, B.HEIGHT);
  gradient.addColorStop(0, '#0d1526');
  gradient.addColorStop(1, '#0a101d');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, B.WIDTH, B.HEIGHT);
}

function drawTimer(ctx: CanvasRenderingContext2D, engine: OrganicEngine): void {
  const ratio = Math.max(0, engine.remaining / engine.limitMs);
  const low = ratio < 0.25;
  ctx.fillStyle = 'rgba(255,255,255,0.06)';
  ctx.fillRect(0, 0, B.WIDTH, 8);
  ctx.fillStyle = low ? '#ff5a5a' : ratio < 0.5 ? '#ffd93d' : '#3ddc84';
  ctx.fillRect(0, 0, B.WIDTH * ratio, 8);

  ctx.save();
  ctx.font = 'bold 13px "Segoe UI", sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillStyle = low ? '#ff8a8a' : 'rgba(220,232,255,0.8)';
  ctx.fillText(`⏱ ${Math.max(0, engine.remaining / 1000).toFixed(1)}s`, 14, 18);
  ctx.textAlign = 'right';
  ctx.fillStyle = 'rgba(220,232,255,0.8)';
  ctx.fillText(`${engine.found.size}/${engine.isomers.length} đồng phân`, B.WIDTH - 14, 18);
  ctx.restore();
}

function drawLattice(ctx: CanvasRenderingContext2D, engine: OrganicEngine): void {
  for (let x = B.MIN_X; x <= B.MAX_X; x++) {
    for (let y = B.MIN_Y; y <= B.MAX_Y; y++) {
      if (engine.atoms.has(B.cellKey(x, y))) continue;
      const { px, py } = B.cellPx(x, y);
      const open = engine.placement(x, y).ok;
      ctx.beginPath();
      ctx.arc(px, py, open ? 4 : 2.5, 0, Math.PI * 2);
      ctx.fillStyle = open ? 'rgba(120,220,160,0.45)' : 'rgba(255,255,255,0.12)';
      ctx.fill();
    }
  }
}

function drawBonds(ctx: CanvasRenderingContext2D, engine: OrganicEngine): void {
  ctx.save();
  ctx.strokeStyle = 'rgba(226,236,255,0.85)';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  for (const bond of engine.bonds) {
    const [a, b] = bond.split('|').map((cell) => {
      const [x, y] = cell.split(',').map(Number);
      return B.cellPx(x, y);
    });
    ctx.beginPath();
    ctx.moveTo(a.px, a.py);
    ctx.lineTo(b.px, b.py);
    ctx.stroke();
  }
  ctx.restore();
}

// Nguyên tử đang chọn — gốc CH₃ tiếp theo sẽ mọc ra từ đây.
function drawActive(ctx: CanvasRenderingContext2D, engine: OrganicEngine): void {
  if (!engine.active) return;
  const { px, py } = B.cellPx(engine.active.x, engine.active.y);
  ctx.save();
  ctx.strokeStyle = '#ffd93d';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(px, py, B.ATOM_R + 5, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawAtom(ctx: CanvasRenderingContext2D, px: number, py: number, degree: number, radius: number): void {
  const color = DEGREE_COLOR[Math.min(degree, 4)];
  ctx.save();
  ctx.beginPath();
  ctx.arc(px, py, radius, 0, Math.PI * 2);
  const gradient = ctx.createRadialGradient(px - radius * 0.35, py - radius * 0.35, radius * 0.1, px, py, radius);
  gradient.addColorStop(0, lighten(color, 0.45));
  gradient.addColorStop(1, color);
  ctx.fillStyle = gradient;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'rgba(10,16,29,0.85)';
  ctx.stroke();

  const label = atomLabel(degree);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  let size = 14;
  ctx.font = `bold ${size}px "Segoe UI", sans-serif`;
  while (ctx.measureText(label).width > radius * 1.7 && size > 9) {
    size -= 1;
    ctx.font = `bold ${size}px "Segoe UI", sans-serif`;
  }
  ctx.lineWidth = 3;
  ctx.strokeStyle = 'rgba(0,0,0,0.55)';
  ctx.strokeText(label, px, py + 1);
  ctx.fillStyle = '#ffffff';
  ctx.fillText(label, px, py + 1);
  ctx.restore();
}

function drawHover(ctx: CanvasRenderingContext2D, engine: OrganicEngine): void {
  const cell = engine.hover;
  if (!cell || engine.gameOver) return;
  const { px, py } = B.cellPx(cell.x, cell.y);
  const occupied = engine.atoms.has(B.cellKey(cell.x, cell.y));
  const check = occupied ? engine.removable(cell.x, cell.y) : engine.placement(cell.x, cell.y);

  ctx.save();
  ctx.setLineDash([5, 4]);
  ctx.lineWidth = 2;
  ctx.strokeStyle = check.ok ? (occupied ? '#ff9f1c' : '#3ddc84') : '#ff5a5a';
  ctx.beginPath();
  ctx.arc(px, py, B.ATOM_R + 6, 0, Math.PI * 2);
  ctx.stroke();

  if (!occupied && check.ok) {
    ctx.setLineDash([]);
    ctx.globalAlpha = 0.35;
    drawAtom(ctx, px, py, 1, B.ATOM_R);
  }
  ctx.restore();
}

// Kho gốc CH₃ còn lại, xếp dưới đáy bàn chơi.
function drawStock(ctx: CanvasRenderingContext2D, engine: OrganicEngine): void {
  ctx.save();
  ctx.fillStyle = 'rgba(220,232,255,0.55)';
  ctx.font = '11px "Segoe UI", sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('GỐC CH₃ CÒN LẠI', 16, B.STOCK_Y - 26);

  const left = engine.carbonsLeft;
  for (let i = 0; i < engine.carbons; i++) {
    const px = 30 + i * 46;
    ctx.globalAlpha = i < left ? 1 : 0.18;
    drawAtom(ctx, px, B.STOCK_Y, 1, 17);
  }
  ctx.globalAlpha = 1;

  ctx.textAlign = 'right';
  ctx.fillStyle = 'rgba(220,232,255,0.45)';
  ctx.font = '11px "Segoe UI", sans-serif';
  ctx.fillText('Bấm ô trống để nối · bấm nguyên tử để đổi nhánh, bấm lại để gỡ', B.WIDTH - 16, B.STOCK_Y - 26);
  ctx.restore();
}

function drawFlash(ctx: CanvasRenderingContext2D, engine: OrganicEngine): void {
  if (!engine.flash) return;
  const { text, kind } = engine.flash;
  ctx.save();
  ctx.font = 'bold 13px "Segoe UI", sans-serif';
  const width = ctx.measureText(text).width + 28;
  const x = (B.WIDTH - width) / 2;
  const y = B.HEIGHT - 132;
  ctx.fillStyle = kind === 'warn' ? 'rgba(90,25,32,0.92)' : 'rgba(20,32,54,0.92)';
  roundRect(ctx, x, y, width, 30, 8);
  ctx.fill();
  ctx.strokeStyle = kind === 'warn' ? '#ff6b6b' : 'rgba(255,255,255,0.2)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = kind === 'warn' ? '#ffd7d7' : '#dbe7ff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, B.WIDTH / 2, y + 15);
  ctx.restore();
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): void {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

function lighten(hex: string, amount: number): string {
  const value = Number.parseInt(hex.replace('#', ''), 16);
  const rgb = [(value >> 16) & 0xff, (value >> 8) & 0xff, value & 0xff];
  const lightened = rgb.map((channel) => Math.min(255, Math.floor(channel + (255 - channel) * amount)));
  return `rgb(${lightened[0]},${lightened[1]},${lightened[2]})`;
}
