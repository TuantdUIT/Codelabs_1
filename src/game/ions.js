// Ion database: cations (+) and anions (-) with their real charge magnitude.
// "charge" is always a positive magnitude; sign is implied by `type`.

const SUB_DIGITS = { 0: '₀', 1: '₁', 2: '₂', 3: '₃', 4: '₄', 5: '₅', 6: '₆', 7: '₇', 8: '₈', 9: '₉' };
const SUP_CHARS = { 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹', '+': '⁺', '-': '⁻' };

export function toSubscript(str) {
  return String(str).replace(/\d/g, (d) => SUB_DIGITS[d]);
}

export function toSuperscript(str) {
  return String(str)
    .split('')
    .map((c) => SUP_CHARS[c] ?? c)
    .join('');
}

// Ion label with proper sub/superscript, e.g. "SO4" charge 2 anion -> "SO₄²⁻"
export function ionLabel(ion, type) {
  const base = toSubscript(ion.symbol);
  const chargeStr = ion.charge === 1 ? '' : String(ion.charge);
  const sign = type === 'cation' ? '+' : '-';
  return base + toSuperscript(chargeStr + sign);
}

export const CATIONS = [
  { id: 'Na', symbol: 'Na', charge: 1, name: 'Natri', polyatomic: false, color: '#4f9cff' },
  { id: 'K', symbol: 'K', charge: 1, name: 'Kali', polyatomic: false, color: '#3d7fe0' },
  { id: 'H', symbol: 'H', charge: 1, name: 'Hiđro', polyatomic: false, color: '#6fb3ff' },
  { id: 'Ag', symbol: 'Ag', charge: 1, name: 'Bạc', polyatomic: false, color: '#8ec4ff' },
  { id: 'NH4', symbol: 'NH4', charge: 1, name: 'Amoni', polyatomic: true, color: '#59c2ff' },
  { id: 'Ca', symbol: 'Ca', charge: 2, name: 'Canxi', polyatomic: false, color: '#2e86de' },
  { id: 'Mg', symbol: 'Mg', charge: 2, name: 'Magie', polyatomic: false, color: '#2470c4' },
  { id: 'Ba', symbol: 'Ba', charge: 2, name: 'Bari', polyatomic: false, color: '#1c5aa6' },
  { id: 'Zn', symbol: 'Zn', charge: 2, name: 'Kẽm', polyatomic: false, color: '#1a4f91' },
  { id: 'Cu', symbol: 'Cu', charge: 2, name: 'Đồng(II)', polyatomic: false, color: '#154480' },
  { id: 'Fe2', symbol: 'Fe', charge: 2, name: 'Sắt(II)', polyatomic: false, color: '#123a6e' },
  { id: 'Al', symbol: 'Al', charge: 3, name: 'Nhôm', polyatomic: false, color: '#0d2f5c' },
  { id: 'Fe3', symbol: 'Fe', charge: 3, name: 'Sắt(III)', polyatomic: false, color: '#0a2649' },
];

export const ANIONS = [
  { id: 'Cl', symbol: 'Cl', charge: 1, name: 'Clorua', acidName: 'Axit clohiđric', polyatomic: false, color: '#ff6b6b' },
  { id: 'Br', symbol: 'Br', charge: 1, name: 'Bromua', acidName: 'Axit bromhiđric', polyatomic: false, color: '#f4524d' },
  { id: 'NO3', symbol: 'NO3', charge: 1, name: 'Nitrat', acidName: 'Axit nitric', polyatomic: true, color: '#ff9f43' },
  { id: 'OH', symbol: 'OH', charge: 1, name: 'Hiđroxit', acidName: null, polyatomic: true, color: '#ff8a5c' },
  { id: 'O', symbol: 'O', charge: 2, name: 'Oxit', acidName: null, polyatomic: false, color: '#ee7c2f' },
  { id: 'S', symbol: 'S', charge: 2, name: 'Sunfua', acidName: 'Axit sunfuhiđric', polyatomic: false, color: '#d96b2b' },
  { id: 'SO4', symbol: 'SO4', charge: 2, name: 'Sunfat', acidName: 'Axit sunfuric', polyatomic: true, color: '#c85a28' },
  { id: 'CO3', symbol: 'CO3', charge: 2, name: 'Cacbonat', acidName: 'Axit cacbonic', polyatomic: true, color: '#b04a22' },
  { id: 'SO3', symbol: 'SO3', charge: 2, name: 'Sunfit', acidName: 'Axit sunfurơ', polyatomic: true, color: '#983e1d' },
  { id: 'PO4', symbol: 'PO4', charge: 3, name: 'Photphat', acidName: 'Axit photphoric', polyatomic: true, color: '#f4c430' },
];

// Distinct bubble colors assigned per run so the active ions never look alike.
// Cations get cool hues, anions warm hues.
export const CATION_COLORS = ['#4f9cff', '#21c7b8', '#9d6bff', '#3ddc84', '#7ee1ff', '#c3ccdd'];
export const ANION_COLORS = ['#ff5a5a', '#ff9f1c', '#ffd93d', '#ff5fbf', '#c98a5b', '#a3324a'];

// Người chơi tự chọn bộ ion trước khi vào ván: ít ion → ít tổ hợp → dễ hơn.
export const MIN_IONS = 3;
export const MAX_IONS = Math.min(CATION_COLORS.length, ANION_COLORS.length);
export const DEFAULT_CATION_IDS = ['Na', 'Ca', 'Al'];
export const DEFAULT_ANION_IDS = ['Cl', 'SO4', 'OH'];

// Gán màu theo thứ tự đã chọn — dùng chung cho engine lẫn màn hình chọn ion để
// màu hiển thị ở hai nơi luôn khớp nhau.
function buildIonSet(pool, ids, colors, type) {
  return pool
    .filter((ion) => ids.includes(ion.id))
    .map((ion, i) => ({ ...ion, color: colors[i % colors.length], type }));
}

export const buildCations = (ids) => buildIonSet(CATIONS, ids, CATION_COLORS, 'cation');
export const buildAnions = (ids) => buildIonSet(ANIONS, ids, ANION_COLORS, 'anion');

export function pickSubset(pool, count, rng = Math.random) {
  const byCharge = {};
  for (const ion of pool) {
    (byCharge[ion.charge] ??= []).push(ion);
  }
  const picked = new Map();
  // guarantee at least one ion of each available charge tier first
  for (const charge of Object.keys(byCharge)) {
    const options = byCharge[charge];
    const chosen = options[Math.floor(rng() * options.length)];
    picked.set(chosen.id, chosen);
  }
  const remaining = pool.filter((ion) => !picked.has(ion.id));
  while (picked.size < count && remaining.length > 0) {
    const idx = Math.floor(rng() * remaining.length);
    const ion = remaining.splice(idx, 1)[0];
    picked.set(ion.id, ion);
  }
  return Array.from(picked.values());
}
