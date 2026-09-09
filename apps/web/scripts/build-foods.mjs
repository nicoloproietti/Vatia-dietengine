/**
 * Genera il database alimenti che viaggia dentro l'app.
 *
 * Sorgente: packages/diet-engine/data/foods_full.csv (CREA, 900 righe,
 * ~35 colonne). Qui teniamo solo i campi che servono al motore, così il
 * bundle resta piccolo e l'app funziona senza rete.
 *
 *   node apps/web/scripts/build-foods.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const SRC = resolve(here, '../../../packages/diet-engine/data/foods_full.csv');
const OUT = resolve(here, '../src/data/foods.json');

/** Parser CSV minimo: gestisce virgolette e virgole dentro i campi. */
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else quoted = false;
      } else field += ch;
      continue;
    }
    if (ch === '"') { quoted = true; continue; }
    if (ch === ',') { row.push(field); field = ''; continue; }
    if (ch === '\n') { row.push(field); rows.push(row); row = []; field = ''; continue; }
    if (ch === '\r') continue;
    field += ch;
  }
  if (field !== '' || row.length > 0) { row.push(field); rows.push(row); }
  return rows;
}

const rows = parseCsv(readFileSync(SRC, 'utf8'));
const header = rows[0];
const col = (name) => {
  const i = header.indexOf(name);
  if (i < 0) throw new Error(`Colonna mancante nel CSV: ${name}`);
  return i;
};

const iId = col('id');
const iName = col('name');
const iCategory = col('category');
const iMacro = col('macro_category');
const iKcal = col('kcal');
const iProtein = col('protein');
const iCarbs = col('carbs');
const iFat = col('fat');
const iUsable = col('usable_for_meal_generator');

const num = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const foods = rows
  .slice(1)
  .filter((r) => r.length > 1 && r[iUsable] === 'true' && r[iName])
  .map((r) => ({
    id: r[iId],
    name: r[iName],
    category: r[iCategory] || null,
    macro_category: r[iMacro] || null,
    kcal: num(r[iKcal]),
    protein: num(r[iProtein]),
    carbs: num(r[iCarbs]),
    fat: num(r[iFat]),
  }))
  .sort((a, b) => a.name.localeCompare(b.name, 'it'));

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify(foods));

const kb = (Buffer.byteLength(JSON.stringify(foods)) / 1024).toFixed(0);
console.log(`${foods.length} alimenti → ${OUT} (${kb} kB)`);
