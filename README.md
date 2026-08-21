# Vatia

**Un pasto onesto in 60 secondi.** — Inserisci il profilo, scegli gli
alimenti che ti piacciono per ciascun pasto, ottieni i grammi. Nessun
account, nessun tracking, nessuna promessa magica.

Live demo: https://nicoloproietti.github.io/Vatia-dietengine/ (GitHub
Pages, deploy automatico via `.github/workflows/deploy-pages.yml` a
ogni push su `main`). Prima volta: **Settings → Pages → Source: GitHub
Actions** e rilancia il workflow.

In locale:

```bash
npm install
cd apps/web && cp .env.example .env && npm run dev
```

---

## Il problema che risolve

I tool di calcolo dieta sul mercato hanno due modalità sgradevoli:

1. **La scatola nera "AI".** Ti generano un piano che non capisci; non
   sai su quale formula si basa il fabbisogno, non sai perché ha scelto
   la quinoa invece del riso, e comunque devi creare un account per
   provarlo.
2. **Il calcolatore anni 2000.** Ti sputa fuori kcal e macro in una
   tabella brutta, ma quando devi trasformarli in un piatto reale ("ok,
   ma quanti grammi di pollo con il riso?") ti lascia in secca.

Vatia sta nel mezzo: espone la formula (Mifflin-St Jeor, nel codice), ti
lascia scegliere gli alimenti, e ti restituisce grammi calcolati con un
motore deterministico. Zero magia, tutto verificabile.

## Cosa NON è

Questo è **un pezzo di portfolio**, non il gestionale completo del
progetto Vatia originale (che gestisce pazienti, fatturazione,
calendario, Tessera Sanitaria). Qui non troverai:

- gestione pazienti / login / consenso GDPR strutturato,
- generazione automatica dell'intero piano settimanale via LLM,
- fatture, integrazione con Sistema TS, calendario appuntamenti,
- tracking, analytics, cookie di terze parti.

Se ti interessa vedere quelle feature, sono descritte in
[`docs/roadmap.md`](docs/roadmap.md) — non implementate qui, e la
sezione spiega _perché_.

## Architettura

```
vatia/
├─ packages/diet-engine/     # libreria TS pura, zero dip da UI o rete
│  ├─ src/calculations.ts    # Mifflin-St Jeor BMR/TDEE, meal split
│  ├─ src/allocation.ts      # solver sequenziale grammi per ruolo
│  └─ src/validation.ts      # report tolleranze macro
├─ apps/web/                 # React 19 + Vite + TS
│  ├─ src/pages/             # Landing, Profile, MealBuilder, PlanResult
│  ├─ src/lib/foods.ts       # PostgREST → tipi engine
│  ├─ src/lib/csv.ts         # profile ↔ CSV (nessun account = file è il "salvataggio")
│  └─ src/lib/pdf.ts         # print-to-PDF nativo del browser (nessun jsPDF)
├─ supabase/
│  ├─ migrations/            # 5 migration versionate
│  └─ functions/substitute-food/   # Deno edge fn con rate-limit + fallback
└─ packages/diet-engine/data/foods_full.csv   # 900 alimenti CREA (seed)
```

### Decisioni tecniche

- **Motore in libreria separata (`@vatia/diet-engine`).** Zero dip da
  React. Test unitari senza mock. Se domani il frontend cambia stack
  (Svelte, Solid, CLI) il motore non tocca. 18 test in
  `packages/diet-engine/tests/`.
- **Dati alimentari via Postgres, non JSON statico.** Il DB CREA ha
  ~900 alimenti; imbullettati come JSON nel bundle sarebbero 200KB in
  più a carico dell'utente su ogni caricamento. Postgres + PostgREST
  serve solo le righe usate.
- **RLS attivata anche sui dati pubblici.** `foods` è pubblicamente
  leggibile ma la policy è esplicita; le scritture restano bloccate.
  `ai_substitution_cache` / `ai_rate_limit` hanno RLS on senza policy:
  solo `service_role` (le Edge Function) ci parla — così `anon` non può
  falsare il contatore rate-limit dal client.
- **AI dietro Edge Function, mai chiamata dal client.** La chiave Groq
  vive solo in un env var di Supabase. Il client vede un endpoint
  `substitute-food` che parla JSON. Rate limit a 10 richieste/giorno
  globali; oltre soglia serve un fallback SQL (alimento più simile per
  distanza euclidea sui macro, stessa `macro_category`).
- **Nessun jsPDF nel bundle.** Il "PDF" è una pagina HTML print-ready:
  il browser fa il resto con "Save as PDF". Risparmio ~100KB gzipped.
- **Nessun i18n framework.** `i18n/messages.ts` è due dizionari IT/EN
  con hook `useLocale()`. Bundle finale: **134KB gzip** (React + router
  + Supabase JS + tutto il resto).

### Diagramma

```
┌─────────────────────────────────────────────────────────────┐
│  Browser                                                     │
│  ┌────────────────────┐    ┌──────────────────┐             │
│  │ apps/web (React)   │───►│ @vatia/diet-     │  (in-proc)  │
│  │ Profile • Meal •   │    │  engine          │             │
│  │ Plan               │    │ (kcal, allocate) │             │
│  └────────┬───────────┘    └──────────────────┘             │
│           │                                                  │
│           │ PostgREST                                        │
│           │ + RPC food_seasonality                           │
│           ▼                                                  │
│  ┌──────────────────────────────────────────────┐           │
│  │  Supabase (lwkkmgjaeidjzfnmkiib, eu-west-3)  │           │
│  │  foods · seasonal_families · ai_* (RLS on)   │           │
│  │  RPCs: food_seasonality · ai_rate_limit_bump │           │
│  └───────────┬──────────────────────────────────┘           │
│              │ service_role (bypasses RLS)                   │
│              ▼                                               │
│  ┌────────────────────────────────────┐                     │
│  │  Edge Function `substitute-food`   │────► Groq API       │
│  │  (Deno) — cache · rate-limit · fb  │      (LLM)          │
│  └────────────────────────────────────┘                     │
└─────────────────────────────────────────────────────────────┘
```

## Il patto (manifesto)

Dichiarato in landing page, riprodotto qui integralmente:

> Vatia calcola il fabbisogno con la formula di Mifflin-St Jeor — puoi
> vederla nel codice. Non salviamo nulla su un server: il tuo profilo è
> un file `.csv` che scarichi e ricarichi quando vuoi. Non promettiamo
> dimagrimenti rapidi. La velocità sana è ~0,5 kg a settimana.
>
> Cosa non facciamo:
> - Nessun tracking, nessun cookie di terze parti.
> - Nessun account, nessun dato personale salvato lato server.
> - Nessuna scatola nera: le formule sono esposte.
> - Nessuna promessa di dimagrimenti miracolosi.

## SQL scelte (le più interessanti)

### `food_seasonality(food_id, month)` — fuzzy join stagionalità

Il DB tiene una tabella `seasonal_families` (~50 famiglie: `pomodoro`,
`carciofi`, `mele`, …) con `int[] seasonal_months`. La funzione risolve
i badge per un alimento a runtime, senza denormalizzare in `foods`:

```sql
select f.* into v_family
from public.seasonal_families f
where v_food.name ilike '%' || f.family_name || '%'
   or similarity(lower(v_food.name), lower(f.family_name)) > 0.35
order by
  case when v_food.name ilike '%' || f.family_name || '%' then 0 else 1 end,
  similarity(lower(v_food.name), lower(f.family_name)) desc
limit 1;
```

- `ILIKE` cattura il match diretto (`"Pomodoro San Marzano"` → famiglia
  `"pomodoro"`).
- Il `pg_trgm` fuzzy fa da fallback per plurali/aggettivi
  (`"pomodori ciliegini"` → `"pomodoro"`), con soglia 0.35 rilassata
  volutamente.
- Il `case … order by` mette prima i match esatti, poi ordina i fuzzy
  per similarità.

C'è anche uno scan sui **toponimi italiani** (`di Tropea`, `Piacentino`,
`IGP`, …) che marca automaticamente `is_local = true` anche se la
famiglia non fa match. Idea: un `Peperoncino di Calabria` è km0 anche se
non l'abbiamo classificato altrove.

