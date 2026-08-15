import { ANIONS, CATIONS, pickSubset } from './ions.js';
import { buildCompound } from './chemistry.js';

const BASE_LIVES = 3;
const BUBBLE_RADIUS = 34;
const CANNON_X = 46;

let uid = 0;
const nextId = () => `${Date.now()}_${uid++}`;

export class GameEngine {
  constructor({ width, height, onEvent }) {
    this.width = width;
    this.height = height;
    this.onEvent = onEvent || (() => {});

    this.activeCations = pickSubset(CATIONS, 5);
    this.activeAnions = pickSubset(ANIONS, 5);

    this.bubbles = [];
    this.projectiles = [];
    this.particles = [];

    this.score = 0;
    this.lives = BASE_LIVES;
    this.level = 1;
    this.compoundsMade = 0;
    this.gameOver = false;

    this.spawnInterval = 2200; // ms
    this.baseSpeed = 46; // px/s
    this.timeSinceSpawn = 0;
    this.elapsed = 0;

    this.selected = { ion: this.activeCations[0], type: 'cation' };
    // emit the initial selection so React state stays in sync from the start
    this.onEvent({ type: 'select', ion: this.selected.ion, ionType: this.selected.type });
  }

  resize(width, height) {
    this.width = width;
    this.height = height;
  }

  selectIon(ion, type) {
    this.selected = { ion, type };
    this.onEvent({ type: 'select', ion, ionType: type });
  }

  // -------- update loop --------
  update(dtMs) {
    if (this.gameOver) return;
    const dt = dtMs / 1000;
    this.elapsed += dtMs;
    this.timeSinceSpawn += dtMs;

    // difficulty ramps every 20s
    const newLevel = 1 + Math.floor(this.elapsed / 20000);
    if (newLevel !== this.level) {
      this.level = newLevel;
      this.onEvent({ type: 'level', level: this.level });
    }

    const speed = this.baseSpeed + (this.level - 1) * 14;
    const interval = Math.max(650, this.spawnInterval - (this.level - 1) * 180);

    if (this.timeSinceSpawn >= interval) {
      this.timeSinceSpawn = 0;
      this.spawnBubble(speed);
    }

    // move bubbles
    for (const b of this.bubbles) {
      b.x -= b.speed * dt;
      b.wobblePhase += dt * b.wobbleFreq;
      b.y = b.baseY + Math.sin(b.wobblePhase) * b.wobbleAmp;
    }

    // escaped bubbles
    const escaped = this.bubbles.filter((b) => b.x + b.radius < 0);
    if (escaped.length) {
      this.bubbles = this.bubbles.filter((b) => b.x + b.radius >= 0);
      for (const b of escaped) {
        this.lives -= 1;
        this.score = Math.max(0, this.score - 10);
        this.onEvent({ type: 'escape', ion: b.ion, ionType: b.type });
        this.onEvent({ type: 'score', score: this.score });
        this.onEvent({ type: 'lives', lives: this.lives });
        if (this.lives <= 0) {
          this.endGame();
          return;
        }
      }
    }

    // move projectiles
    for (const p of this.projectiles) {
      p.t += dt / p.duration;
    }
    const arrived = this.projectiles.filter((p) => p.t >= 1);
    this.projectiles = this.projectiles.filter((p) => p.t < 1);
    for (const p of arrived) {
      this.resolveHit(p);
    }

    // particles
    for (const particle of this.particles) {
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.life -= dt;
    }
    this.particles = this.particles.filter((particle) => particle.life > 0);
  }

  spawnBubble(speed) {
    const isCation = Math.random() < 0.5;
    const pool = isCation ? this.activeCations : this.activeAnions;
    const ion = pool[Math.floor(Math.random() * pool.length)];
    const margin = BUBBLE_RADIUS + 20;
    const baseY = margin + Math.random() * (this.height - margin * 2);
    this.bubbles.push({
      id: nextId(),
      ion,
      type: isCation ? 'cation' : 'anion',
      x: this.width + BUBBLE_RADIUS,
      baseY,
      y: baseY,
      radius: BUBBLE_RADIUS,
      speed: speed * (0.85 + Math.random() * 0.3),
      remaining: ion.charge,
      reactingWith: null, // ion id currently bonding with
      wobblePhase: Math.random() * Math.PI * 2,
      wobbleFreq: 0.6 + Math.random() * 0.4,
      wobbleAmp: 10 + Math.random() * 8,
    });
  }

  // Player clicked/tapped a bubble: fire currently selected ion at it.
  shootAt(bubbleId) {
    const bubble = this.bubbles.find((b) => b.id === bubbleId);
    if (!bubble || this.gameOver) return;
    const { ion, type } = this.selected;
    this.projectiles.push({
      id: nextId(),
      fromX: CANNON_X,
      fromY: this.height - 40,
      toX: bubble.x,
      toY: bubble.y,
      x: CANNON_X,
      y: this.height - 40,
      ion,
      type,
      targetId: bubbleId,
      t: 0,
      duration: 0.22,
    });
    this.onEvent({ type: 'shoot', ion, ionType: type });
  }

  resolveHit(projectile) {
    const bubble = this.bubbles.find((b) => b.id === projectile.targetId);
    const { ion: shotIon, type: shotType } = projectile;
    if (!bubble) return; // bubble already gone (e.g. escaped mid-flight)

    const sameCategory = shotType === bubble.type;
    if (sameCategory) {
      this.registerWrongShot(bubble, 'same-category');
      return;
    }

    if (bubble.reactingWith && bubble.reactingWith !== shotIon.id) {
      this.registerWrongShot(bubble, 'mismatched-ion');
      return;
    }

    bubble.reactingWith = shotIon.id;
    bubble.remaining -= shotIon.charge;
    this.spawnBurst(bubble.x, bubble.y, shotIon.color, 6);

    if (bubble.remaining <= 0) {
      const cation = bubble.type === 'cation' ? bubble.ion : shotIon;
      const anion = bubble.type === 'anion' ? bubble.ion : shotIon;
      const compound = buildCompound(cation, anion);
      const gained = 10 + (compound.complexity - 2) * 5;
      this.score += gained;
      this.compoundsMade += 1;
      this.bubbles = this.bubbles.filter((b) => b.id !== bubble.id);
      this.spawnBurst(bubble.x, bubble.y, '#ffffff', 14);
      this.onEvent({ type: 'success', compound, gained });
      this.onEvent({ type: 'score', score: this.score });
    } else {
      this.onEvent({ type: 'progress', bubble });
    }
  }

  registerWrongShot(bubble, reason) {
    this.score = Math.max(0, this.score - 5);
    this.spawnBurst(bubble.x, bubble.y, '#888888', 4);
    this.onEvent({ type: 'wrong', reason, bubble });
    this.onEvent({ type: 'score', score: this.score });
  }

  spawnBurst(x, y, color, count) {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const speed = 60 + Math.random() * 80;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.4 + Math.random() * 0.3,
        maxLife: 0.7,
        color,
      });
    }
  }

  endGame() {
    this.gameOver = true;
    this.onEvent({ type: 'gameover', score: this.score, compoundsMade: this.compoundsMade });
  }

  hitTest(x, y) {
    // topmost (most recently spawned first, but visually any) bubble under pointer
    for (let i = this.bubbles.length - 1; i >= 0; i--) {
      const b = this.bubbles[i];
      const dx = x - b.x;
      const dy = y - b.y;
      if (dx * dx + dy * dy <= b.radius * b.radius) return b;
    }
    return null;
  }
}

export { CANNON_X, BUBBLE_RADIUS };
