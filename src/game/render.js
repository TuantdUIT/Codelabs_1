import { ionLabel } from './ions.js';
import { CANNON_X } from './engine.js';

export function drawFrame(ctx, engine, aim) {
  const { width, height } = engine;
  ctx.clearRect(0, 0, width, height);

  // background grid glow
  const grad = ctx.createLinearGradient(0, 0, width, height);
  grad.addColorStop(0, '#0b1220');
  grad.addColorStop(1, '#111a2e');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.04)';
  ctx.lineWidth = 1;
  for (let x = 0; x < width; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0; y < height; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
  ctx.restore();

  // danger zone at left edge
  const dz = ctx.createLinearGradient(0, 0, 90, 0);
  dz.addColorStop(0, 'rgba(255,60,60,0.35)');
  dz.addColorStop(1, 'rgba(255,60,60,0)');
  ctx.fillStyle = dz;
  ctx.fillRect(0, 0, 90, height);

  // bubbles
  for (const b of engine.bubbles) {
    drawBubble(ctx, b);
  }

  // projectiles
  for (const p of engine.projectiles) {
    const x = p.fromX + (p.toX - p.fromX) * p.t;
    const y = p.fromY + (p.toY - p.fromY) * p.t;
    ctx.beginPath();
    ctx.arc(x, y, 8, 0, Math.PI * 2);
    ctx.fillStyle = p.ion.color;
    ctx.shadowColor = p.ion.color;
    ctx.shadowBlur = 12;
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  // particles
  for (const particle of engine.particles) {
    ctx.globalAlpha = Math.max(0, particle.life / particle.maxLife);
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, 3, 0, Math.PI * 2);
    ctx.fillStyle = particle.color;
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  drawCannon(ctx, height, engine.selected, aim);
}

function drawBubble(ctx, b) {
  const { x, y, radius, ion, type, reactingWith, remaining } = b;
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  const grad = ctx.createRadialGradient(x - radius * 0.3, y - radius * 0.3, radius * 0.1, x, y, radius);
  grad.addColorStop(0, lighten(ion.color, 0.35));
  grad.addColorStop(1, ion.color);
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.lineWidth = reactingWith ? 3 : 1.5;
  ctx.strokeStyle = reactingWith ? '#ffffff' : 'rgba(255,255,255,0.5)';
  ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.fillStyle = '#0b1220';
  ctx.font = 'bold 18px "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(ionLabel(ion, type), x, y);
  ctx.restore();

  if (reactingWith && remaining > 0) {
    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`còn ${remaining}`, x, y + radius + 14);
    ctx.restore();
  }
}

function drawCannon(ctx, height, selected, aim) {
  const baseX = CANNON_X;
  const baseY = height - 40;
  const angle = aim ? Math.atan2(aim.y - baseY, aim.x - baseX) : 0;

  ctx.save();
  ctx.translate(baseX, baseY);
  ctx.beginPath();
  ctx.arc(0, 0, 22, 0, Math.PI * 2);
  ctx.fillStyle = '#1c2740';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.25)';
  ctx.stroke();

  ctx.rotate(angle);
  ctx.fillStyle = selected.ion.color;
  ctx.shadowColor = selected.ion.color;
  ctx.shadowBlur = 10;
  ctx.fillRect(0, -6, 32, 12);
  ctx.shadowBlur = 0;
  ctx.restore();

  if (selected) {
    ctx.save();
    ctx.fillStyle = '#dbe7ff';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(ionLabel(selected.ion, selected.type), baseX, baseY + 40);
    ctx.restore();
  }
}

function lighten(hex, amount) {
  const c = hex.replace('#', '');
  const num = parseInt(c, 16);
  let r = (num >> 16) & 0xff;
  let g = (num >> 8) & 0xff;
  let b = num & 0xff;
  r = Math.min(255, Math.floor(r + (255 - r) * amount));
  g = Math.min(255, Math.floor(g + (255 - g) * amount));
  b = Math.min(255, Math.floor(b + (255 - b) * amount));
  return `rgb(${r},${g},${b})`;
}
