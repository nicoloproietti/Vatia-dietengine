# Prompt per Claude Design — Vatia

Copia tutto il testo sotto la riga e incollalo come prompt iniziale in Claude Design.

---

Progetta l'interfaccia completa di **Vatia**, un'app personale per seguire la propria
dieta. Non è un prodotto, non ha utenti da conquistare, non ha una landing da
convertire: è lo strumento di **una sola persona**, che se lo apre dal telefono tre o
quattro volte al giorno per sapere cosa deve mangiare.

Gira come PWA aggiunta alla schermata Home di un iPhone. Tutto sta sul dispositivo:
i 900 alimenti sono dentro il bundle, profilo e piano in `localStorage`. Nessun
server, nessun account, nessuna rete a runtime — funziona in aereo.

## Il criterio che decide tutto

**Deve poterla usare un bambino che deve fare la dieta.**

Non è una metafora gentile: è il vincolo di progetto. Se una schermata richiede di
capire cosa significa "distribuzione macro per pasto" prima di poter mangiare,
quella schermata ha fallito. La domanda a cui l'app risponde ogni giorno è una
sola: **cosa mangio adesso, e quanto mi resta.**

Tutto il resto — configurare le calorie, spezzare i macro fra i pasti, costruire la
settimana — è roba che si fa una volta e poi sparisce dalla vista.

## Tono

Onesto, calmo, mai gamificato. Zero emoji al posto delle icone, zero gradienti,
zero streak, badge, coriandoli o "complimenti!". Niente promesse di dimagrimento.
È più vicino a uno strumento ben fatto (un'app di note curata, un buon tool
finanziario) che a MyFitnessPal.

L'app espone la formula invece di nasconderla: BMR/TDEE con Mifflin-St Jeor sono
mostrati, ed è l'utente a decidere quante kcal mangiare e come dividere i macro. Il
design deve sostenere questa onestà — mostrare i numeri veri, anche quando dicono
che sei fuori target, senza drammatizzare e senza consolare.

## Vincoli non negoziabili

Sono decisioni già prese e verificate sul dispositivo. Non proporre alternative.

**Colore.** Due temi, un solo colore: **bianco + verde** di giorno, **nero + verde**
di notte. Tutto il resto è neutro (grigi). I quattro valori nutrizionali si
distinguono con gradazioni di verde — verde brand per le kcal, bosco per le
proteine, erba per i carboidrati, oliva per i grassi — e sono **sempre accompagnati
da un'etichetta**: il colore non è mai l'unico segnale. Fuori target si usa
l'inchiostro (nero su bianco, bianco su nero), non il rosso. Il rosso esiste solo
dove qualcosa viene cancellato.

| | Chiaro | Scuro |
|---|---|---|
| Fondo / superficie | `#FFFFFF` | `#000000` / `#0E0E10` |
| Inchiostro | `#000000` · `#4B4B50` · `#8A8A8F` | `#FFFFFF` · `#C7C7CC` · `#8A8A8F` |
| Linee | `#E2E2E6` / `#EFEFF2` | `#2C2C2E` / `#1C1C1E` |
| Accento | `#0F8A43` | `#32D74B` |
| kcal · prot · carb · grassi | `#0F8A43` · `#0A5C2E` · `#35801E` · `#6F7D08` | `#32D74B` · `#4BD9A0` · `#86D93C` · `#C4CE4A` |

**Tipografia.** Solo font di sistema: SF Pro e SF Mono sull'iPhone
(`-apple-system` / `ui-monospace`). Nessun font remoto — l'app deve partire
offline. Scala tipografica iOS: large title 34, title 22, body 17, footnote 13,
caption 12.

**Numeri.** Sempre in mono con `tabular-nums`. Migliaia separate da spazio fino
(`2 697`), virgola come separatore decimale (`10,4`), meno tipografico `−` e non il
trattino. Sono convenzioni italiane e vanno rispettate ovunque.

**Linguaggio iOS.** Liste raggruppate con angoli tondi e separatori rientrati, nav
bar traslucida con titolo centrato e indietro in accento, controlli segmentati,
bottoni pieni ad angoli morbidi, slider con pollice bianco ombreggiato. Tocco
minimo 44px. Anima poco e con `cubic-bezier(.32,.72,0,1)`.

**Niente tab bar.** È stata provata e rimossa: tre schede per tre posti di cui due
si visitano una volta a settimana rubavano spazio fisso in fondo allo schermo. La
navigazione secondaria è una lista in coda alla schermata principale.

**Niente librerie di icone.** L'unica grafica ammessa sono SVG inline minimali
(chevron, lente) e forme CSS.

## Le schermate

### 1. Oggi — la casa dell'app

È dove si apre l'app, sempre, appena esiste un profilo. Contiene, dall'alto:

