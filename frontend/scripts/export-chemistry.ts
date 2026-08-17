// Xuất dữ liệu hoá học từ code TypeScript ra `shared/chemistry.json` để backend
// seed vào DB. Luật hoá học chỉ được định nghĩa MỘT nơi (ions.ts / chemistry.ts /
// organic.ts); Python chỉ đọc lại kết quả, không gõ lại công thức.
//
// Chạy: npm run export:chemistry

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { ANIONS, CATIONS } from '../src/feature/in-organic/ions';
import { possibleCompounds } from '../src/feature/in-organic/chemistry';
import { alkaneFormula, enumerateAlkanes } from '../src/feature/organic/organic';

/** Số cacbon cần liệt kê đồng phân. DIFFICULTIES hiện dùng 4–7, dư ra cho chắc. */
const CARBON_RANGE = { min: 1, max: 9 };

const ions = [
  ...CATIONS.map((ion) => ({ ...ion, type: 'cation' as const })),
  ...ANIONS.map((ion) => ({ ...ion, type: 'anion' as const })),
].map((ion) => ({
  id: ion.id,
  type: ion.type,
  symbol: ion.symbol,
  charge: ion.charge,
  name: ion.name,
  polyatomic: ion.polyatomic,
  acid_name: ion.acidName ?? null,
}));

const compounds = possibleCompounds(CATIONS, ANIONS).map((compound) => ({
  cation_id: compound.cation.id,
  anion_id: compound.anion.id,
  formula: compound.formula,
  name: compound.name,
  type: compound.type,
  cat_sub: compound.catSub,
  an_sub: compound.anSub,
  total: compound.total,
}));

const isomers = [];
for (let carbons = CARBON_RANGE.min; carbons <= CARBON_RANGE.max; carbons++) {
  for (const isomer of enumerateAlkanes(carbons)) {
    isomers.push({
      canonical_key: isomer.key,
      carbons,
      formula: alkaneFormula(carbons),
      iupac_name: isomer.name,
    });
  }
}

const payload = {
  generated_at: new Date().toISOString(),
  source: 'frontend/src/feature — sinh bằng npm run export:chemistry, đừng sửa tay',
  ions,
  compounds,
  isomers,
};

// Tính từ cwd (npm run chạy ở frontend/) chứ không từ vị trí file: script được
// bundle ra node_modules/.cache nên đường dẫn tương đối theo file sẽ sai.
const out = resolve(process.cwd(), '../shared/chemistry.json');
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, `${JSON.stringify(payload, null, 2)}\n`, 'utf-8');

console.log(`${out}: ${ions.length} ion, ${compounds.length} hợp chất, ${isomers.length} đồng phân`);
