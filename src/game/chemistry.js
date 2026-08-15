import { toSubscript } from './ions.js';

function gcd(a, b) {
  return b === 0 ? a : gcd(b, a % b);
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

  return {
    formula: catPart + anPart,
    name: `${cation.name} ${anion.name.toLowerCase()}`,
    catSub,
    anSub,
    complexity: catSub + anSub,
  };
}
