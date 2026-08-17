import type { ReactNode } from 'react';
import type { GameMode } from '../feature/setup';

interface LandingScreenProps {
  /** Vào thẳng màn cấu hình ván. Truyền mode để chọn sẵn chế độ. */
  onPlay: (mode?: GameMode) => void;
  onOpenScores: () => void;
  /** Chế độ đang mở lớp chi tiết — lấy từ URL /cach-choi/:slug, không giữ state riêng. */
  openMode: GameMode | null;
  onOpenDetail: (mode: GameMode) => void;
  onCloseDetail: () => void;
  /** Thanh đăng nhập, đặt ngay trong nav thay vì nổi ở góc màn hình. */
  authSlot?: ReactNode;
}

/** Bong bóng ion trôi lơ lửng ở hero. Toạ độ tính theo % của khung. */
const ORBIT = [
  { label: 'Na⁺', top: '8%', left: '12%', size: 76, hue: '59,130,246', anim: 'floatA', dur: '6s' },
  { label: 'Cl⁻', top: '52%', left: '2%', size: 60, hue: '168,85,247', anim: 'floatB', dur: '7s' },
  { label: 'Ca²⁺', top: '2%', left: '58%', size: 84, hue: '236,72,153', anim: 'floatC', dur: '8s' },
  { label: 'OH⁻', top: '62%', left: '52%', size: 58, hue: '59,130,246', anim: 'floatB', dur: '6.5s' },
  { label: 'Al³⁺', top: '30%', left: '78%', size: 70, hue: '34,197,94', anim: 'floatA', dur: '7.5s' },
  { label: 'SO₄²⁻', top: '80%', left: '24%', size: 66, hue: '168,85,247', anim: 'floatB', dur: '9s' },
  { label: 'Mg²⁺', top: '18%', left: '34%', size: 50, hue: '59,130,246', anim: 'floatA', dur: '5.5s' },
];

const FEATURES = [
  {
    icon: '🎮',
    title: 'Học mà chơi',
    note: 'Ôn hóa học như đang chơi game bắn bong bóng, không còn cảm giác học vẹt công thức.',
  },
  {
    icon: '🎯',
    title: 'Tự chọn bộ ion',
    note: 'Chọn đúng bộ ion cần luyện trước mỗi ván, tập trung vào phần kiến thức đang yếu.',
  },
  {
    icon: '🎵',
    title: 'Nhạc nền tùy chỉnh',
    note: 'Chọn track, chỉnh âm lượng theo ý thích — tăng tập trung hoặc thư giãn khi luyện tập.',
  },
];

interface ModeDetail {
  id: GameMode;
  icon: string;
  label: string;
  tagline: string;
  headline: string;
  intro: string;
  steps: string[];
  lose: string;
  scoring: string;
  samples: string[];
}

