import { DEFAULT_ANION_IDS, DEFAULT_CATION_IDS, MIN_IONS, buildAnions, buildCations } from './ions.js';
import { possibleCompounds } from './chemistry.js';
import * as G from './grid.js';

const START_ROWS = 4;
const AMMO_QUEUE = 4;
const MISS_LIMIT = 10;
const DROP_INTERVAL = 34000;
const SHOT_SPEED = 820;
const MIN_ANGLE = 0.17;

let uid = 0;
const nextId = () => `${Date.now()}_${uid++}`;
const pick = (items) => items[Math.floor(Math.random() * items.length)];

export class GameEngine {
  constructor({ onEvent, cationIds, anionIds } = {}) {
    this.width = G.WIDTH;
    this.height = G.HEIGHT;
    this.onEvent = onEvent || (() => {});

    const resolveIonSet = (ids, build, fallback) => {
      const set = build(ids ?? []);
      return set.length >= MIN_IONS ? set : build(fallback);
    };
    this.activeCations = resolveIonSet(cationIds, buildCations, DEFAULT_CATION_IDS);
    this.activeAnions = resolveIonSet(anionIds, buildAnions, DEFAULT_ANION_IDS);
    this.pool = [...this.activeCations, ...this.activeAnions];
    // All formulas here are charge-balanced inorganic compounds for this game.
    this.compounds = possibleCompounds(this.activeCations, this.activeAnions);

    this.grid = new Map();
    this.ammo = [];
    this.shot = null;
    this.falling = [];
    this.particles = [];
    this.aimAngle = -Math.PI / 2;

    this.score = 0;
    this.level = 1;
    this.compoundsMade = 0;
    this.gameOver = false;
    this.elapsed = 0;
    this.sinceDrop = 0;
    this.misses = 0;

    this.fillRows(START_ROWS);
    for (let i = 0; i < AMMO_QUEUE; i++) this.ammo.push(this.rollAmmo());
    this.emitAmmo();
  }

