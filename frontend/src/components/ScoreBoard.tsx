import { useEffect, useState } from 'react';
import {
  MODE_LABEL,
  PERIOD_LABEL,
  formatDate,
  formatDuration,
} from '../feature/runs/runs';
import type { LeaderboardPeriod, LeaderboardRow, RunSummary } from '../feature/runs/runs';
import type { RunsClient } from '../feature/runs/runs-client';
import type { GameMode } from '../feature/setup';

type Tab = 'board' | 'mine';

interface ScoreBoardProps {
  runs: RunsClient;
  /** Chưa đăng nhập thì tab "Ván của tôi" bị khoá. */
  signedIn: boolean;
  onClose: () => void;
}

const MODES: GameMode[] = ['inorganic', 'organic'];
const PERIODS: LeaderboardPeriod[] = ['day', 'week', 'all'];

export default function ScoreBoard({ runs, signedIn, onClose }: ScoreBoardProps) {
  const [tab, setTab] = useState<Tab>('board');
  const [mode, setMode] = useState<GameMode>('inorganic');
  const [period, setPeriod] = useState<LeaderboardPeriod>('all');
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [mine, setMine] = useState<RunSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');

    const load = tab === 'board' ? runs.leaderboard(mode, period) : runs.myRuns();
    load
      .then((data) => {
        if (cancelled) return;
        if (tab === 'board') setRows(data as LeaderboardRow[]);
        else setMine(data as RunSummary[]);
      })
      .catch((cause: Error) => {
        if (!cancelled) setError(cause.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [tab, mode, period, runs]);

  return (
    <div className="screen screen--wide">
      <h1>🏆 Kết quả</h1>

      <div className="mode-tabs">
        <button
          type="button"
          className={`mode-tab${tab === 'board' ? ' is-active' : ''}`}
          onClick={() => setTab('board')}
        >
          <b>Bảng xếp hạng</b>
          <em>Điểm cao nhất đã được xác thực</em>
        </button>
        <button
          type="button"
          className={`mode-tab${tab === 'mine' ? ' is-active' : ''}`}
          onClick={() => setTab('mine')}
          disabled={!signedIn}
          title={signedIn ? undefined : 'Đăng nhập để xem lịch sử của bạn'}
        >
          <b>Ván của tôi</b>
          <em>{signedIn ? '20 ván gần nhất' : 'Cần đăng nhập'}</em>
        </button>
      </div>

      {tab === 'board' && (
        <div className="board-filters">
          {MODES.map((item) => (
            <button
              key={item}
              type="button"
              className={`chip${mode === item ? ' is-active' : ''}`}
              onClick={() => setMode(item)}
            >
              {MODE_LABEL[item]}
            </button>
          ))}
          <span className="board-filters__sep" />
          {PERIODS.map((item) => (
            <button
              key={item}
              type="button"
              className={`chip${period === item ? ' is-active' : ''}`}
              onClick={() => setPeriod(item)}
            >
              {PERIOD_LABEL[item]}
            </button>
          ))}
        </div>
      )}

      {loading && <p className="board-empty">Đang tải…</p>}
      {!loading && error && <p className="board-empty board-empty--error">⚠️ {error}</p>}

      {!loading && !error && tab === 'board' && (
        rows.length === 0 ? (
          <p className="board-empty">
            Chưa có ai lên bảng ở mục này. Chơi một ván và ghi điểm đi!
          </p>
        ) : (
          <ol className="board">
            {rows.map((row) => (
              <li key={row.playerId} className="board__row">
                <span className={`board__rank board__rank--${Math.min(row.rank, 4)}`}>{row.rank}</span>
                {row.avatarUrl ? (
                  <img className="board__avatar" src={row.avatarUrl} alt="" referrerPolicy="no-referrer" />
                ) : (
                  <span className="board__avatar board__avatar--letter">
                    {row.displayName.trim()[0]?.toUpperCase() ?? '?'}
                  </span>
                )}
                <span className="board__name">{row.displayName}</span>
                <span className="board__meta">{row.runs} ván</span>
                <span className="board__score">{row.bestScore}</span>
              </li>
            ))}
          </ol>
        )
      )}

      {!loading && !error && tab === 'mine' && (
        mine.length === 0 ? (
          <p className="board-empty">Bạn chưa có ván nào được lưu.</p>
        ) : (
          <ul className="board">
            {mine.map((run) => (
              <li key={run.id} className="board__row">
                <span className={`tag tag--${run.mode === 'organic' ? 'oxit' : 'muoi'}`}>
                  {MODE_LABEL[run.mode]}
                </span>
                <span className="board__name">{formatDate(run.startedAt)}</span>
                <span className="board__meta">{formatDuration(run.durationMs)}</span>
                <span
                  className="board__verify"
                  title={
                    run.scoreVerified
                      ? 'Điểm đã được server tính lại và khớp'
                      : 'Điểm không khớp khi server tính lại — ván này không lên bảng xếp hạng'
                  }
                >
                  {run.scoreVerified ? '✅' : '⚠️'}
                </span>
                <span className="board__score">{run.score}</span>
              </li>
            ))}
          </ul>
        )
      )}

      <div className="screen__actions">
        <button className="btn btn--primary" onClick={onClose}>
          Quay lại
        </button>
      </div>
    </div>
  );
}