// Luật ở đây phải khớp với engine thật: in-organic/engine.ts và organic/organic-engine.ts
const MODE_DETAILS: ModeDetail[] = [
  {
    id: 'inorganic',
    icon: '🧪',
    label: 'Vô cơ',
    tagline: 'Ghép cation và anion thành hợp chất cân bằng điện tích, tự chọn bộ ion trước mỗi ván.',
    headline: 'Bắn ion, ghép hợp chất cân bằng điện tích',
    intro:
      'Mỗi viên đạn là một ion. Bắn để ghép cụm cation–anion đúng tỉ lệ điện tích thành hợp chất hợp lệ — cụm sẽ tự nổ và cộng điểm ngay lập tức. Tự chọn bộ ion trước ván để luyện đúng phần đang học: muối, bazơ, axit hay oxit.',
    steps: [
      'Chọn bộ ion muốn luyện, ngắm và bắn viên ion vào lưới bong bóng phía trên.',
      'Các ion liền kề tạo thành cụm — khi tỉ lệ cation:anion cân bằng đúng điện tích (Na⁺ + Cl⁻, Ca²⁺ + 2 OH⁻), cụm tự nổ và ghi điểm.',
      'Bóng mất điểm tựa với trần sẽ rơi tự do xuống dưới và được cộng thêm điểm thưởng.',
    ],
    lose: 'Bắn hụt 10 phát hoặc hết giờ một lượt khiến lưới tụt xuống một hàng. Lưới chạm vạch đỏ phía dưới màn hình là thua cuộc.',
    scoring:
      'Mỗi hợp chất 25 điểm, cộng 15 cho mỗi ô vượt quá 2, cộng 10 cho mỗi bóng rơi kèm. Dọn sạch lưới được thưởng 100.',
    samples: ['NaCl', 'CaCl₂', 'Al₂(SO₄)₃', 'Fe₂(SO₄)₃', 'Mg(OH)₂', 'KOH', 'Na₂SO₄', 'K₃PO₄'],
  },
  {
    id: 'organic',
    icon: '🧬',
    label: 'Hữu cơ',
    tagline: 'Ghép gốc CH₃ để dựng đúng đồng phân ankan, luyện tư duy mạch carbon.',
    headline: 'Ghép gốc CH₃, dựng đủ mọi đồng phân ankan',
    intro:
      'Đề bài là một ankan CₙH₂ₙ₊₂. Bàn chơi là lưới vuông nên mỗi ô có đúng 4 ô kề — khớp luôn với hóa trị IV của cacbon. Nhiệm vụ là dựng lại toàn bộ đồng phân của ankan đó, mỗi đồng phân chỉ tính điểm một lần.',
    steps: [
      'Bấm ô trống cạnh mạch để nối thêm một gốc CH₃; bấm vào CH₃ ở đầu mạch để gỡ ra. Ô rời khỏi mạch hoặc tạo mạch vòng đều bị từ chối.',
      'Nhãn tự đổi theo số liên kết: 2 gốc nối chung thành CH₂, 3 thành CH, 4 thành C. Cacbon không nhận liên kết thứ năm.',
      'Dùng hết số cacbon là hệ chấm ngay. Đúng một đồng phân chưa từng dựng thì được điểm và đồng hồ chạy lại từ đầu; trùng đồng phân cũ thì không bị phạt, cứ sửa tiếp.',
    ],
    lose: 'Hết giờ là thua — không có lưới tụt như chế độ vô cơ. Dựng đủ toàn bộ đồng phân của đề bài là thắng.',
    scoring:
      'Mỗi đồng phân đúng được 100 điểm, cộng thưởng thời gian tối đa 200 tính theo phần thời gian còn lại. Giải càng nhanh thưởng càng cao.',
    samples: ['CH₄', 'C₂H₆', 'n-C₄H₁₀', 'iso-C₄H₁₀', 'n-C₅H₁₂', 'iso-C₅H₁₂', 'neo-C₅H₁₂'],
  },
];

