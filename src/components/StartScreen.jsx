export default function StartScreen({ onStart }) {
  return (
    <div className="screen">
      <h1>⚗️ Ion Blaster</h1>
      <p className="screen__subtitle">Bắn hạ ion để tổng hợp hợp chất vô cơ</p>
      <div className="screen__rules">
        <h2>Luật chơi</h2>
        <ul>
          <li>Bong bóng chứa <strong>cation</strong> hoặc <strong>anion</strong> trôi từ phải sang trái.</li>
          <li>Chọn ion đối nghịch loại điện tích ở bảng bên dưới, rồi bấm vào bong bóng để bắn.</li>
          <li>Bắn đúng loại và đủ số lượng theo hóa trị → hợp chất được tạo thành, <strong>cộng điểm</strong>.</li>
          <li>Bắn sai loại/ion → <strong>trừ điểm</strong>. Để bong bóng lọt qua mép trái → <strong>trừ điểm và mất mạng</strong>.</li>
          <li>Hết mạng → kết thúc trò chơi.</li>
        </ul>
      </div>
      <button className="btn btn--primary" onClick={onStart}>
        Bắt đầu chơi
      </button>
    </div>
  );
}