- **Il numero che conta**: le kcal che restano oggi, grandi abbastanza da leggersi
  di sfuggita, con una barra di avanzamento e sotto `mangiate / target`. Se si va
  oltre il target il messaggio cambia ("Sei oltre di…") e la barra passa
  all'inchiostro.
- **I pasti del giorno**, uno per riga. Tre stati possibili, visivamente distinti:
  *non ancora preparato* (azione tenue "Preparalo · target N kcal"), *pronto da
  mangiare* (azione piena "L'ho mangiato"), *già mangiato* (la riga si fa da parte,
  in grigio, con la spunta). Il pasto di cui è il turno adesso deve risaltare.
- **Altro**: tre righe con chevron verso la settimana, la lista della spesa e i
  propri numeri.

Il totale della giornata conta **solo i pasti spuntati**: è quello mangiato
davvero, non quello pianificato.

### 2. Costruisci il pasto

Schermata a sé, a schermo intero, in due fasi.

*Fase 1 — scegli.* Barra di ricerca fra 900 alimenti, risultati in lista con
categoria e valori per 100 g. Se non trova niente, la via d'uscita è "Aggiungilo
tu", che apre un form per inserire un alimento leggendo l'etichetta (nome,
categoria, kcal, proteine, carboidrati, grassi per 100 g). Sotto, gli alimenti già
scelti.

*Fase 2 — regola.* Quattro anelli in stile Activity Rings (kcal, proteine,
carboidrati, grassi) che mostrano quanto ci si avvicina al target del pasto, con lo
scarto scritto sotto in percentuale. Per ogni alimento una riga con i grammi
modificabili: il solver li ha già calcolati, qui si aggiustano a mano.

### 3. La settimana

Il pianificatore: selettore dei sette giorni come controllo segmentato, elenco dei
pasti del giorno scelto, barre dei totali giornalieri contro il target. È la
schermata dove si costruisce, non quella dove si vive.

### 4. I tuoi numeri

Configurazione. Slider delle kcal giornaliere ancorato al TDEE, con zone di
deficit e surplus e la stima in kg/mese. Ripartizione macro in percentuali con
barra segmentata. Numero di pasti. Quanto pesa ogni pasto in percentuale di kcal.
Poi: i propri alimenti aggiunti a mano, e il backup.

**Questa schermata è troppo densa oggi e va ripensata.** La distribuzione macro per
singolo pasto si configura una volta nella vita: deve stare dietro una sezione
avanzata, non in prima pagina.

### 5. Lista della spesa

Somma dei grammi per alimento su tutta la settimana. Esportabile.

### 6. Primo avvio

Il questionario del profilo: sesso, età, peso e altezza, livello di attività. Una
domanda per schermata, con barra di avanzamento a segmenti. In fondo il fabbisogno
stimato (BMR, TDEE, kcal di mantenimento). Si vede una volta sola nella vita
dell'utente.

## Cosa manca e va progettato

Queste funzioni non esistono ancora. Progettale insieme al resto.

- **Sostituzione al volo.** "Oggi niente pollo, ho il tacchino": si cambia un
  alimento in un pasto già costruito e i grammi si ricalcolano da soli, senza
  rifare il pasto da capo. È l'attrito che fa abbandonare i piani nella vita vera.
- **Peso e verifica.** Registrare il peso ogni tanto e confrontare l'andamento
  reale con il deficit previsto dalla formula. È il ciclo di feedback onesto: se la
  formula sbaglia, deve potersi vedere.
- **Stato vuoto del primo giorno.** Cosa vede chi ha appena finito il questionario e
  non ha ancora costruito nessun pasto? Oggi è la schermata più importante e la meno
  progettata.

## Cosa NON fare

- Nessuna landing commerciale, nessun elenco di pregi, nessuna call-to-action: non
  c'è nessuno da convincere.
- Nessun onboarding a più schermate oltre al questionario.
- Nessuna notifica, nessun promemoria push, nessun assistente AI.
- Nessun account, login, profilo sociale, condivisione.
- Nessun colore oltre verde e neutri.
- Nessuna emoji.

## Cosa consegnare

1. **Sistema di design**: token colore per entrambi i temi, scala tipografica,
   raggi, ombre, spaziature, stati dei componenti.
2. **Le sei schermate** sopra, in chiaro e in scuro, a misura di iPhone (390×844),
   più le tre funzioni mancanti.
3. **Componenti riusabili** con i loro stati: riga di lista, riga-pasto nei tre
   stati, anello macro, barra target, slider kcal, controllo segmentato, chip
   categoria, campo di ricerca, form, stato vuoto.
4. **Note di comportamento** dove il disegno statico non basta: cosa succede al
   tocco, cosa si anima, cosa cambia quando si supera il target.

Ottimizza per una cosa sola: che una persona con la testa altrove, in piedi davanti
al frigo, capisca in due secondi cosa deve mangiare.