### `ai_rate_limit_bump(day, limit)` — atomicità del contatore

Due invocazioni concorrenti della Edge Function non devono poter passare
entrambe la soglia. Insert-with-conflict-do-update-returning risolve in
una sola istruzione:

```sql
insert into public.ai_rate_limit as r (day, request_count, updated_at)
values (p_day, 1, now())
on conflict (day) do update
  set request_count = r.request_count + 1
returning r.request_count into v_count;

return query select v_count, v_count <= p_limit;
```

Marcata `SECURITY DEFINER` per non dover concedere grant diretti
sulla tabella al ruolo delle Edge Function.

## Setup DB (Supabase)

Le migration sono in `supabase/migrations/*.sql` (schema in git, non
generate da CLI). Applicabili col Supabase CLI:

```bash
supabase link --project-ref lwkkmgjaeidjzfnmkiib
supabase db push
```

Il seed dei 900 alimenti è in `packages/diet-engine/data/foods_full.csv`
— importalo dal **Table Editor → foods → Insert → Import CSV** (usa
`service_role`, bypassa RLS).

## Test

```bash
npm --workspaces --if-present run test        # 18 test motore
npm --workspaces --if-present run typecheck   # tsc noEmit su tutto
```

## Roadmap (le feature del gestionale completo)

Vedi [`docs/roadmap.md`](docs/roadmap.md).

## Licenza

MIT.