export default function LandingScreen({
  onPlay,
  onOpenScores,
  openMode,
  onOpenDetail,
  onCloseDetail,
  authSlot,
}: LandingScreenProps) {
  const detail = MODE_DETAILS.find((item) => item.id === openMode) ?? null;

  return (
    <div className="landing">
      <header className="landing__nav">
        <span className="landing__brand">⚗️ Che Games</span>
        <span className="landing__nav-actions">
          {authSlot}
          <button type="button" className="btn btn--ghost" onClick={onOpenScores}>
            🏆 Bảng xếp hạng
          </button>
          <button type="button" className="btn btn--primary btn--pill" onClick={() => onPlay()}>
            Chơi ngay →
          </button>
        </span>
      </header>

      <section className="landing__hero">
        <div className="landing__hero-text">
          <span className="hero__badge">🧪 Game giáo dục hóa học</span>
          <h1 className="hero__title">
            Che <span className="hero__title-accent">Games</span>
          </h1>
          <p className="hero__quote">
            “Để vận dụng cao trở thành nơi phân hóa điểm số, không phải sự bất cẩn của việc sai ngu.”
          </p>
          <p className="landing__lead">Khiến hóa học dễ như việc phá đảo game, tại sao không?</p>
          <button type="button" className="btn btn--primary btn--lg" onClick={() => onPlay()}>
            🚀 Bắt đầu chơi
          </button>
        </div>

        <div className="landing__orbit" aria-hidden="true">
          {ORBIT.map((bubble) => (
            <span
              key={bubble.label}
              className="orbit-bubble"
              style={{
                top: bubble.top,
                left: bubble.left,
                width: bubble.size,
                height: bubble.size,
                background: `rgba(${bubble.hue}, 0.14)`,
                borderColor: `rgba(${bubble.hue}, 0.4)`,
                boxShadow: `0 0 26px rgba(${bubble.hue}, 0.35)`,
                animationName: bubble.anim,
                animationDuration: bubble.dur,
              }}
            >
              {bubble.label}
            </span>
          ))}
        </div>
      </section>

      <section className="landing__section">
        <h2 className="landing__section-title">Chọn chế độ luyện tập</h2>
        <p className="landing__section-note">
          Hai mảng kiến thức, một cách học — bắn cho vui, ghép cho đúng.
        </p>
        <div className="mode-cards">
          {MODE_DETAILS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`mode-card mode-card--${item.id}`}
              onClick={() => onOpenDetail(item.id)}
            >
              <span className="mode-card__icon">{item.icon}</span>
              <span className="mode-card__head">
                <b>{item.label}</b>
                <span className="mode-card__state">Xem cách chơi →</span>
              </span>
              <em className="mode-card__note">{item.tagline}</em>
              <span className="mode-card__samples">
                {item.samples.slice(0, 4).map((formula) => (
                  <span key={formula} className="formula-pill">
                    {formula}
                  </span>
                ))}
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className="landing__section">
        <h2 className="landing__section-title">Vì sao học bằng Che Games</h2>
        <div className="feature-grid">
          {FEATURES.map((item) => (
            <div key={item.title} className="feature-card">
              <span className="feature-card__icon">{item.icon}</span>
              <h3>{item.title}</h3>
              <p>{item.note}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="landing__section landing__section--cta">
        <div className="cta-panel">
          <h2>Sẵn sàng thử thách phản xạ hóa học?</h2>
          <p>
            Chỉ mất một phút để mở màn — bắn ion, ghép công thức, phá kỷ lục điểm số của chính mình.
          </p>
          <button type="button" className="btn btn--primary btn--lg" onClick={() => onPlay()}>
            🚀 Bắt đầu chơi ngay
          </button>
        </div>
      </section>

      <footer className="landing__footer">
        ⚗️ Che Games — Dự án học tập / Codelab hóa học.
      </footer>

      {detail && (
        <div
          className={`landing__modal landing__modal--${detail.id}`}
          role="dialog"
          aria-modal="true"
          aria-label={`Chế độ ${detail.label}`}
        >
          <div className="landing__modal-inner">
            <button
              type="button"
              className="landing__modal-close"
              onClick={onCloseDetail}
              aria-label="Đóng"
            >
              ✕
            </button>

            <span className="hero__badge hero__badge--mode">
              {detail.icon} Chế độ {detail.label}
            </span>
            <h2 className="landing__modal-title">{detail.headline}</h2>
            <p className="landing__modal-intro">{detail.intro}</p>

            <h3 className="landing__modal-heading">Cách chơi</h3>
            <ol className="how-list">
              {detail.steps.map((step, index) => (
                <li key={step} className="how-list__item">
                  <span className="how-list__num">{index + 1}</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>

            <div className="rule-grid">
              <div className="rule-box rule-box--lose">
                <span className="rule-box__icon">⚠️</span>
                <h4>Khi nào thua</h4>
                <p>{detail.lose}</p>
              </div>
              <div className="rule-box rule-box--score">
                <span className="rule-box__icon">🏆</span>
                <h4>Tính điểm</h4>
                <p>{detail.scoring}</p>
              </div>
            </div>

            <h3 className="landing__modal-heading">
              {detail.id === 'organic' ? 'Ví dụ đồng phân sẽ gặp' : 'Ví dụ hợp chất sẽ gặp'}
            </h3>
            <div className="mode-card__samples landing__modal-samples">
              {detail.samples.map((formula) => (
                <span key={formula} className="formula-pill">
                  {formula}
                </span>
              ))}
            </div>

            <button
              type="button"
              className="btn btn--primary btn--lg"
              onClick={() => onPlay(detail.id)}
            >
              🚀 Chơi chế độ {detail.label}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
