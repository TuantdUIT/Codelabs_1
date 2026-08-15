import { ionLabel } from './ions.js';
import * as G from './grid.js';

export function drawFrame(ctx, engine) {
  ctx.clearRect(0, 0, G.WIDTH, G.HEIGHT);
  drawBackground(ctx);
  drawDeathLine(ctx);

  for (const bubble of engine.grid.values()) {
    drawBubble(ctx, G.cellX(bubble.row, bubble.col), G.cellY(bubble.row), bubble.ion, G.R);
  }
  for (const bubble of engine.falling) {
    ctx.save();
    ctx.globalAlpha = 0.85;
    drawBubble(ctx, bubble.x, bubble.y, bubble.ion, G.R);
    ctx.restore();
  }

  if (!engine.gameOver && !engine.shot) drawAim(ctx, engine);
  if (engine.shot) drawBubble(ctx, engine.shot.x, engine.shot.y, engine.shot.ion, G.R);

  for (const particle of engine.particles) {
    ctx.globalAlpha = Math.max(0, particle.life / particle.maxLife);
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, 3, 0, Math.PI * 2);
    ctx.fillStyle = particle.color;
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  drawCannon(ctx, engine);
}

function drawBackground(ctx) {
  const gradient = ctx.createLinearGradient(0, 0, 0, G.HEIGHT);
  gradient.addColorStop(0, '#0d1526');
  gradient.addColorStop(1, '#0a101d');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, G.WIDTH, G.HEIGHT);

  ctx.fillStyle = 'rgba(255,255,255,0.025)';
  ctx.fillRect(G.PLAY_LEFT, 0, G.PLAY_RIGHT - G.PLAY_LEFT, G.HEIGHT - 96);

  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(G.PLAY_LEFT, 0);
  ctx.lineTo(G.PLAY_LEFT, G.HEIGHT - 96);
  ctx.moveTo(G.PLAY_RIGHT, 0);
  ctx.lineTo(G.PLAY_RIGHT, G.HEIGHT - 96);
  ctx.stroke();
}

function drawDeathLine(ctx) {
  ctx.save();
  ctx.setLineDash([8, 8]);
  ctx.strokeStyle = 'rgba(255,90,90,0.5)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(G.PLAY_LEFT, G.DEATH_Y);
  ctx.lineTo(G.PLAY_RIGHT, G.DEATH_Y);
  ctx.stroke();
  ctx.restore();
}

function drawBubble(ctx, x, y, ion, radius) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  const gradient = ctx.createRadialGradient(x - radius * 0.35, y - radius * 0.35, radius * 0.1, x, y, radius);
  gradient.addColorStop(0, lighten(ion.color, 0.45));
  gradient.addColorStop(1, ion.color);
  ctx.fillStyle = gradient;
  ctx.fill();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = 'rgba(0,0,0,0.35)';
  ctx.stroke();

  const label = ionLabel(ion, ion.type);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  let size = 13;
  ctx.font = `bold ${size}px "Segoe UI", sans-serif`;
  while (ctx.measureText(label).width > radius * 1.85 && size > 8) {
    size -= 1;
    ctx.font = `bold ${size}px "Segoe UI", sans-serif`;
  }
  ctx.lineWidth = 3;
  ctx.strokeStyle = 'rgba(0,0,0,0.55)';
  ctx.strokeText(label, x, y + 1);
  ctx.fillStyle = '#ffffff';
  ctx.fillText(label, x, y + 1);
  ctx.restore();
}

function drawAim(ctx, engine) {
  const points = engine.aimPath();
  ctx.save();
  ctx.setLineDash([6, 8]);
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'rgba(160,200,255,0.55)';
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
  ctx.stroke();
  ctx.setLineDash([]);

  const end = points[points.length - 1];
  ctx.beginPath();
  ctx.arc(end.x, end.y, 4, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(160,200,255,0.8)';
  ctx.fill();
  ctx.restore();
}

function drawCannon(ctx, engine) {
  const { CANNON_X: x, CANNON_Y: y } = G;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(engine.aimAngle + Math.PI / 2);
  ctx.fillStyle = '#243354';
  roundRect(ctx, -9, -46, 18, 46, 6);
  ctx.fill();
  ctx.restore();

  ctx.beginPath();
  ctx.arc(x, y, 27, 0, Math.PI * 2);
  ctx.fillStyle = '#1b2740';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.2)';
  ctx.lineWidth = 2;
  ctx.stroke();

  if (engine.ammo[0] && !engine.shot) drawBubble(ctx, x, y, engine.ammo[0], G.R);

  ctx.save();
  ctx.fillStyle = 'rgba(220,232,255,0.55)';
  ctx.font = '10px "Segoe UI", sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('TIẾP THEO', 16, G.HEIGHT - 62);
  for (let i = 1; i < engine.ammo.length; i++) {
    drawBubble(ctx, 26 + (i - 1) * 34, G.HEIGHT - 30, engine.ammo[i], 14);
  }
  ctx.restore();
}

function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

function lighten(hex, amount) {
  const value = Number.parseInt(hex.replace('#', ''), 16);
  const rgb = [(value >> 16) & 0xff, (value >> 8) & 0xff, value & 0xff];
  const lightened = rgb.map((channel) => Math.min(255, Math.floor(channel + (255 - channel) * amount)));
  return `rgb(${lightened[0]},${lightened[1]},${lightened[2]})`;
}
