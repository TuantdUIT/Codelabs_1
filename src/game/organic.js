// Bộ khung ankan CnH₂ₙ₊₂: mỗi phân tử là một CÂY các nguyên tử cacbon, bậc tối
// đa 4 (cacbon chỉ có 4 liên kết). Module này lo phần "toán" của mode hữu cơ:
// nhận dạng đồng phân (đẳng cấu cây), liệt kê đủ bộ đồng phân, và gọi tên IUPAC.

export const MAX_VALENCE = 4;

const STEMS = ['', 'met', 'et', 'prop', 'but', 'pent', 'hex', 'hept', 'oct', 'non', 'đec'];
const MULT = { 2: 'đi', 3: 'tri', 4: 'tetra', 5: 'penta', 6: 'hexa' };
const SUB_STEMS = { 1: 'metyl', 2: 'etyl', 3: 'propyl', 4: 'butyl' };
const SUB_DIGITS = { 0: '₀', 1: '₁', 2: '₂', 3: '₃', 4: '₄', 5: '₅', 6: '₆', 7: '₇', 8: '₈', 9: '₉' };

const sub = (n) => String(n).replace(/\d/g, (d) => SUB_DIGITS[d]);

// Công thức phân tử CnH₂ₙ₊₂
export const alkaneFormula = (n) => `C${n > 1 ? sub(n) : ''}H${sub(2 * n + 2)}`;
export const alkaneStem = (n) => `${STEMS[n]}an`;

// Nhãn hiển thị của một nguyên tử theo số liên kết: 0→CH₄, 1→CH₃, 2→CH₂, 3→CH, 4→C
export const atomLabel = (degree) => ['CH₄', 'CH₃', 'CH₂', 'CH', 'C'][Math.min(degree, MAX_VALENCE)];

// ---------------------------------------------------------------- đẳng cấu cây

// Tâm của cây: bóc dần lá cho tới khi còn 1 hoặc 2 đỉnh.
function centers(adj) {
  const n = adj.length;
  if (n <= 2) return adj.map((_, i) => i);
  const degree = adj.map((a) => a.length);
  let remaining = n;
  let leaves = [];
  for (let i = 0; i < n; i++) if (degree[i] === 1) leaves.push(i);
  while (remaining > 2) {
    remaining -= leaves.length;
    const next = [];
    for (const leaf of leaves) {
      degree[leaf] = 0;
      for (const nb of adj[leaf]) {
        if (degree[nb] <= 0) continue;
        degree[nb] -= 1;
        if (degree[nb] === 1) next.push(nb);
      }
    }
    leaves = next;
  }
  return leaves.length ? leaves : [0];
}

function canonAt(adj, root) {
  const walk = (node, parent) => {
    const kids = adj[node]
      .filter((nb) => nb !== parent)
      .map((nb) => walk(nb, node))
      .sort();
    return `(${kids.join('')})`;
  };
  return walk(root, -1);
}

// Chuỗi định danh duy nhất cho mỗi bộ khung — hai cây cùng khóa là cùng một
// đồng phân, dù người chơi vẽ xoay/lật thế nào.
export function canonicalKey(adj) {
  return centers(adj)
    .map((c) => canonAt(adj, c))
    .sort()[0];
}

export function isValidSkeleton(adj) {
  const n = adj.length;
  if (n === 0) return false;
  if (adj.some((a) => a.length > MAX_VALENCE)) return false;
  // liên thông và không có vòng: cây có đúng n-1 cạnh
  const edges = adj.reduce((s, a) => s + a.length, 0) / 2;
  if (edges !== n - 1) return false;
  const seen = new Set([0]);
  const stack = [0];
  while (stack.length) {
    const v = stack.pop();
    for (const nb of adj[v]) if (!seen.has(nb)) { seen.add(nb); stack.push(nb); }
  }
  return seen.size === n;
}

// ------------------------------------------------------------- liệt kê đồng phân

function grow(adj) {
  const out = [];
  for (let i = 0; i < adj.length; i++) {
    if (adj[i].length >= MAX_VALENCE) continue;
    const next = adj.map((a) => [...a]);
    next.push([i]);
    next[i].push(next.length - 1);
    out.push(next);
  }
  return out;
}

