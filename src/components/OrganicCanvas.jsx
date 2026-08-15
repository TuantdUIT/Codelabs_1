import { useEffect, useRef } from 'react';
import { OrganicEngine, CELL, HEIGHT, ORIGIN_X, ORIGIN_Y, WIDTH } from '../game/organic-engine.js';
import { drawOrganic } from '../game/organic-render.js';

export default function OrganicCanvas({ onEvent, engineRef, difficultyId }) {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    const engine = new OrganicEngine({ onEvent, difficultyId });
    engineRef.current = engine;
    onEvent({ type: 'ready', engine });

    const ctx = canvasRef.current.getContext('2d');
    let last = performance.now();
    const loop = (now) => {
      engine.update(now - last);
      last = now;
      drawOrganic(ctx, engine);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);

    return () => cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toCell = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const px = ((e.clientX - rect.left) * WIDTH) / rect.width;
    const py = ((e.clientY - rect.top) * HEIGHT) / rect.height;
    return { x: Math.round((px - ORIGIN_X) / CELL), y: Math.round((py - ORIGIN_Y) / CELL) };
  };

  return (
    <canvas
      ref={canvasRef}
      width={WIDTH}
      height={HEIGHT}
      className="game-canvas game-canvas--organic"
      onPointerMove={(e) => {
        const cell = toCell(e);
        engineRef.current?.setHover(cell.x, cell.y);
      }}
      onPointerLeave={() => engineRef.current?.setHover(NaN, NaN)}
      onPointerDown={(e) => {
        const cell = toCell(e);
        engineRef.current?.click(cell.x, cell.y);
      }}
    />
  );
}
