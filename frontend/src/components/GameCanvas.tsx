import { useEffect, useRef } from 'react';
import type { PointerEvent, RefObject } from 'react';
import { GameEngine } from '../feature/in-organic/engine';
import type { GameEventHandler } from '../feature/in-organic/engine';
import { drawFrame } from '../feature/in-organic/render';
import { WIDTH, HEIGHT, CANNON_X, CANNON_Y } from '../feature/in-organic/grid';
import type { GameSetup } from '../feature/setup';

interface GameCanvasProps {
  onEvent: GameEventHandler;
  engineRef: RefObject<GameEngine | null>;
  setup: GameSetup;
}

export default function GameCanvas({ onEvent, engineRef, setup }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef(0);

  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;

    const engine = new GameEngine({ onEvent, ...setup });
    engine.setAim(CANNON_X, CANNON_Y - 200);
    engineRef.current = engine;

    let last = performance.now();
    const loop = (now: number) => {
      engine.update(now - last);
      last = now;
      drawFrame(ctx, engine);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);

    return () => cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getPos = (e: PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) * WIDTH) / rect.width,
      y: ((e.clientY - rect.top) * HEIGHT) / rect.height,
    };
  };

  const handleMove = (e: PointerEvent<HTMLCanvasElement>) => {
    const pos = getPos(e);
    engineRef.current?.setAim(pos.x, pos.y);
  };

  const handleDown = (e: PointerEvent<HTMLCanvasElement>) => {
    const pos = getPos(e);
    const engine = engineRef.current;
    if (!engine) return;
    engine.setAim(pos.x, pos.y);
    engine.fire();
  };

  return (
    <canvas
      ref={canvasRef}
      width={WIDTH}
      height={HEIGHT}
      className="game-canvas"
      onPointerMove={handleMove}
      onPointerDown={handleDown}
    />
  );
}