  fillRows(rows, atTop = false) {
    if (atTop) {
      const shifted = new Map();
      for (const bubble of this.grid.values()) {
        bubble.row += 1;
        shifted.set(G.key(bubble.row, bubble.col), bubble);
      }
      this.grid = shifted;
    }

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < G.COLS; col++) {
        const cellKey = G.key(row, col);
        if (this.grid.has(cellKey)) continue;
        this.grid.set(cellKey, { id: nextId(), ion: pick(this.pool), row, col });
      }
    }
  }

  neighborKeys(cellKey) {
    const [row, col] = G.parseKey(cellKey);
    return G.neighborCells(row, col).map(([neighborRow, neighborCol]) => G.key(neighborRow, neighborCol));
  }

  rollAmmo() {
    return pick(this.pool);
  }

  setAim(x, y) {
    const dx = x - G.CANNON_X;
    const dy = y - G.CANNON_Y;
    let angle = Math.atan2(dy, dx);
    if (angle >= -MIN_ANGLE) angle = dx >= 0 ? -MIN_ANGLE : -(Math.PI - MIN_ANGLE);
    else if (angle < -(Math.PI - MIN_ANGLE)) angle = -(Math.PI - MIN_ANGLE);
    this.aimAngle = angle;
  }

  fire() {
    if (this.gameOver || this.shot) return;
    const ion = this.ammo.shift();
    this.ammo.push(this.rollAmmo());
    this.emitAmmo();
    this.shot = {
      id: nextId(),
      ion,
      x: G.CANNON_X,
      y: G.CANNON_Y,
      vx: Math.cos(this.aimAngle) * SHOT_SPEED,
      vy: Math.sin(this.aimAngle) * SHOT_SPEED,
    };
    this.onEvent({ type: 'shoot', ion });
  }

  aimPath() {
    const points = [{ x: G.CANNON_X, y: G.CANNON_Y }];
    let x = G.CANNON_X;
    let y = G.CANNON_Y;
    let vx = Math.cos(this.aimAngle);
    let vy = Math.sin(this.aimAngle);
    let bounces = 0;

    for (let i = 0; i < 400; i++) {
      x += vx * 6;
      y += vy * 6;
      if (x - G.R <= G.PLAY_LEFT || x + G.R >= G.PLAY_RIGHT) {
        x = Math.min(Math.max(x, G.PLAY_LEFT + G.R), G.PLAY_RIGHT - G.R);
        vx = -vx;
        points.push({ x, y });
        if (++bounces > 2) break;
      }
      if (y <= G.GRID_TOP || this.bubbleAt(x, y)) break;
    }
    points.push({ x, y });
    return points;
  }

  bubbleAt(x, y) {
    const hitDistance = (2 * G.R - 3) ** 2;
    for (const bubble of this.grid.values()) {
      const dx = x - G.cellX(bubble.row, bubble.col);
      const dy = y - G.cellY(bubble.row);
      if (dx * dx + dy * dy <= hitDistance) return bubble;
    }
    return null;
  }

  update(dtMs) {
    if (this.gameOver) return;
    const dt = Math.min(dtMs, 50) / 1000;
    this.elapsed += dtMs;
    this.sinceDrop += dtMs;

    const newLevel = 1 + Math.floor(this.elapsed / 40000);
    if (newLevel !== this.level) {
      this.level = newLevel;
      this.onEvent({ type: 'level', level: this.level });
    }

    this.updateShot(dt);

    for (const bubble of this.falling) {
      bubble.vy += 900 * dt;
      bubble.x += bubble.vx * dt;
      bubble.y += bubble.vy * dt;
    }
    this.falling = this.falling.filter((bubble) => bubble.y < G.HEIGHT + 40);

    for (const particle of this.particles) {
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.life -= dt;
    }
    this.particles = this.particles.filter((particle) => particle.life > 0);

    const dropEvery = Math.max(18000, DROP_INTERVAL - (this.level - 1) * 2500);
    if (this.sinceDrop >= dropEvery) {
      this.sinceDrop = 0;
      this.dropRow();
    }
  }

  updateShot(dt) {
    if (!this.shot) return;
    const steps = Math.ceil((SHOT_SPEED * dt) / (G.R * 0.5));
    const substep = dt / steps;

    for (let i = 0; i < steps && this.shot; i++) {
      const shot = this.shot;
      shot.x += shot.vx * substep;
      shot.y += shot.vy * substep;

      if (shot.x - G.R <= G.PLAY_LEFT) {
        shot.x = G.PLAY_LEFT + G.R;
        shot.vx = Math.abs(shot.vx);
      } else if (shot.x + G.R >= G.PLAY_RIGHT) {
        shot.x = G.PLAY_RIGHT - G.R;
        shot.vx = -Math.abs(shot.vx);
      }

      if (shot.y <= G.GRID_TOP || this.bubbleAt(shot.x, shot.y)) {
        this.land(shot);
        this.shot = null;
      } else if (shot.y > G.HEIGHT + G.R) {
        this.shot = null;
      }
    }
  }

  findFreeCell(x, y) {
    const guess = Math.round((y - G.GRID_TOP) / G.ROW_H);
    let best = null;
    let bestDistance = Infinity;
    for (let row = Math.max(0, guess - 1); row <= Math.min(G.MAX_ROWS, guess + 1); row++) {
      for (let col = 0; col < G.COLS; col++) {
        const cellKey = G.key(row, col);
        if (this.grid.has(cellKey)) continue;
        if (row !== 0 && !this.neighborKeys(cellKey).some((neighborKey) => this.grid.has(neighborKey))) continue;
        const dx = x - G.cellX(row, col);
        const dy = y - G.cellY(row);
        const distance = dx * dx + dy * dy;
        if (distance < bestDistance) {
          bestDistance = distance;
          best = { row, col };
        }
      }
    }
    return best;
  }

  land(shot) {
    const cell = this.findFreeCell(shot.x, shot.y);
    if (!cell) return;
    const cellKey = G.key(cell.row, cell.col);
    this.grid.set(cellKey, { id: nextId(), ion: shot.ion, row: cell.row, col: cell.col });

    if (this.resolveCompound(cellKey)) {
      this.misses = 0;
    } else {
      this.misses += 1;
      this.onEvent({ type: 'miss', ion: shot.ion, left: MISS_LIMIT - this.misses });
      if (this.misses >= MISS_LIMIT) {
        this.misses = 0;
        this.dropRow();
        return;
      }
    }
    this.checkDeath();
  }

  // The just-fired bubble may complete any valid formula, not a prescribed target.
  resolveCompound(startKey) {
    const start = this.grid.get(startKey);
    if (!start) return false;

    const candidates = this.compounds
      .filter((compound) => compound.cation.id === start.ion.id || compound.anion.id === start.ion.id)
      .sort((a, b) => a.total - b.total);

    for (const compound of candidates) {
      const group = this.findGroup(startKey, compound);
      if (!group) continue;
      this.completeCompound(compound, group);
      return true;
    }
    return false;
  }

  findGroup(startKey, compound) {
    const need = new Map([
      [compound.cation.id, compound.catSub],
      [compound.anion.id, compound.anSub],
    ]);
    const start = this.grid.get(startKey);
    if (!start || !need.has(start.ion.id)) return null;

    const seen = new Set();
    const stack = [[startKey]];
    while (stack.length) {
      const group = stack.pop();
      const signature = [...group].sort().join('|');
      if (seen.has(signature)) continue;
      seen.add(signature);

      const counts = new Map();
      let fits = true;
      for (const cellKey of group) {
        const ionId = this.grid.get(cellKey).ion.id;
        const count = (counts.get(ionId) ?? 0) + 1;
        if (count > (need.get(ionId) ?? 0)) {
          fits = false;
          break;
        }
        counts.set(ionId, count);
      }
      if (!fits) continue;
      if (group.length === compound.total) return group;

      for (const cellKey of group) {
        for (const neighborKey of this.neighborKeys(cellKey)) {
          if (group.includes(neighborKey)) continue;
          const neighbor = this.grid.get(neighborKey);
          if (!neighbor || !need.has(neighbor.ion.id)) continue;
          stack.push([...group, neighborKey]);
        }
      }
    }
    return null;
  }

  completeCompound(compound, group) {
    for (const cellKey of group) {
      const bubble = this.grid.get(cellKey);
      this.burst(G.cellX(bubble.row, bubble.col), G.cellY(bubble.row), bubble.ion.color, 8);
      this.grid.delete(cellKey);
    }
    const dropped = this.dropFloating();
    const gained = 25 + (compound.total - 2) * 15 + dropped * 10;
    this.score += gained;
    this.compoundsMade += 1;

    this.onEvent({ type: 'success', compound, gained, dropped });
    this.onEvent({ type: 'score', score: this.score });

    if (this.grid.size === 0) {
      this.score += 100;
      this.onEvent({ type: 'clear' });
      this.onEvent({ type: 'score', score: this.score });
      this.fillRows(3);
    }
  }

  dropFloating() {
    const anchored = new Set();
    const queue = [];
    for (let col = 0; col < G.COLS; col++) {
      const cellKey = G.key(0, col);
      if (this.grid.has(cellKey)) {
        anchored.add(cellKey);
        queue.push(cellKey);
      }
    }
    while (queue.length) {
      const cellKey = queue.pop();
      for (const neighborKey of this.neighborKeys(cellKey)) {
        if (!anchored.has(neighborKey) && this.grid.has(neighborKey)) {
          anchored.add(neighborKey);
          queue.push(neighborKey);
        }
      }
    }

    let dropped = 0;
    for (const [cellKey, bubble] of [...this.grid]) {
      if (anchored.has(cellKey)) continue;
      this.grid.delete(cellKey);
      dropped++;
      this.falling.push({
        ion: bubble.ion,
        x: G.cellX(bubble.row, bubble.col),
        y: G.cellY(bubble.row),
        vx: (Math.random() - 0.5) * 90,
        vy: -40,
      });
    }
    return dropped;
  }

  dropRow() {
    this.fillRows(1, true);
    this.onEvent({ type: 'drop' });
    this.checkDeath();
  }

  checkDeath() {
    for (const bubble of this.grid.values()) {
      if (G.cellY(bubble.row) + G.R >= G.DEATH_Y) {
        this.endGame();
        return true;
      }
    }
    return false;
  }

  burst(x, y, color, count) {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const speed = 70 + Math.random() * 90;
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
    if (this.gameOver) return;
    this.gameOver = true;
    this.onEvent({ type: 'gameover', score: this.score, compoundsMade: this.compoundsMade });
  }

  emitAmmo() {
    this.onEvent({ type: 'ammo', ammo: [...this.ammo] });
  }
}
