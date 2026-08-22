# Prompt per Claude Design — Vatia (redesign UI completo)

Copia tutto il testo sotto la riga e incollalo come prompt iniziale in Claude Design.

---

Progetta l'interfaccia completa di **Vatia**, un tool web gratuito per costruire il proprio piano alimentare settimanale. Non è un'app fitness da app-store: è un pezzo di portfolio tecnico che deve *anche* funzionare come strumento vero, usabile da chiunque, mostrato a un recruiter che lo apre per 60 secondi.

## Missione e tono

Vatia dichiara un patto con l'utente, letto in landing:
- **Formula esposta**: il calcolo BMR/TDEE (Mifflin-St Jeor) è mostrato, non nascosto in una black-box AI.
- **Zero server**: nessun account. Il profilo/piano vive nel browser (localStorage) e si esporta/importa come CSV — quel file *è* il salvataggio.
- **Cibo vero, italiano**: 900 alimenti reali (fonte CREA), non un database anonimo.
- **Nessuna scorciatoia**: niente promesse di dimagrimento rapido, niente "obiettivo" prescritto dal sistema — l'utente vede BMR/TDEE e decide lui quante kcal mangiare (via slider), decide lui la % di proteine/carbo/grassi.

Il tono deve sentirsi **onesto, calmo, mai gamificato-fitness-app**. Zero emoji come icone, zero gradient sparati, zero "streak" o badge da videogioco. È più vicino a uno strumento editoriale/da studio (pensa: un buon tool finanziario o un'app di note curata) che a MyFitnessPal.

## Chi lo usa

Due pubblici reali, in ordine di priorità:
1. **Recruiter/dev che valuta il portfolio**: apre la landing, guarda il flusso, magari prova a costruire un pasto. Deve capire in pochi secondi cosa fa il progetto e percepire cura nel dettaglio (tipografia, spaziatura, coerenza).
2. **Persona che si costruisce davvero una dieta**: la userà probabilmente da telefono, magari al supermercato o in cucina. Deve poter completare il task (profilo → distribuzione → 7 giorni di pasti) senza fatica cognitiva, "come se dovesse usarlo un bambino" — un passo alla volta, scelte grandi e chiare, mai più di una decisione per schermata negli step iniziali.

## Sistema visivo — vincoli non negoziabili

- **Palette ispirata a frutta e verdura**, non a un dashboard SaaS: base **carta/panna calda** (non bianco puro, non grigio freddo), inchiostro quasi-nero ma caldo (mai nero puro, mai blu-grigio). Un accento primario **verde basilico**. I quattro macronutrienti hanno ciascuno un colore vegetale distinto e coerente in tutta l'app: kcal = verde basilico, proteine = rosso pomodoro, carboidrati = arancio carota, grassi = giallo olio/limone. Questi 4 colori vanno sempre associati alla stessa etichetta, ovunque compaiano (badge, grafici, numeri, chip categoria alimento).
- **Tipografia protagonista**: sans-serif per l'interfaccia, un monospace per tutti i numeri (kcal, grammi, percentuali) allineati a destra — leggibilità da "scontrino/etichetta nutrizionale", mai numeri in proporzionale.
- **Nessuna ombra pesante, nessun radius vistoso**: superfici piatte, bordi hairline (1px), radius piccolo (2-8px). Non deve sembrare un template Bootstrap/Material generico.
- **Dark mode** con parità piena: stessa palette ma invertita, mai un blu-notte freddo — resta calda (bruno/verde scuro), mai nero-blu da editor di codice.
- Deve esistere una variante leggibile e testata per **contrasto AA** sia in light che dark, inclusi i 4 colori macro su fondo chiaro/scuro.

## Architettura dell'informazione (schermate da progettare)

Disegna l'intero percorso, nell'ordine in cui l'utente lo vive:

1. **Landing** — headline + sotto-headline, manifesto (i 4 punti del patto sopra), CTA unica "Costruisci un pasto". Deve reggere da sola come showcase per il recruiter che non va oltre.
2. **Import prompt** — prima schermata dopo la CTA: "Hai già un CSV del tuo piano?" con due scelte grandi e paritetiche (carica CSV / parti da zero). Chi ha già usato Vatia riprende da qui senza rifare l'onboarding.
3. **Profilo (wizard, un passo alla volta)** — sesso, età, peso+altezza, livello di attività. Ogni passo è una domanda enorme e una sola scelta. Barra di progresso in alto. Ultimo passo mostra BMR e TDEE calcolati (mai i macro qui — quelli si decidono dopo) con bottoni avanti/indietro sempre coerenti in posizione.
4. **Setup (configurazione giornaliera)** — in quest'ordine verticale:
   a. Slider kcal/giorno con TDEE marcato come riferimento sulla barra, zone visive per deficit/surplus, stima kg/mese.
   b. Ripartizione macro giornaliera: tre percentuali (proteine/carbo/grassi) con barra segmentata nei 3 colori macro, grammi calcolati in tempo reale, indicatore se la somma non fa 100%.
   c. Numero di pasti al giorno (selettore 2-6).
   d. Distribuzione kcal/macro per singolo pasto, in un accordion espandibile per pasto.
5. **Piano (workspace principale, dove l'utente vive)** — non deve essere un'altra pagina di wizard: è una dashboard compatta.
   - Striscia riassuntiva in cima (profilo, kcal, macro, n. pasti) con singolo bottone "Modifica" che riporta al setup.
   - Selettore dei 7 giorni della settimana, con indicatore di completamento per giorno (es. 3/4 pasti fatti).
   - Lista dei pasti del giorno selezionato: nome pasto, target vs risultato ottenuto, azioni (Costruisci/Modifica, Copia a tutta la settimana, Svuota).
   - Barre orizzontali di riepilogo giornaliero (kcal + 3 macro) rispetto al target, colorate coi 4 colori macro, che virano a un colore di allerta se si sfora oltre ~5%.
   - Il "costruire un pasto" avviene in un **pannello che scorre da destra senza abbandonare la pagina** (drawer su desktop, foglio a tutta altezza dal basso su mobile con maniglia visibile) — la settimana resta visibile/accessibile dietro.
6. **Costruzione pasto (contenuto del pannello/drawer)** — due fasi in sequenza:
   - Fase 1 "scegli": barra di ricerca alimenti (istantanea), risultati con nome + categoria (chip colorata per categoria: carne, pesce, verdura, frutta, cereali, legumi, latticini, uova, grassi — ciascuna col suo colore), lista di alimenti selezionati.
   - Fase 2 "regola quantità": per ogni alimento selezionato, i grammi calcolati automaticamente (motore di ottimizzazione) mostrati in un campo numerico modificabile, con il contributo nutrizionale del singolo alimento a fianco. In cima, 4 indicatori circolari (ring) per kcal + 3 macro che si riempiono in tempo reale mentre l'utente regola i grammi, ognuno nel proprio colore, che segnala visivamente lo sforamento oltre il target.
7. **Lista della spesa** — aggregazione di tutti gli alimenti usati nella settimana con grammi totali, exportabile.
8. **Empty state e primo utilizzo** — ogni schermata vuota (settimana non ancora iniziata, pasto non ancora costruito) deve suggerire esplicitamente la prossima azione con copy diretto, non un'icona muta.

## Requisiti di interazione trasversali

- Tutti i numeri (kcal, grammi, percentuali, età, peso) vanno digitati/mostrati come cifre allineate, mai testo a corpo variabile.
- Ogni stato "obiettivo raggiunto/superato" nei confronti target-vs-attuale deve essere leggibile SENZA affidarsi solo al colore (usa anche testo tipo "+12%" o icona).
- Touch target minimo 44×44px, spaziatura minima 8px tra elementi cliccabili adiacenti — deve reggere l'uso reale da telefono in movimento.
- Focus states da tastiera sempre visibili (mai `outline: none` senza sostituto).
- Feedback di caricamento esplicito su ogni azione che tocca la rete (ricerca alimenti, calcolo grammi).

## Cosa NON includere

- Nessun login/account, nessuna richiesta di email.
- Nessuna icona a forma di fiamma/trofeo/streak da app fitness gamificata.
- Nessuna imitazione di dashboard SaaS generiche (niente card ombreggiate stile Material Design default, niente gradienti viola-blu da startup AI).
- Nessuna promessa testuale relativa a velocità di dimagrimento.

## Deliverable atteso

Un sistema di design coerente su tutte le schermate elencate, con:
- palette completa (light + dark) con nomi token chiari,
- scala tipografica,
- componenti riutilizzabili (bottoni primari/secondari/link, input, chip categoria, ring di progresso, barra segmentata, drawer/bottom-sheet, day-selector, stepper),
- almeno i flussi 1→2→3→4→5→6 mostrati in sequenza leggibile, con la variante mobile del drawer/bottom-sheet mostrata esplicitamente.
