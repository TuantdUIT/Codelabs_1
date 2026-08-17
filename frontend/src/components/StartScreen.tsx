import { useMemo, useState } from 'react';
import IonSelect from './IonSelect';
import MusicSelect from './MusicSelect';
import {
  ANIONS,
  CATIONS,
  MAX_IONS,
  MIN_IONS,
  buildAnions,
  buildCations,
  pickSubset,
} from '../feature/in-organic/ions';
import { possibleCompounds } from '../feature/in-organic/chemistry';
import { DIFFICULTIES } from '../feature/organic/organic-engine';
import type { GameMode, GameSetup } from '../feature/setup';

/** Công thức mẫu chỉ để trưng bày trên thẻ chọn chế độ, không ảnh hưởng luật chơi. */
const MODES: { id: GameMode; icon: string; label: string; note: string; samples: string[] }[] = [
  {
    id: 'inorganic',
    icon: '🧪',
    label: 'Vô cơ',
    note: 'Ghép cation và anion thành hợp chất cân bằng điện tích, tự chọn bộ ion trước mỗi ván.',
    samples: ['NaCl', 'Ca(OH)₂', 'Al₂(SO₄)₃', 'MgCl₂'],
  },
  {
    id: 'organic',
    icon: '🧬',
    label: 'Hữu cơ',
    note: 'Ghép gốc CH₃ để dựng đúng đồng phân ankan, luyện tư duy mạch carbon.',
    samples: ['CH₄', 'C₂H₆', 'C₃H₈', 'iso-C₄H₁₀'],
  },
];

interface StartScreenProps {
  setup: GameSetup;
  music: {
    trackId: string;
    volume: number;
    previewing: boolean;
    onChange: (trackId: string) => void;
    onVolume: (volume: number) => void;
    onPreview: () => void;
  };
  onStart: (config: GameSetup) => void;
  onBack: () => void;
  onOpenScores: () => void;
}

