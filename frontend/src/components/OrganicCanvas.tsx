import { useEffect, useRef } from 'react';
import type { PointerEvent, RefObject } from 'react';
import { OrganicEngine, CELL, HEIGHT, ORIGIN_X, ORIGIN_Y, WIDTH } from '../feature/organic/organic-engine';
import type { DifficultyId, OrganicEventHandler } from '../feature/organic/organic-engine';
import { drawOrganic } from '../feature/organic/organic-render';

interface OrganicCanvasProps {
  onEvent: OrganicEventHandler;
  engineRef: RefObject<OrganicEngine | null>;
  difficultyId: DifficultyId;
}

export default function OrganicCanvas({ onEvent, engineRef, difficultyId }: OrganicCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef(0);

  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;

    const engine = new OrganicEngine({ onEvent, difficultyId });
    engineRef.current = engine;
    onEvent({ type: 'ready', engine });

    let last = performance.now();
    const loop = (now: number) => {
      engine.update(now - last);
      last = now;
      drawOrganic(ctx, engine);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);

    return () => cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toCell = (e: PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
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
