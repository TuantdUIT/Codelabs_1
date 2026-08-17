import { useCallback, useEffect, useRef, useState } from 'react';
import type { ReactElement } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom';
import GameCanvas from './components/GameCanvas';
import IonLegend from './components/IonLegend';
import HUD from './components/HUD';
import CompoundLog from './components/CompoundLog';
import type { CompoundLogEntry } from './components/CompoundLog';
import StartScreen from './components/StartScreen';
import GameOverScreen from './components/GameOverScreen';
import OrganicGame from './components/OrganicGame';
import AuthBar from './components/AuthBar';
import ScoreBoard from './components/ScoreBoard';
import LandingScreen from './components/LandingScreen';
import { DEFAULT_ANION_IDS, DEFAULT_CATION_IDS } from './feature/in-organic/ions';
import { MusicPlayer, OFF, TRACKS, trackById } from './feature/music';
import { CALLBACK_PATH } from './feature/auth/auth';
import { AuthClient } from './feature/auth/auth-client';
import { InorganicRunRecorder } from './feature/runs/runs';
import { RunsClient } from './feature/runs/runs-client';
import type { AuthUser } from './feature/auth/auth';
import type { OrganicRunPayload } from './feature/runs/runs';
import type { GameEngine, GameEvent } from './feature/in-organic/engine';
import type { OrganicResult } from './feature/organic/organic-engine';
import { MODE_SLUG, modeFromSlug } from './feature/setup';
import type { GameMode, GameSetup, MusicState } from './feature/setup';
import './App.css';

/** Ván chơi giữ state trong bộ nhớ nên /dang-choi và /ket-qua không tự khôi phục
 *  được sau khi F5 — hai route đó có chốt chặn đưa người chơi về màn phù hợp. */