export default function StartScreen({ setup, music, onStart, onOpenScores, onBack }: StartScreenProps) {
  const [mode, setMode] = useState<GameMode>(setup.mode);
  const [difficultyId, setDifficultyId] = useState(setup.difficultyId);
  const [cationIds, setCationIds] = useState(setup.cationIds);
  const [anionIds, setAnionIds] = useState(setup.anionIds);

  const cations = useMemo(() => buildCations(cationIds), [cationIds]);
  const anions = useMemo(() => buildAnions(anionIds), [anionIds]);
  const compounds = useMemo(() => possibleCompounds(cations, anions), [cations, anions]);
  const colorOfCation = (id: string) => cations.find((ion) => ion.id === id)?.color ?? 'transparent';
  const colorOfAnion = (id: string) => anions.find((ion) => ion.id === id)?.color ?? 'transparent';

  const randomize = () => {
    setCationIds(pickSubset(CATIONS, MIN_IONS + 1).map((ion) => ion.id));
    setAnionIds(pickSubset(ANIONS, MIN_IONS + 1).map((ion) => ion.id));
  };

  return (
    <div className="screen screen--wide">
      <div className="hero">
        <span className="hero__badge">🧪 Game giáo dục hóa học</span>
        <h1 className="hero__title">
          Che <span className="hero__title-accent">Games</span>
        </h1>
        <p className="hero__quote">
          “Để vận dụng cao trở thành nơi phân hóa điểm số, không phải sự bất cẩn của việc sai ngu.”
        </p>
        <p className="screen__subtitle">
          {mode === 'organic'
            ? 'Ghép các gốc CH₃ để dựng lại mọi đồng phân của một ankan'
            : 'Bắn tự do, ghép các ion thành hợp chất vô cơ đúng công thức'}
        </p>
      </div>

      <div className="mode-cards">
        {MODES.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`mode-card mode-card--${item.id}${mode === item.id ? ' is-active' : ''}`}
            onClick={() => setMode(item.id)}
            aria-pressed={mode === item.id}
          >
            <span className="mode-card__icon">{item.icon}</span>
            <span className="mode-card__head">
              <b>{item.label}</b>
              <span className="mode-card__state">{mode === item.id ? 'Đang chọn' : 'Chọn'}</span>
            </span>
            <em className="mode-card__note">{item.note}</em>
            <span className="mode-card__samples">
              {item.samples.map((formula) => (
                <span key={formula} className="formula-pill">
                  {formula}
                </span>
              ))}
            </span>
          </button>
        ))}
      </div>

      <div className="setup">
        {mode === 'organic' ? (
          <>
            <div className="setup__head">
              <h2>Chọn độ khó</h2>
            </div>
            <div className="difficulty-list">
              {DIFFICULTIES.map((level) => (
                <label key={level.id} className={`difficulty${difficultyId === level.id ? ' is-active' : ''}`}>
                  <input
                    type="radio"
                    name="organic-difficulty"
                    checked={difficultyId === level.id}
                    onChange={() => setDifficultyId(level.id)}
                  />
                  <span className="difficulty__label">{level.label}</span>
                  <span className="difficulty__time">{level.seconds}s / đồng phân</span>
                  <span className="difficulty__note">{level.note}</span>
                </label>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="setup__head">
              <h2>Chọn bộ ion cho ván chơi</h2>
              <button type="button" className="btn btn--ghost" onClick={randomize}>
                🎲 Ngẫu nhiên
              </button>
            </div>
            <div className="setup__selects">
              <IonSelect
                label="Cation (+)"
                hint="Kim loại & amoni NH₄⁺"
                pool={CATIONS}
                selected={cationIds}
                colorOf={colorOfCation}
                onChange={setCationIds}
                min={MIN_IONS}
                max={MAX_IONS}
                type="cation"
              />
              <IonSelect
                label="Anion (−)"
                hint="Gốc axit, hiđroxit OH⁻, oxit O²⁻"
                pool={ANIONS}
                selected={anionIds}
                colorOf={colorOfAnion}
                onChange={setAnionIds}
                min={MIN_IONS}
                max={MAX_IONS}
                type="anion"
              />
            </div>
            <div className="setup__preview">
              <span className="setup__preview-title">
                {compounds.length} hợp chất vô cơ có thể tự do tổng hợp trong ván này
              </span>
              {compounds.length < 4 && (
                <span className="setup__warn">
                  ⚠️ Có ít công thức để ghép. Thử thêm anion hóa trị I (Cl⁻, NO₃⁻, OH⁻) hoặc cation hóa trị I–II.
                </span>
              )}
              <div className="setup__preview-list">
                {compounds.map((compound) => (
                  <span
                    key={compound.formula}
                    className={`preview-pill tag--${compound.type}`}
                    title={`${compound.typeLabel}: ${compound.name}`}
                  >
                    {compound.formula}
                  </span>
                ))}
              </div>
            </div>
          </>
        )}

        <div className="setup__music">
          <MusicSelect
            trackId={music.trackId}
            volume={music.volume}
            previewing={music.previewing}
            onChange={music.onChange}
            onVolume={music.onVolume}
            onPreview={music.onPreview}
          />
        </div>

      </div>

      <div className="screen__rules">
        <h2>Luật chơi</h2>
        {mode === 'organic' ? (
          <ul>
            <li>
              Đề bài nằm bên phải: một ankan <strong>CₙH₂ₙ₊₂</strong>. Bên trái là kho gốc <strong>CH₃</strong> để bạn
              ghép.
            </li>
            <li>
              Bấm ô trống cạnh mạch để nối thêm một gốc CH₃; bấm vào CH₃ ở đầu mạch để gỡ ra. Bấm ô trống rời khỏi mạch
              hoặc ô tạo mạch vòng đều bị từ chối.
            </li>
            <li>
              Nhãn tự đổi theo số liên kết: <strong>2 CH₃ nối chung → CH₂</strong>, <strong>3 → CH</strong>,{' '}
              <strong>4 → C</strong>. Cacbon không nhận liên kết thứ 5 nên không thể có 5 gốc CH₃ bao quanh.
            </li>
            <li>
              Dùng hết số cacbon là hệ chấm ngay. Đúng một đồng phân <strong>chưa từng dựng</strong> thì được điểm và{' '}
              <strong>đồng hồ chạy lại từ đầu</strong>; trùng đồng phân cũ thì không bị phạt, cứ sửa tiếp.
            </li>
            <li>Hết giờ là thua. Dựng đủ toàn bộ đồng phân là thắng.</li>
          </ul>
        ) : (
          <ul>
            <li>Mỗi bong bóng trên lưới là một ion trong bộ bạn vừa chọn.</li>
            <li>
              Không có công thức mục tiêu hay băng chuyền: bạn được <strong>bắn tự do</strong> để tạo bất kỳ hợp chất vô
              cơ hợp lệ nào.
            </li>
            <li>
              Đặt ion thành cụm liền kề có tỉ lệ cân bằng điện tích — ví dụ <strong>CaCl₂ = 1 Ca²⁺ + 2 Cl⁻</strong> —
              cụm sẽ tự nổ và ghi điểm.
            </li>
            <li>Bóng mất điểm tựa với trần sẽ rơi xuống, cho thêm điểm thưởng.</li>
            <li>
              Bắn hụt 10 phát hoặc hết giờ sẽ làm lưới <strong>tụt thêm một hàng</strong>. Lưới chạm vạch đỏ là thua.
            </li>
          </ul>
        )}
      </div>

      <div className="screen__actions">
        <button className="btn btn--primary" onClick={() => onStart({ mode, difficultyId, cationIds, anionIds })}>
          Bắt đầu chơi
        </button>
        <button className="btn btn--ghost" onClick={onOpenScores}>
          🏆 Bảng xếp hạng
        </button>
        <button className="btn btn--ghost" onClick={onBack}>
          ← Trang chủ
        </button>
      </div>
    </div>
  );
}
