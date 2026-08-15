import { useEffect, useRef } from 'react';
import { GameEngine } from '../game/engine.js';
import { drawFrame } from '../game/render.js';

const WIDTH = 900;
const HEIGHT = 520;

export default function GameCanvas({ onEvent, engineRef }) {
  const canvasRef = useRef(null);
  const aimRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    const engine = new GameEngine({ width: WIDTH, height: HEIGHT, onEvent });
    engineRef.current = engine;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    let last = performance.now();
    const loop = (now) => {
      const dt = now - last;
      last = now;
      engine.update(dt);
      drawFrame(ctx, engine, aimRef.current);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);

    return () => cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getPos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = WIDTH / rect.width;
    const scaleY = HEIGHT / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handleMove = (e) => {
    aimRef.current = getPos(e);
  };

  const handleClick = (e) => {
    const pos = getPos(e);
    const engine = engineRef.current;
    if (!engine) return;
    const bubble = engine.hitTest(pos.x, pos.y);
    if (bubble) engine.shootAt(bubble.id);
  };

  return (
    <canvas
      ref={canvasRef}
      width={WIDTH}
      height={HEIGHT}
      className="game-canvas"
      onMouseMove={handleMove}
      onClick={handleClick}
    />
  );
}
