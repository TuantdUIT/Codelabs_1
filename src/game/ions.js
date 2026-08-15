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
  { id: 'Cl', symbol: 'Cl', charge: 1, name: 'Clorua', polyatomic: false, color: '#ff6b6b' },
  { id: 'Br', symbol: 'Br', charge: 1, name: 'Bromua', polyatomic: false, color: '#f4524d' },
  { id: 'I', symbol: 'I', charge: 1, name: 'Iotua', polyatomic: false, color: '#e6392f' },
  { id: 'OH', symbol: 'OH', charge: 1, name: 'Hiđroxit', polyatomic: true, color: '#ff8a5c' },
  { id: 'NO3', symbol: 'NO3', charge: 1, name: 'Nitrat', polyatomic: true, color: '#ff9f43' },
  { id: 'O', symbol: 'O', charge: 2, name: 'Oxit', polyatomic: false, color: '#ee7c2f' },
  { id: 'S', symbol: 'S', charge: 2, name: 'Sunfua', polyatomic: false, color: '#d96b2b' },
  { id: 'SO4', symbol: 'SO4', charge: 2, name: 'Sunfat', polyatomic: true, color: '#c85a28' },
  { id: 'CO3', symbol: 'CO3', charge: 2, name: 'Cacbonat', polyatomic: true, color: '#b04a22' },
  { id: 'SO3', symbol: 'SO3', charge: 2, name: 'Sunfit', polyatomic: true, color: '#983e1d' },
  { id: 'PO4', symbol: 'PO4', charge: 3, name: 'Photphat', polyatomic: true, color: '#f4c430' },
];

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