// Tất cả đồng phân của CnH₂ₙ₊₂ (mọc thêm từng nguyên tử rồi khử trùng lặp).
export function enumerateAlkanes(n) {
  let level = [[[]]];
  for (let size = 1; size < n; size++) {
    const seen = new Map();
    for (const tree of level) {
      for (const bigger of grow(tree)) {
        const key = canonicalKey(bigger);
        if (!seen.has(key)) seen.set(key, bigger);
      }
    }
    level = [...seen.values()];
  }
  return level
    .map((adj) => ({ key: canonicalKey(adj), adj, name: nameAlkane(adj) }))
    .sort((a, b) => a.name.localeCompare(b.name, 'vi'));
}

// ------------------------------------------------------------------ gọi tên

function pathBetween(adj, from, to) {
  const parent = new Array(adj.length).fill(-2);
  parent[from] = -1;
  const stack = [from];
  while (stack.length) {
    const v = stack.pop();
    for (const nb of adj[v]) {
      if (parent[nb] === -2) {
        parent[nb] = v;
        stack.push(nb);
      }
    }
  }
  const path = [];
  for (let v = to; v !== -1; v = parent[v]) path.push(v);
  return path.reverse();
}

// Tên nhóm thế treo ở `entry` (đi vào từ nguyên tử `from` trên mạch chính).
function branchName(adj, entry, from) {
  const nodes = [];
  const stack = [[entry, from]];
  let branchAtEntry = 0;
  while (stack.length) {
    const [v, parent] = stack.pop();
    nodes.push(v);
    for (const nb of adj[v]) {
      if (nb === parent) continue;
      if (v === entry) branchAtEntry += 1;
      stack.push([nb, v]);
    }
  }
  const size = nodes.length;
  if (size === 3 && branchAtEntry === 2) return 'isopropyl';
  if (size === 4 && branchAtEntry === 3) return 'tert-butyl';
  if (size === 4 && branchAtEntry === 2) return 'isobutyl';
  return SUB_STEMS[size] ?? `${STEMS[size]}yl`;
}

function substituentsFor(adj, chain) {
  const inChain = new Set(chain);
  const list = [];
  chain.forEach((node, index) => {
    for (const nb of adj[node]) {
      if (inChain.has(nb)) continue;
      list.push({ position: index, name: branchName(adj, nb, node) });
    }
  });
  return list;
}

// Đánh số mạch chính từ đầu cho bộ chỉ số nhỏ nhất.
function numberChain(adj, chain) {
  const subs = substituentsFor(adj, chain);
  const forward = subs.map((s) => ({ ...s, locant: s.position + 1 }));
  const backward = subs.map((s) => ({ ...s, locant: chain.length - s.position }));
  const key = (list) =>
    list
      .map((s) => s.locant)
      .sort((a, b) => a - b)
      .join(',');
  const fk = key(forward);
  const bk = key(backward);
  if (bk < fk) return backward;
  if (fk < bk) return forward;
  // hòa chỉ số: ưu tiên chữ cái đầu bảng nhận số nhỏ
  const alpha = (list) => [...list].sort((a, b) => a.locant - b.locant).map((s) => s.name).join(',');
  return alpha(backward) < alpha(forward) ? backward : forward;
}

export function nameAlkane(adj) {
  const n = adj.length;
  if (n === 1) return 'metan';

  // mạch chính = mạch dài nhất; hòa thì lấy mạch nhiều nhánh nhất
  let best = null;
  for (let a = 0; a < n; a++) {
    for (let b = a + 1; b < n; b++) {
      const chain = pathBetween(adj, a, b);
      const subs = numberChain(adj, chain);
      const locants = subs.map((s) => s.locant).sort((x, y) => x - y).join(',');
      const score = [-chain.length, -subs.length, locants];
      if (!best || cmp(score, best.score) < 0) best = { chain, subs, score };
    }
  }

  const { chain, subs } = best;
  const stem = `${STEMS[chain.length]}an`;
  if (!subs.length) return chain.length >= 4 ? `n-${stem}` : stem;

  const groups = new Map();
  for (const s of subs) {
    if (!groups.has(s.name)) groups.set(s.name, []);
    groups.get(s.name).push(s.locant);
  }
  const parts = [...groups.entries()]
    .sort((a, b) => a[0].localeCompare(b[0], 'vi'))
    .map(([name, locants]) => {
      const sorted = [...locants].sort((x, y) => x - y);
      return `${sorted.join(',')}-${sorted.length > 1 ? MULT[sorted.length] ?? '' : ''}${name}`;
    });
  return `${parts.join('-')}${stem}`;
}

function cmp(a, b) {
  for (let i = 0; i < a.length; i++) {
    if (a[i] < b[i]) return -1;
    if (a[i] > b[i]) return 1;
  }
  return 0;
}
