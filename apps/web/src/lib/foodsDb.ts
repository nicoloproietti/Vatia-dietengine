import type { Food, FoodRole } from '@vatia/diet-engine';
import foodsJson from '../data/foods.json';

interface FoodRecord {
  id: string;
  name: string;
  category: string | null;
  macro_category: string | null;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

const RECORDS = foodsJson as FoodRecord[];

/**
 * Chiave di ricerca: minuscole e senza accenti, così "però" e "pero"
 * trovano le stesse cose e la ricerca non dipende da come si digita.
 */
function normalize(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

const INDEX = RECORDS.map((r) => normalize(r.name));

function toFood(r: FoodRecord): Food {
  return {
    id: r.id,
    name: r.name,
    kcal_per_100g: r.kcal,
    protein_per_100g: r.protein,
    carbs_per_100g: r.carbs,
    fat_per_100g: r.fat,
    ...(r.category ? { category: r.category } : {}),
    ...(r.macro_category ? { macro_category: r.macro_category } : {}),
  };
}

/** Parole troppo corte o di servizio: non restringono la ricerca. */
const STOPWORDS = new Set(['di', 'da', 'de', 'e', 'al', 'la', 'il', 'lo', 'in', 'con', 'a']);

/**
 * Cerca per parole, non per sottostringa: devono esserci tutte, in
 * qualsiasi ordine. Nel database gli alimenti si chiamano "Pollo,
 * petto, senza pelle", quindi chi digita "petto di pollo" deve
 * comunque trovarlo. I nomi che iniziano con la prima parola vengono
 * per primi: chi scrive "pol" cerca il pollo, non la polenta di
 * contorno a qualcos'altro.
 */
export function searchFoods(term: string, limit = 30): Food[] {
  const q = normalize(term.trim());
  if (q.length < 2) return [];

  const words = q.split(/\s+/).filter((w) => w.length > 0);
  const tokens = words.filter((w) => !STOPWORDS.has(w));
  if (tokens.length === 0) return [];

  const starts: FoodRecord[] = [];
  const contains: FoodRecord[] = [];

  for (let i = 0; i < RECORDS.length; i++) {
    const name = INDEX[i]!;
    if (!tokens.every((tk) => name.includes(tk))) continue;
    (name.startsWith(tokens[0]!) ? starts : contains).push(RECORDS[i]!);
  }

  return [...starts, ...contains].slice(0, limit).map(toFood);
}

const MACRO_BY_ROLE: Record<Exclude<FoodRole, 'veg'>, string> = {
  protein: 'protein_source',
  carb: 'carb_source',
  fat: 'fat_source',
};
const VEG_CATEGORIES = ['verdura', 'ortaggi', 'ortaggi_frutti'];

export function foodsForRole(role: FoodRole): Food[] {
  const match = role === 'veg'
    ? (r: FoodRecord) => r.category != null && VEG_CATEGORIES.includes(r.category)
    : (r: FoodRecord) => r.macro_category === MACRO_BY_ROLE[role];
  return RECORDS.filter(match).map(toFood);
}

/**
 * Candidati alla sostituzione: stessa categoria, ordinati per
 * vicinanza sul profilo intero (kcal, proteine, carbo, grassi), non
 * solo sulle calorie — altrimenti "petto di pollo" si ritrova la
 * mortadella come primo suggerimento perché ha le stesse kcal/100g,
 * ignorando che una è magra e l'altra no.
 */
export function similarFoods(food: Food, limit = 8): Food[] {
  if (!food.category) return [];
  const dist = (r: FoodRecord) => {
    const dk = (r.kcal - food.kcal_per_100g) / 4;         // normalizzato: 4 kcal ≈ 1 g
    const dp = r.protein - food.protein_per_100g;
    const dc = r.carbs - food.carbs_per_100g;
    const df = (r.fat - food.fat_per_100g) * 2.25;        // 9 kcal/g contro 4: stesso peso in kcal
    return dk * dk + dp * dp + dc * dc + df * df;
  };
  return RECORDS
    .filter((r) => r.category === food.category && r.id !== food.id)
    .sort((a, b) => dist(a) - dist(b))
    .slice(0, limit)
    .map(toFood);
}

export const FOOD_COUNT = RECORDS.length;
