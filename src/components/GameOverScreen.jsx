export default function GameOverScreen({ score, compoundsMade, organic, onRestart, onChangeSetup }) {
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
        <button className="btn btn--ghost" onClick={onChangeSetup}>
          Đổi chế độ
        </button>
      </div>
    </div>
  );
}
