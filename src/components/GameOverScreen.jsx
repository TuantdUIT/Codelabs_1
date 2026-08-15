export default function GameOverScreen({ score, compoundsMade, onRestart }) {
  return (
    <div className="screen">
      <h1>💥 Kết thúc</h1>
      <p className="screen__subtitle">Bạn đã tổng hợp {compoundsMade} hợp chất</p>
      <div className="screen__score">{score} điểm</div>
      <button className="btn btn--primary" onClick={onRestart}>
        Chơi lại
      </button>
    </div>
  );
}
