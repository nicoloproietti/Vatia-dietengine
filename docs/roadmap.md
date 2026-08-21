# Roadmap — feature del gestionale che NON sono qui

Il progetto Vatia originale (SaaS per nutrizionisti) contiene molto più
di quello che questo repo demo. La lista sotto elenca le feature esistenti
lato gestionale e spiega perché in questo pezzo di portfolio sono state
deliberatamente tenute fuori.

## Gestione pazienti
- Registrazione + login (Supabase Auth) con ruoli nutrizionista/paziente.
- CRUD pazienti con anamnesi (jsonb), metriche personalizzate, contatto
  d'emergenza, note fiscali, opposizione TS.
- **Perché non qui:** il portfolio deve poter essere aperto da un
  recruiter e usato in 60 secondi, senza signup. Anche un account "di
  prova" è attrito.

## Calendario appuntamenti
- Slot booking pubblico via `booking_settings` (slug, visit_types,
  min_notice), `booking_requests` con auto-confirm opzionale.
- Sincronizzazione bidirezionale con Google Calendar (OAuth refresh
  token in `google_calendar_connections`).
- **Perché non qui:** richiede OAuth Google + gestione slot server-side +
  notifiche push. Nulla di questo dimostra qualcosa che il calcolo dei
  grammi non dimostri già meglio.

## Fatturazione elettronica IT
- `billing_settings` con regime fiscale, IVA, marca da bollo.
- `invoices` + `invoice_items` con snapshot professionista + paziente,
  numerazione anno/progressivo, stato pagamento.
- Export accountant (`accountant_exports`), integrazione Sistema TS
  con opposizione paziente.
- **Perché non qui:** codice-domain molto italiano-specifico che sarebbe
  illegibile a chiunque non abbia lavorato con la normativa TS. Non
  aggiunge segnale al portfolio.

## Generazione automatica del piano settimanale
- Cron/edge fn che prende profilo + preferenze e produce 21 pasti (7g × 3)
  tutti in una botta.
- **Perché non qui:** contraddice il patto. La UX di Vatia portfolio è
  "tu scegli l'alimento, io calcolo i grammi" — deliberata, per non
  fingere che l'AI sappia cosa ti va di mangiare oggi.

## Notifiche push web
- `push_subscriptions` (VAPID), `nutritionist_notifications` con code.
- **Perché non qui:** la demo non ha stato che valga la pena notificare.

## Cosa il portfolio SÌ mostra rispetto al gestionale
- Separazione motore/UI (`packages/diet-engine` è la stessa idea che nel
  gestionale vive dentro un service layer).
- Schema Postgres con RLS/policy documentate.
- Edge Function con rate-limit + cache + fallback deterministico.
- SQL non banale (fuzzy match + toponimi per stagionalità).
- Design onesto sulla privacy (nessun account, CSV come "salvataggio").
