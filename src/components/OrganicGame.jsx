import { useCallback, useRef, useState } from 'react';
import OrganicCanvas from './OrganicCanvas.jsx';
import IsomerPanel from './IsomerPanel.jsx';
import MusicButton from './MusicButton.jsx';

export default function OrganicGame({ difficultyId, music, onGameOver }) {
  const [engine, setEngine] = useState(null);
  const [score, setScore] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [foundKeys, setFoundKeys] = useState([]);
  const [message, setMessage] = useState('');
  const [log, setLog] = useState([]);
  const engineRef = useRef(null);
  const messageTimer = useRef(null);

  const flash = (text) => {
    setMessage(text);
    clearTimeout(messageTimer.current);
    messageTimer.current = setTimeout(() => setMessage(''), 2200);
  };

  const handleEvent = useCallback(
    (event) => {
      switch (event.type) {
        case 'ready':
          setEngine(event.engine);
          setSeconds(event.engine.difficulty.seconds);
          break;
        case 'tick':
          setSeconds(event.seconds);
          break;
        case 'board':
          setFoundKeys(event.found);
          break;
        case 'solved':
          setScore(engineRef.current?.score ?? 0);
          setLog((previous) => [{ name: event.isomer.name, gained: event.gained }, ...previous].slice(0, 12));
          flash(`✅ ${event.isomer.name} — +${event.gained} điểm (thưởng thời gian +${event.bonus})`);
          break;
        case 'flash':
          if (event.kind === 'warn') flash(`⚠️ ${event.text}`);
          break;
        case 'gameover':
          onGameOver({
            score: event.score,
            found: event.found,
            total: event.total,
            won: event.won,
            reason: event.reason,
          });
          break;
        default:
          break;
      }
    },
    [onGameOver],
  );

  return (
    <div className="game-layout">
      <div className="game-main">
        <div className="hud">
          <div className="hud__stat">
            <span className="hud__label">Điểm</span>
            <span className="hud__value">{score}</span>
          </div>
          <div className="hud__stat">
            <span className="hud__label">Đồng phân</span>
            <span className="hud__value">
              {foundKeys.length}/{engine?.isomers.length ?? '—'}
            </span>
          </div>
          <div className="hud__stat">
            <span className="hud__label">Còn lại</span>
            <span className={`hud__value${seconds <= 10 ? ' is-danger' : ''}`}>{seconds}s</span>
          </div>
          <div className="hud__message">{message}</div>
          <MusicButton trackName={music.trackName} muted={music.muted} onToggleMute={music.onToggleMute} />
        </div>
        <OrganicCanvas onEvent={handleEvent} engineRef={engineRef} difficultyId={difficultyId} />
      </div>

      <div className="side-panels">
        <IsomerPanel
          engine={engine}
          foundKeys={foundKeys}
          seconds={seconds}
          onClear={() => engineRef.current?.clearBoard()}
        />
        {log.length > 0 && (
          <div className="compound-log">
            <h3>Đã dựng được</h3>
            <ul>
              {log.map((entry, index) => (
                <li key={index}>
                  <span className="compound-log__formula">{entry.name}</span>
                  <span className="compound-log__points">+{entry.gained}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
