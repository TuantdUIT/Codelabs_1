import { toSubscript } from './ions.js';

// Một hợp chất chiếm tối đa 5 ô bong bóng — đủ cho cả Al₂(SO₄)₃, Ca₃(PO₄)₂,
// nên mọi cặp cation/anion hợp lệ đều ghép được.
export const MAX_GROUP = 5;

export const TYPE_LABEL = { axit: 'Axit', base: 'Bazơ', muoi: 'Muối', oxit: 'Oxit' };
export const TYPE_COLOR = { axit: '#ff9f1c', base: '#3ddc84', muoi: '#4f9cff', oxit: '#c98a5b' };

function gcd(a, b) {
  return b === 0 ? a : gcd(b, a % b);
}

// A few cation/anion pairs do not form a compound taught in the curriculum.
export function isValidPair(cation, anion) {
  if (cation.id === 'H' && anion.id === 'OH') return false; // "HOH" — không phải công thức
  if (cation.id === 'NH4' && anion.id === 'O') return false; // (NH₄)₂O không tồn tại
  return true;
}

// Loại hợp chất: oxit / bazơ / axit / muối
export function classify(cation, anion) {
  if (anion.id === 'O') return 'oxit';
  if (anion.id === 'OH') return 'base';
  if (cation.id === 'H') return 'axit';
  return 'muoi';
}

function compoundName(cation, anion, type) {
  switch (type) {
    case 'oxit':
      return cation.id === 'H' ? 'Nước' : `${cation.name} oxit`;
    case 'base':
      return `${cation.name} hiđroxit`;
    case 'axit':
      return anion.acidName ?? `Axit ${anion.name.toLowerCase()}`;
    default:
      return `${cation.name} ${anion.name.toLowerCase()}`;
  }
}

// Mọi hợp chất có thể xuất hiện từ bộ ion đã chọn.
export function possibleCompounds(cations, anions, maxGroup = MAX_GROUP) {
  const out = [];
  for (const cation of cations) {
    for (const anion of anions) {
      if (!isValidPair(cation, anion)) continue;
      const compound = buildCompound(cation, anion);
      if (compound.total > maxGroup) continue;
      out.push(compound);
    }
  }
  return out;
}

// Combine a cation and an anion into a real, charge-balanced inorganic formula.
// e.g. Ca2+ + Cl- -> CaCl2, Al3+ + OH- -> Al(OH)3, NH4+ + SO4^2- -> (NH4)2SO4
export function buildCompound(cation, anion) {
  const g = gcd(cation.charge, anion.charge);
  const catSub = anion.charge / g;
  const anSub = cation.charge / g;

  const catBase = toSubscript(cation.symbol);
  const anBase = toSubscript(anion.symbol);

  const catPart =
    catSub > 1 ? (cation.polyatomic ? `(${catBase})${toSubscript(catSub)}` : `${catBase}${toSubscript(catSub)}`) : catBase;
  const anPart =
    anSub > 1 ? (anion.polyatomic ? `(${anBase})${toSubscript(anSub)}` : `${anBase}${toSubscript(anSub)}`) : anBase;

  const type = classify(cation, anion);

  return {
    formula: catPart + anPart,
    name: compoundName(cation, anion, type),
    type,
    typeLabel: TYPE_LABEL[type],
    cation,
    anion,
    catSub,
    anSub,
    total: catSub + anSub,
  };
}