type RunPhase = 'idle' | 'playing' | 'done';

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [runPhase, setRunPhase] = useState<RunPhase>('idle');
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [message, setMessage] = useState('');
  const [entries, setEntries] = useState<CompoundLogEntry[]>([]);
  const [finalStats, setFinalStats] = useState({ score: 0, compoundsMade: 0 });
  const [organicStats, setOrganicStats] = useState<OrganicResult | null>(null);
  const [runKey, setRunKey] = useState(0);
  const [setup, setSetup] = useState<GameSetup>({
    mode: 'inorganic',
    difficultyId: 'easy',
    cationIds: DEFAULT_CATION_IDS,
    anionIds: DEFAULT_ANION_IDS,
  });
  const [music, setMusic] = useState<MusicState>({ trackId: TRACKS[0].id, volume: 0.55, muted: false });
  const [previewing, setPreviewing] = useState(false);
  const [account, setAccount] = useState<AuthUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const engineRef = useRef<GameEngine | null>(null);
  const messageTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const playerRef = useRef<MusicPlayer | null>(null);
  const authRef = useRef<AuthClient | null>(null);
  const runsRef = useRef<RunsClient | null>(null);
  /** Ván đang chơi ở phía server; null nghĩa là chơi khách, không lưu điểm. */
  const runIdRef = useRef<string | null>(null);
  const recorderRef = useRef<InorganicRunRecorder | null>(null);

  const getPlayer = () => {
    playerRef.current ??= new MusicPlayer();
    return playerRef.current;
  };

  const getAuth = () => {
    authRef.current ??= new AuthClient();
    return authRef.current;
  };

  const getRuns = () => {
    runsRef.current ??= new RunsClient(getAuth());
    return runsRef.current;
  };

  /** Nộp kết quả. Chưa đăng nhập hoặc lỗi mạng thì bỏ qua, không chặn người chơi. */
  const submitRun = async (score: number, payload: OrganicRunPayload | ReturnType<InorganicRunRecorder['toPayload']>) => {
    const runId = runIdRef.current;
    runIdRef.current = null;
    if (!runId) return;
    const result = await getRuns().finish(runId, score, payload);
    if (result && !result.scoreVerified) {
      flashMessage('⚠️ Điểm chưa được xác thực nên không lên bảng xếp hạng');
    }
  };

  useEffect(() => () => playerRef.current?.dispose(), []);

  // Mở trang (kể cả khi vừa từ /auth/callback quay về): thử khôi phục phiên bằng
  // cookie refresh. Không có cookie thì im lặng coi như khách.
  useEffect(() => {
    let cancelled = false;
    getAuth()
      .restore()
      .then((user) => {
        if (!cancelled) setAccount(user);
      })
      .catch(() => {
        if (!cancelled) setAccount(null);
      })
      .finally(() => {
        // Xoá /auth/callback khỏi lịch sử bằng router để state của router khớp URL.
        if (window.location.pathname === CALLBACK_PATH) navigate('/', { replace: true });
        if (!cancelled) setAuthLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // Chỉ chạy một lần lúc mở trang; `navigate` ổn định nên không cần vào deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogout = async () => {
    await getAuth().logout();
    setAccount(null);
  };
  useEffect(() => playerRef.current?.setVolume(music.volume), [music.volume]);
  useEffect(() => playerRef.current?.setMuted(music.muted), [music.muted]);
  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;
    if (location.pathname === '/dang-choi') {
      setPreviewing(false);
      player.play(music.trackId);
    } else {
      player.stop();
    }
  }, [location.pathname, music.trackId]);

  const handleTrackChange = (trackId: string) => {
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

  const openScores = () => navigate('/bang-xep-hang');

  const flashMessage = (text: string) => {
    setMessage(text);
    clearTimeout(messageTimer.current);
    messageTimer.current = setTimeout(() => setMessage(''), 1800);
  };

  const handleEvent = useCallback((event: GameEvent) => {
    switch (event.type) {
      case 'score':
        setScore(event.score);
        break;
      case 'level':
        setLevel(event.level);
        recorderRef.current?.recordLevel(event.level);
        flashMessage(`Cấp độ ${event.level}! Lưới sẽ tụt nhanh hơn.`);
        break;
      case 'success':
        recorderRef.current?.recordCompound({
          cation_id: event.compound.cation.id,
          anion_id: event.compound.anion.id,
          dropped: event.dropped,
          at_ms: Math.round(engineRef.current?.elapsed ?? 0),
        });
        setEntries((previous) => [{ ...event.compound, gained: event.gained }, ...previous].slice(0, 12));
        flashMessage(`✅ ${event.compound.formula} — ${event.compound.name}!${event.dropped ? ` +${event.dropped} bóng rơi` : ''}`);
        break;
      case 'drop':
        recorderRef.current?.recordRowDrop();
        flashMessage('⬇️ Lưới ion tụt thêm một hàng!');
        break;
      case 'clear':
        recorderRef.current?.recordGridCleared();
        flashMessage('🎉 Dọn sạch lưới! +100 điểm');
        break;
      case 'gameover':
        setFinalStats({ score: event.score, compoundsMade: event.compoundsMade });
        setRunPhase('done');
        navigate('/ket-qua', { replace: true });
        if (recorderRef.current) void submitRun(event.score, recorderRef.current.toPayload());
        break;
      default:
        break;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleOrganicGameOver = useCallback((stats: OrganicResult, payload: OrganicRunPayload | null) => {
    setOrganicStats(stats);
    setFinalStats({ score: stats.score, compoundsMade: stats.found });
    setRunPhase('done');
    navigate('/ket-qua', { replace: true });
    if (payload) void submitRun(stats.score, payload);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startGame = (config?: GameSetup) => {
    const next = config ?? setup;
    if (config) setSetup(config);
    getPlayer();
    engineRef.current = null;
    setScore(0);
    setLevel(1);
    setEntries([]);
    setMessage('');
    setOrganicStats(null);
    setRunPhase('playing');
    navigate('/dang-choi');
    setRunKey((key) => key + 1);

    // Mở ván ở server song song với việc vào màn chơi — không bắt người chơi đợi
    // mạng. Chưa đăng nhập thì `start` trả null và ván này đơn giản là không lưu.
    runIdRef.current = null;
    recorderRef.current =
      next.mode === 'organic' ? null : new InorganicRunRecorder(next.cationIds, next.anionIds);
    void getRuns()
      .start(next.mode)
      .then((started) => {
        runIdRef.current = started?.runId ?? null;
      });
  };

  const engine = engineRef.current;
  const isLanding = location.pathname === '/' || location.pathname.startsWith('/cach-choi');
  const authBar = <AuthBar user={account} loading={authLoading} onLogout={handleLogout} />;

  const renderLanding = (openMode: GameMode | null) => (
    <LandingScreen
      authSlot={authBar}
      openMode={openMode}
      onOpenDetail={(mode) => navigate(`/cach-choi/${MODE_SLUG[mode]}`)}
      onCloseDetail={() => navigate('/')}
      onPlay={(mode) => {
        if (mode) setSetup((current) => ({ ...current, mode }));
        navigate('/choi');
      }}
      onOpenScores={openScores}
    />
  );

  const playing =
    setup.mode === 'organic' ? (
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
    ) : (
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
    );

  return (
    <div className={`app${isLanding ? ' app--landing' : ''}`}>
      {/* Ở trang chủ thanh đăng nhập nằm trong nav, chỗ khác thì nổi góc phải. */}
      {!isLanding && runPhase !== 'playing' && authBar}

      <Routes>
        <Route path="/" element={renderLanding(null)} />
        <Route path="/cach-choi/:modeSlug" element={<ModeDetailRoute render={renderLanding} />} />

        <Route
          path="/choi"
          element={
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
              onOpenScores={openScores}
              onBack={() => navigate('/')}
            />
          }
        />

        {/* Ván chơi sống trong bộ nhớ nên chỉ chặn khi CHƯA có ván nào ('idle') —
            tức là vào thẳng URL hoặc vừa F5. Không so bằng 'playing'/'done' vì lúc
            kết thúc ván, state và điều hướng là hai cập nhật riêng: state commit
            trước sẽ khiến chốt chặn đá người chơi đi ngay giữa lúc chuyển màn. */}
        <Route
          path="/dang-choi"
          element={runPhase === 'idle' ? <Navigate to="/choi" replace /> : playing}
        />
        <Route
          path="/ket-qua"
          element={
            runPhase !== 'idle' ? (
              <GameOverScreen
                score={finalStats.score}
                compoundsMade={finalStats.compoundsMade}
                organic={organicStats}
                onRestart={() => startGame()}
                onChangeSetup={() => navigate('/choi')}
                onOpenScores={openScores}
              />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />

        <Route
          path="/bang-xep-hang"
          element={
            <ScoreBoard runs={getRuns()} signedIn={account !== null} onClose={() => navigate(-1)} />
          }
        />

        {/* Backend trả người chơi về đây sau khi Google xác nhận; effect ở trên sẽ
            đổi phiên rồi điều hướng về trang chủ. */}
        <Route path={CALLBACK_PATH} element={renderLanding(null)} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

/** Trang chủ với lớp chi tiết mở sẵn theo :modeSlug. Slug lạ thì quay về trang chủ. */
function ModeDetailRoute({ render }: { render: (mode: GameMode) => ReactElement }) {
  const { modeSlug } = useParams();
  const mode = modeFromSlug(modeSlug);
  return mode ? render(mode) : <Navigate to="/" replace />;
}
