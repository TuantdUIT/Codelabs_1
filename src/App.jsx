import { useCallback, useRef, useState } from 'react';
import GameCanvas from './components/GameCanvas.jsx';
import IonPalette from './components/IonPalette.jsx';
import HUD from './components/HUD.jsx';
import CompoundLog from './components/CompoundLog.jsx';
import StartScreen from './components/StartScreen.jsx';
import GameOverScreen from './components/GameOverScreen.jsx';
import './App.css';

export default function App() {
  const [screen, setScreen] = useState('start'); // start | playing | gameover
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);
  const [message, setMessage] = useState('');
  const [entries, setEntries] = useState([]);
  const [finalStats, setFinalStats] = useState({ score: 0, compoundsMade: 0 });
  const [selected, setSelected] = useState(null);
  const [runKey, setRunKey] = useState(0);

  const engineRef = useRef(null);
  const messageTimer = useRef(null);

  const flashMessage = (text) => {
    setMessage(text);
    clearTimeout(messageTimer.current);
    messageTimer.current = setTimeout(() => setMessage(''), 1800);
  };

  const handleEvent = useCallback((evt) => {
    switch (evt.type) {
      case 'score':
        setScore(evt.score);
        break;
      case 'lives':
        setLives(evt.lives);
        break;
      case 'level':
        setLevel(evt.level);
        flashMessage(`Cấp độ ${evt.level}! Tốc độ tăng.`);
        break;
      case 'select':
        setSelected({ ion: evt.ion, type: evt.ionType });
        break;
      case 'success':
        setEntries((prev) => [{ ...evt.compound, gained: evt.gained }, ...prev].slice(0, 12));
        flashMessage(`✅ ${evt.compound.formula} — ${evt.compound.name}!`);
        break;
      case 'wrong':
        flashMessage('❌ Sai tổ hợp ion!');
        break;
      case 'escape':
        flashMessage('⚠️ Bong bóng đã lọt qua!');
        break;
      case 'gameover':
        setFinalStats({ score: evt.score, compoundsMade: evt.compoundsMade });
        setScreen('gameover');
        break;
      default:
        break;
    }
  }, []);

  const startGame = () => {
    setScore(0);
    setLives(3);
    setLevel(1);
    setEntries([]);
    setMessage('');
    setScreen('playing');
    setRunKey((k) => k + 1);
  };

  const handleSelectIon = (ion, type) => {
    engineRef.current?.selectIon(ion, type);
  };

  return (
    <div className="app">
      {screen === 'start' && <StartScreen onStart={startGame} />}
      {screen === 'gameover' && (
        <GameOverScreen score={finalStats.score} compoundsMade={finalStats.compoundsMade} onRestart={startGame} />
      )}
      {screen === 'playing' && (
        <div className="game-layout" key={runKey}>
          <div className="game-main">
            <HUD score={score} lives={lives} level={level} message={message} />
            <GameCanvas onEvent={handleEvent} engineRef={engineRef} />
            {selected && engineRef.current && (
              <IonPalette
                cations={engineRef.current.activeCations}
                anions={engineRef.current.activeAnions}
                selected={selected}
                onSelect={handleSelectIon}
              />
            )}
          </div>
          <CompoundLog entries={entries} />
        </div>
      )}
    </div>
  );
}
