import { useCallback, useEffect, useRef, useState } from 'react';
import GameCanvas from './components/GameCanvas.jsx';
import IonLegend from './components/IonLegend.jsx';
import HUD from './components/HUD.jsx';
import CompoundLog from './components/CompoundLog.jsx';
import StartScreen from './components/StartScreen.jsx';
import GameOverScreen from './components/GameOverScreen.jsx';
import OrganicGame from './components/OrganicGame.jsx';
import { DEFAULT_ANION_IDS, DEFAULT_CATION_IDS } from './game/ions.js';
import { MusicPlayer, OFF, TRACKS, trackById } from './game/music.js';
import './App.css';

export default function App() {
  const [screen, setScreen] = useState('start');
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [message, setMessage] = useState('');
  const [entries, setEntries] = useState([]);
  const [finalStats, setFinalStats] = useState({ score: 0, compoundsMade: 0 });
  const [organicStats, setOrganicStats] = useState(null);
  const [runKey, setRunKey] = useState(0);
  const [setup, setSetup] = useState({
    mode: 'inorganic',
    difficultyId: 'easy',
    cationIds: DEFAULT_CATION_IDS,
    anionIds: DEFAULT_ANION_IDS,
  });
  const [music, setMusic] = useState({ trackId: TRACKS[0].id, volume: 0.55, muted: false });
  const [previewing, setPreviewing] = useState(false);

  const engineRef = useRef(null);
  const messageTimer = useRef(null);
  const playerRef = useRef(null);

  const getPlayer = () => {
    playerRef.current ??= new MusicPlayer();
    return playerRef.current;
  };

  useEffect(() => () => playerRef.current?.dispose(), []);
  useEffect(() => playerRef.current?.setVolume(music.volume), [music.volume]);
  useEffect(() => playerRef.current?.setMuted(music.muted), [music.muted]);
  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;
    if (screen === 'playing') {
      setPreviewing(false);
      player.play(music.trackId);
    } else {
      player.stop();
    }
  }, [screen, music.trackId]);

  const handleTrackChange = (trackId) => {
    setMusic((current) => ({ ...current, trackId }));
    if (!previewing) return;
    if (trackId === OFF) {
      getPlayer().stop();
      setPreviewing(false);
    } else {
      getPlayer().play(trackId);
    }
  };

  const handlePreview = () => {
    const player = getPlayer();
    if (previewing) {
      player.stop();
      setPreviewing(false);
      return;
    }
    player.setVolume(music.volume);
    player.setMuted(music.muted);
    player.play(music.trackId);
    setPreviewing(true);
  };

  const toggleMute = () => setMusic((current) => ({ ...current, muted: !current.muted }));

  const flashMessage = (text) => {
    setMessage(text);
    clearTimeout(messageTimer.current);
    messageTimer.current = setTimeout(() => setMessage(''), 1800);
  };

  const handleEvent = useCallback((event) => {
    switch (event.type) {
      case 'score':
        setScore(event.score);
        break;
      case 'level':
        setLevel(event.level);
        flashMessage(`Cấp độ ${event.level}! Lưới sẽ tụt nhanh hơn.`);
        break;
      case 'success':
        setEntries((previous) => [{ ...event.compound, gained: event.gained }, ...previous].slice(0, 12));
        flashMessage(`✅ ${event.compound.formula} — ${event.compound.name}!${event.dropped ? ` +${event.dropped} bóng rơi` : ''}`);
        break;
      case 'drop':
        flashMessage('⬇️ Lưới ion tụt thêm một hàng!');
        break;
      case 'clear':
        flashMessage('🎉 Dọn sạch lưới! +100 điểm');
        break;
      case 'gameover':
        setFinalStats({ score: event.score, compoundsMade: event.compoundsMade });
        setScreen('gameover');
        break;
      default:
        break;
    }
  }, []);

  const handleOrganicGameOver = useCallback((stats) => {
    setOrganicStats(stats);
    setFinalStats({ score: stats.score, compoundsMade: stats.found });
    setScreen('gameover');
  }, []);

  const startGame = (config) => {
    if (config) setSetup(config);
    getPlayer();
    engineRef.current = null;
    setScore(0);
    setLevel(1);
    setEntries([]);
    setMessage('');
    setOrganicStats(null);
    setScreen('playing');
    setRunKey((key) => key + 1);
  };

  const engine = engineRef.current;

  return (
    <div className="app">
      {screen === 'start' && (
        <StartScreen
          setup={setup}
          music={{
            trackId: music.trackId,
            volume: music.volume,
            previewing,
            onChange: handleTrackChange,
            onVolume: (volume) => setMusic((current) => ({ ...current, volume })),
            onPreview: handlePreview,
          }}
          onStart={startGame}
        />
      )}
      {screen === 'gameover' && (
        <GameOverScreen
          score={finalStats.score}
          compoundsMade={finalStats.compoundsMade}
          organic={organicStats}
          onRestart={() => startGame()}
          onChangeSetup={() => setScreen('start')}
        />
      )}
      {screen === 'playing' && setup.mode === 'organic' && (
        <OrganicGame
          key={runKey}
          difficultyId={setup.difficultyId}
          music={{
            trackName: trackById(music.trackId)?.name,
            muted: music.muted,
            onToggleMute: toggleMute,
          }}
          onGameOver={handleOrganicGameOver}
        />
      )}
      {screen === 'playing' && setup.mode !== 'organic' && (
        <div className="game-layout" key={runKey}>
          <div className="game-main">
            <HUD
              score={score}
              level={level}
              message={message}
              trackName={trackById(music.trackId)?.name}
              muted={music.muted}
              onToggleMute={toggleMute}
            />
            <GameCanvas onEvent={handleEvent} engineRef={engineRef} setup={setup} />
          </div>
          <div className="side-panels">
            {engine && <IonLegend cations={engine.activeCations} anions={engine.activeAnions} />}
            <CompoundLog entries={entries} />
          </div>
        </div>
      )}
    </div>
  );
}
