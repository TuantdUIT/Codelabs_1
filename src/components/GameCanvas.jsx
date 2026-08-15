import { useEffect, useRef } from 'react';
import { GameEngine } from '../game/engine.js';
import { drawFrame } from '../game/render.js';
import { WIDTH, HEIGHT, CANNON_X, CANNON_Y } from '../game/grid.js';

export default function GameCanvas({ onEvent, engineRef, setup }) {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    const engine = new GameEngine({ onEvent, ...setup });
    engine.setAim(CANNON_X, CANNON_Y - 200);
    engineRef.current = engine;

    const ctx = canvasRef.current.getContext('2d');
    let last = performance.now();
    const loop = (now) => {
      engine.update(now - last);
      last = now;
      drawFrame(ctx, engine);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);

    return () => cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getPos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) * WIDTH) / rect.width,
      y: ((e.clientY - rect.top) * HEIGHT) / rect.height,
    };
  };

  const handleMove = (e) => {
    const pos = getPos(e);
    engineRef.current?.setAim(pos.x, pos.y);
  };

  const handleDown = (e) => {
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
