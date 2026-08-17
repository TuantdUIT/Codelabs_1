import type { OrganicResult } from '../feature/organic/organic-engine';

interface GameOverScreenProps {
  score: number;
  compoundsMade: number;
  /** Chỉ có khi ván vừa chơi là chế độ hữu cơ. */
  organic: OrganicResult | null;
  onRestart: () => void;
  onChangeSetup: () => void;
  onOpenScores: () => void;
}

export default function GameOverScreen({
  score,
  compoundsMade,
  organic,
  onRestart,
  onChangeSetup,
  onOpenScores,
}: GameOverScreenProps) {
  const won = organic?.won;

  return (
    <div className="screen">
      <h1>{won ? '🏆 Hoàn thành!' : '💥 Kết thúc'}</h1>
      <p className="screen__subtitle">
        {organic
          ? won
            ? `Bạn đã dựng đủ ${organic.total}/${organic.total} đồng phân!`
            : `Hết giờ — bạn dựng được ${organic.found}/${organic.total} đồng phân`
          : `Bạn đã tổng hợp ${compoundsMade} hợp chất`}
      </p>
      <div className="screen__score">{score} điểm</div>
      <div className="screen__actions">
        <button className="btn btn--primary" onClick={onRestart}>
          Chơi lại
        </button>
        <button className="btn btn--ghost" onClick={onOpenScores}>
          🏆 Bảng xếp hạng
        </button>
        <button className="btn btn--ghost" onClick={onChangeSetup}>
          Đổi chế độ
        </button>
      </div>
    </div>
  );
}
