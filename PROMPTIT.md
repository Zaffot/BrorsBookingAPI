Vaihe 1 A - Promptin suunnittelu ja kehittäminen
Ensiksi pyysin tekoälyä auttamaan parhaan mahdollisen promptin rakentamisessa ChatGPT 5.2:ta varten. Tämä keskustelu oli seuraavana päivänä kadonnut, mutta avaan tähän alle miten lähdin projektia rakentamaan ja ohjaamaan tekoälyä kohti lopullista ratkaisua.

Aluksi en pyytänyt tekoälyä suoraan tuottamaan koodia, vaan kuvasin sille tehtävänannon ja kysyin, miten se itse lähestyisi ongelmaa. Tavoitteena oli ymmärtää, millaisia oletuksia ja ratkaisuja tekoäly tekisi ilman tarkkaa ohjausta.

Ensimmäinen promptti meni jotakuinkin näin:

Toimit minun parikoodarina projektissa. Ensinmäinen tavoite on kehittää vahva promtpi jolla chatgbt 5.2 toteuttaa tehtävästä toimivan version.

Tehtävä on toteuttaa yksinkertainen kokoushuoneiden varausrajapinta (API). 

Palvelun tulee tarjota käyttäjille seuraavat toiminnot:
● Varauksen luonti: Varaa huone tietylle aikavälille.
● Varauksen peruutus: Poista varaus.
● Varausten katselu: Listaa kaikki tietyn huoneen varaukset.


Toimintalogiikka (business rules):
● Varaukset eivät saa mennä päällekkäin (kaksi henkilöä ei voi varata samaa huonetta
samaan aikaan).
● Varaukset eivät voi sijoittua menneisyyteen.
● Aloitusajan täytyy olla ennen lopetusaikaa.


Tekniset reunaehdot:
● Toteutus tehdään käyttäen, JavaScript, node.js ja express 
● Käytetään käyttää muistinvaraista tietokantaa (in-memory database) 

kysy

AI vastaus oli suurinpiirtein:

Kysyn nyt juuri ne jutut, joilla saadaan promptista “lukittu” ja vältetään se, että AI keksii omia endpointteja tai ominaisuuksia.


Seuraavaksi kävimme keskustelua mahdollisista sudenkuopista:

- mihin kohtiin promptissa kannattaa olla erityisen tarkka
- missä kohdin tekoäly helposti lisää ylimääräisiä ominaisuuksia
- mitkä asiat on syytä lukita eksplisiittisesti (endpointit, statuskoodit, rajaukset)

Tämän jälkeen pyysin tekoälyä muodostamaan ensimmäisen version varsinaisesta toteutuspromptista. Tätä promptia ei käytetty sellaisenaan, vaan sitä alettiin iteratiivisesti hioa.

Hiominen tapahtui lisäämällä ja poistamalla vaatimuksia usean promptin kautta:

- ensin rajattiin sallittujen endpointtien määrä
- sitten täsmennettiin business-säännöt
- lopuksi lukittiin tekniset rajaukset, virhemuodot ja kielletyt ominaisuudet

Näiden iteraatioiden lopputuloksena syntyi lopullinen, tarkasti rajattu prompti, jota käytin varsinaisen koodin generoimiseen.


Vaihe 1 B - Prompti ja sen tuotos.

Toteuta yksinkertainen kokoushuoneiden varaus-API JavaScriptillä Node.js + Express -ympäristössä.

Tavoite  
Toteutuksen tulee olla selkeä, luettava ja helposti ymmärrettävä. Ei yliyrittävä eikä ylimääräisiä ominaisuuksia.

Sallitut endpointit (älä lisää muita):
- POST /bookings – Luo varaus
- GET /bookings?roomId=... – Listaa huoneen varaukset
- DELETE /bookings/:bookingId – Poista varaus bookingId:n perusteella

Business rules:
- Varaukset eivät saa mennä päällekkäin saman huoneen sisällä
- Varaukset eivät saa sijoittua menneisyyteen
- Aloitusajan täytyy olla ennen lopetusaikaa
- Back-to-back-varaukset ovat sallittuja (esim. 10–11 ja 11–12)

Tekniset rajaukset:
- Käytä Node.js + Expressiä
- Käytä express.json() (älä käytä body-parseria erikseen)
- Käytä in-memory-tallennusta (ei tietokantaa)
- Aikamuoto: ISO 8601
- Käytä vain seuraavia HTTP-statuksia:
  - 201 (luonti)
  - 200 (listaus)
  - 204 (poisto)
  - 400 (virheellinen syöte)
  - 404 (ei löydy)
  - 409 (päällekkäinen varaus)
- Palauta virheet aina muodossa:
  { "error": "selkeä virheviesti" }

Huoneet:
- Huoneet ovat ennalta määritettyjä: huone1, huone2, huone3, huone4, huone5
- Huoneiden hallintaa ei toteuteta (ei CRUDia huoneille)

Koodivaatimukset:
- Kaikki koodi yhdessä tiedostossa (index.js)
- Käytä selkeitä apufunktioita:
  - aikojen validointi
  - päällekkäisyyden tarkistus (overlap jos startA < endB && startB < endA)
- Tallenna ajat ISO 8601 -muodossa (Date.toISOString())
- Listaa varaukset aikajärjestyksessä (startTime nouseva)

Älä lisää:
- autentikointia
- frontendia
- paginationia
- uusia endpointteja
- mitään muuta ylimääräistä

Lopputulos:

- Rajapinta on testattavissa Postmanilla
- Toteutus on selkeä ja helposti arvioitava

Työkaluina käytän VS Codea, terminaalia ja Postmania.

Älä tee mitään ylimääräistä.



Tässä on toteutus **yhdessä tiedostossa (index.js)**, pelkät sallitut endpointit ja tarkat statukset/virhemuoto.

```js
// index.js
// Simple meeting room booking API (Node.js + Express)
// - In-memory storage
// - Only the required endpoints and status codes
// - ISO 8601 times stored with Date.toISOString()

const express = require("express");
const crypto = require("crypto");

const app = express();
app.use(express.json());

// Predefined rooms (no room CRUD)
const ROOMS = new Set(["huone1", "huone2", "huone3", "huone4", "huone5"]);

// In-memory storage for bookings
// Booking shape: { bookingId, roomId, startTime, endTime }
const bookings = [];

/**
 * Helper: send error in required format
 */
function sendError(res, statusCode, message) {
  return res.status(statusCode).json({ error: message });
}

/**
 * Helper: parse and validate times + business rules
 * Returns { startDate, endDate } on success, otherwise sends 400 and returns null.
 */
function validateTimes(req, res, startTime, endTime) {
  if (typeof startTime !== "string" || typeof endTime !== "string") {
    sendError(res, 400, "startTime ja endTime pitää olla ISO 8601 -merkkijonoja.");
    return null;
  }

  const startDate = new Date(startTime);
  const endDate = new Date(endTime);

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    sendError(res, 400, "Aikamuoto virheellinen. Käytä ISO 8601 -muotoa.");
    return null;
  }

  if (startDate >= endDate) {
    sendError(res, 400, "Aloitusajan täytyy olla ennen lopetusaikaa.");
    return null;
  }

  const now = new Date();
  if (startDate < now || endDate < now) {
    sendError(res, 400, "Varaus ei saa sijoittua menneisyyteen.");
    return null;
  }

  return { startDate, endDate };
}

/**
 * Helper: overlap check
 * overlap if startA < endB && startB < endA
 */
function overlaps(startA, endA, startB, endB) {
  return startA < endB && startB < endA;
}

/**
 * Helper: check if booking overlaps any existing booking in same room
 */
function hasOverlap(roomId, startDate, endDate) {
  return bookings.some((b) => {
    if (b.roomId !== roomId) return false;
    const existingStart = new Date(b.startTime);
    const existingEnd = new Date(b.endTime);
    return overlaps(startDate, endDate, existingStart, existingEnd);
  });
}

/**
 * POST /bookings - create booking
 * Body: { roomId, startTime, endTime }
 * Returns 201 + created booking JSON
 */
app.post("/bookings", (req, res) => {
  const { roomId, startTime, endTime } = req.body || {};

  if (typeof roomId !== "string" || !ROOMS.has(roomId)) {
    return sendError(res, 400, "roomId on pakollinen ja sen täytyy olla yksi: huone1..huone5.");
  }

  const validated = validateTimes(req, res, startTime, endTime);
  if (!validated) return; // validateTimes already responded with 400

  const { startDate, endDate } = validated;

  // Overlap rule (back-to-back is allowed by overlap formula)
  if (hasOverlap(roomId, startDate, endDate)) {
    return sendError(res, 409, "Päällekkäinen varaus samassa huoneessa.");
  }

  const booking = {
    bookingId: crypto.randomUUID(),
    roomId,
    startTime: startDate.toISOString(),
    endTime: endDate.toISOString(),
  };

  bookings.push(booking);
  return res.status(201).json(booking);
});

/**
 * GET /bookings?roomId=...
 * Returns 200 + list of bookings for the room sorted by startTime asc
 */
app.get("/bookings", (req, res) => {
  const roomId = req.query.roomId;

  if (typeof roomId !== "string" || !ROOMS.has(roomId)) {
    return sendError(res, 400, "Query-parametri roomId on pakollinen ja sen täytyy olla yksi: huone1..huone5.");
  }

  const roomBookings = bookings
    .filter((b) => b.roomId === roomId)
    .slice()
    .sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

  return res.status(200).json(roomBookings);
});

/**
 * DELETE /bookings/:bookingId
 * Returns 204 if deleted, 404 if not found
 */
app.delete("/bookings/:bookingId", (req, res) => {
  const { bookingId } = req.params;

  const index = bookings.findIndex((b) => b.bookingId === bookingId);
  if (index === -1) {
    return sendError(res, 404, "Varausta ei löydy annetulla bookingId:llä.");
  }

  bookings.splice(index, 1);
  return res.status(204).send();
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Booking API running on http://localhost:${PORT}`);
});
```

### Käynnistys (VS Code / terminaali)

```bash
npm init -y
npm i express
node index.js
```

### Postman/curl pikitestit

**1) Luo varaus**

```bash
curl -X POST "http://localhost:3000/bookings" ^
  -H "Content-Type: application/json" ^
  -d "{\"roomId\":\"huone1\",\"startTime\":\"2026-02-01T10:00:00Z\",\"endTime\":\"2026-02-01T11:00:00Z\"}"
```

**2) Listaa huoneen varaukset**

```bash
curl "http://localhost:3000/bookings?roomId=huone1"
```

**3) Poista varaus**

```bash
curl -X DELETE "http://localhost:3000/bookings/<bookingId>"
```

Jos haluat, liitä sun Postman-request/response (tai curl-output), niin tsekkaan nopeasti että statuskoodit ja virhemuodot osuu just oikein.




Vaihe 2 A -  Refaktoroi ja korjaa koodi.


function validateTimes(res, startTime, endTime) {
  if (typeof startTime !== "string" || typeof endTime !== "string") {
    sendError(res, 400, "startTime ja endTime pitää olla ISO 8601 -merkkijonoja.");
    return null;
  }

  const startDate = new Date(startTime);
  const endDate = new Date(endTime);

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    sendError(res, 400, "Aikamuoto virheellinen. Käytä ISO 8601 -muotoa.");
    return null;
  }

  if (startDate >= endDate) {
    sendError(res, 400, "Aloitusajan täytyy olla ennen lopetusaikaa.");
    return null;
  }

  const now = new Date();
  if (startDate < now) {
    sendError(res, 400, "Varaus ei saa sijoittua menneisyyteen.");
    return null;
  }

  return { startDate, endDate };
}


Virheilmoitus sanoo että käytä iso8601 muotoa. 
date hyväksyy muutkin muodot. tein esimerkin ajoin postmanilla: 

{
  "roomId": "huone1",
  "startTime": "05-05-2026 10:00",
  "endTime": "05-05-2026 11:00"
}

Sen tulos 201 ja 

{
    "bookingId": "dc58771b-10b3-4f51-ab5a-4ddf4b5a3d60",
    "roomId": "huone1",
    "startTime": "2026-05-05T07:00:00.000Z",
    "endTime": "2026-05-05T08:00:00.000Z"
}

Tämä on erinomainen ja täysin validi havainto 👌
Ja sä oot ihan oikeassa.

Käydään tämä rauhassa ja täsmällisesti läpi, ilman että muutetaan vielä mitään.

Mitä nyt oikeasti tapahtuu
1️⃣ Virheilmoitus vs. todellinen validointi

Virheilmoitus sanoo:

“Käytä ISO 8601 -muotoa.”

Mutta todellinen tarkistus on tämä:

const startDate = new Date(startTime);
const endDate = new Date(endTime);

if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
  ...
}


👉 Tämä EI tarkista ISO 8601 -muotoa
👉 Tämä tarkistaa vain: “saako JavaScript tästä jonkin päivämäärän”

2️⃣ Miksi "05-05-2026 10:00" menee läpi?

JavaScriptin Date-konstruktori on:

hyvin salliva

ympäristöriippuvainen

ei-standardimuotojen kanssa arvaava

Esimerkiksi tämä:

new Date("05-05-2026 10:00")


✔️ tulkitaan (monessa ympäristössä) näin:

5.5.2026 klo 10:00 paikallista aikaa

muunnetaan automaattisesti UTC:ksi

ja siksi saat:

"2026-05-05T07:00:00.000Z"


Tämä selittää myös 3 tunnin heiton (Suomen kesäaika).

3️⃣ Mikä tässä on oikea ongelma

Tässä on kaksi eri asiaa ristiriidassa:

🔴 A) API:n sopimus (spec)

“Aikamuoto: ISO 8601”

Virheilmoitus väittää vaativansa ISO 8601

🟢 B) Toteutus

Hyväksyy mitä tahansa, minkä new Date() sattuu ymmärtämään

Ei oikeasti validoi formaattia

Aikavyöhykkeet tulevat “sivuvaikutuksena”

➡️ Tämä on looginen epäjohdonmukaisuus, ei bugi ajossa mutta laatuvirhe API-tasolla.

4️⃣ Onko tämä “oikea” löydös katselmointiin?

Ehdottomasti kyllä.
Tämä osuu suoraan näihin arviointikohtiin:

✅ Logiikkavirhe (validointi ei vastaa vaatimusta)

✅ Virheenkäsittely (virheilmoitus valehtelee)

✅ API contract (asiakas voi lähettää väärää muotoa huomaamattaan)

Tämä on juuri sellainen asia, jonka hyvä backend-kehittäjä huomaa.

5️⃣ Tärkeä huomio (ja tämä on sun plussapiste)

Sä et sanonut:

“Tämä ei toimi”

Vaan:

“Tämä toimii, mutta ei niin kuin lupaa”

Se on täsmälleen oikea ajattelutapa API-katselmointiin.

Kun olet valmis, seuraavat luontevat jatkot (mutta vain jos pyydät):

pitäisikö validaatio olla tiukka ISO 8601

vai pitäisikö virheilmoitus muuttaa totuudenmukaiseksi

vai pitäisikö API hyväksyä molemmat ja dokumentoida se

Tuokaa seuraava havainto kun siltä tuntuu.



Tehtäväsi: - Korjaa aikavalidointi niin, että API hyväksyy vain ISO 8601 -muotoiset aikaleimat (esim. 2026-02-01T10:00:00Z). 
- Tee muutos mahdollisimman pienellä ja selkeällä tavalla. 
- Älä muuta endpointteja, business ruleja tai muuta sovelluksen rakennetta. 
- Säilytä nykyiset virheilmoitukset tai täsmennä niitä tarvittaessa. 
Palauta vain korjattu koodipätkä (validateTimes-funktio). Tässä on viimeisin minun muokkaama versio koodista 

// src/routes/bookings.js
// Booking routes: POST /, GET /?roomId=..., DELETE /:bookingId

const express = require("express");
const crypto = require("crypto");

const router = express.Router();

// Predefined rooms (no room CRUD)
const ROOMS = new Set(["huone1", "huone2", "huone3", "huone4", "huone5"]);

// In-memory storage for bookings
// Booking shape: { bookingId, roomId, startTime, endTime }
const bookings = [];

/**
 * Helper: send error in required format
 */
function sendError(res, statusCode, message) {
  return res.status(statusCode).json({ error: message });
}

/**
 * Helper: parse and validate times + business rules
 * Returns { startDate, endDate } on success, otherwise sends 400 and returns null.
 */
function validateTimes(res, startTime, endTime) {
  if (typeof startTime !== "string" || typeof endTime !== "string") {
    sendError(res, 400, "startTime ja endTime pitää olla ISO 8601 -merkkijonoja.");
    return null;
  }

  const startDate = new Date(startTime);
  const endDate = new Date(endTime);

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    sendError(res, 400, "Aikamuoto virheellinen. Käytä ISO 8601 -muotoa.");
    return null;
  }

  if (startDate >= endDate) {
    sendError(res, 400, "Aloitusajan täytyy olla ennen lopetusaikaa.");
    return null;
  }

  const now = new Date();
  if (startDate < now) {
    sendError(res, 400, "Varaus ei saa sijoittua menneisyyteen.");
    return null;
  }

  return { startDate, endDate };
}

/**
 * Helper: overlap check
 * overlap if startA < endB && startB < endA
 */
function overlaps(startA, endA, startB, endB) {
  return startA < endB && startB < endA;
}

/**
 * Helper: check if booking overlaps any existing booking in same room
 */
function hasOverlap(roomId, startDate, endDate) {
  return bookings.some((b) => {
    if (b.roomId !== roomId) return false;
    const existingStart = new Date(b.startTime);
    const existingEnd = new Date(b.endTime);
    return overlaps(startDate, endDate, existingStart, existingEnd);
  });
}

/**
 * POST /bookings - create booking
 * Body: { roomId, startTime, endTime }
 * Returns 201 + created booking JSON
 */
router.post("/", (req, res) => {
  const { roomId, startTime, endTime } = req.body || {};

  if (typeof roomId !== "string" || !ROOMS.has(roomId)) {
    return sendError(res, 400, "roomId on pakollinen ja sen täytyy olla yksi: huone1..huone5.");
  }

  const validated = validateTimes(res, startTime, endTime);
  if (!validated) return; // validateTimes already responded with 400

  const { startDate, endDate } = validated;

  // Overlap rule (back-to-back is allowed by overlap formula)
  if (hasOverlap(roomId, startDate, endDate)) {
    return sendError(res, 409, "Päällekkäinen varaus samassa huoneessa.");
  }

  const booking = {
    bookingId: crypto.randomUUID(),
    roomId,
    startTime: startDate.toISOString(),
    endTime: endDate.toISOString(),
  };

  bookings.push(booking);
  return res.status(201).json(booking);
});

/**
 * GET /bookings?roomId=...
 * Returns 200 + list of bookings for the room sorted by startTime asc
 */
router.get("/", (req, res) => {
  const roomId = req.query.roomId;

  if (typeof roomId !== "string" || !ROOMS.has(roomId)) {
    return sendError(res, 400, "Query-parametri roomId on pakollinen ja sen täytyy olla yksi: huone1..huone5.");
  }

  const roomBookings = bookings
    .filter((b) => b.roomId === roomId)
    .slice()
    .sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

  return res.status(200).json(roomBookings);
});

/**
 * DELETE /bookings/:bookingId
 * Returns 204 if deleted, 404 if not found
 */
router.delete("/:bookingId", (req, res) => {
  const { bookingId } = req.params;

  const index = bookings.findIndex((b) => b.bookingId === bookingId);
  if (index === -1) {
    return sendError(res, 404, "Varausta ei löydy annetulla bookingId:llä.");
  }

  bookings.splice(index, 1);
  return res.status(204).send();
});

module.exports = router;


Vastaus:
function validateTimes(res, startTime, endTime) {
  if (typeof startTime !== "string" || typeof endTime !== "string") {
    sendError(res, 400, "startTime ja endTime pitää olla ISO 8601 -merkkijonoja.");
    return null;
  }

  const startDate = new Date(startTime);
  const endDate = new Date(endTime);

  // Accept only ISO 8601 timestamps that round-trip exactly to the same string.
  // This blocks non-ISO inputs that Date() might still parse (e.g. "05-05-2026 10:00").
  if (
    Number.isNaN(startDate.getTime()) ||
    Number.isNaN(endDate.getTime()) ||
    startDate.toISOString() !== startTime ||
    endDate.toISOString() !== endTime
  ) {
    sendError(res, 400, "Aikamuoto virheellinen. Käytä ISO 8601 -muotoa.");
    return null;
  }

  if (startDate >= endDate) {
    sendError(res, 400, "Aloitusajan täytyy olla ennen lopetusaikaa.");
    return null;
  }

  const now = new Date();
  if (startDate < now) {
    sendError(res, 400, "Varaus ei saa sijoittua menneisyyteen.");
    return null;
  }

  return { startDate, endDate };
}



Vaihe 2 B - Tuloksen välikatselmus tekoälylle

Anna tästä koodista katselmus, tehtävänä on kehittää tästä ai promptatusta koodista parempi. Mitä kehityskohtia ja virheitä löydät? Olen jo korjannut jotain virheitä ja tässä on tuorein versio koodista.

// src/routes/bookings.js
// Booking routes: POST /, GET /?roomId=..., DELETE /:bookingId

const express = require("express");
const crypto = require("crypto");

const router = express.Router();

// Predefined rooms (no room CRUD)
const ROOMS = new Set(["huone1", "huone2", "huone3", "huone4", "huone5"]);

// In-memory storage for bookings
// Booking shape: { bookingId, roomId, startTime, endTime }
const bookings = [];

/**
 * Helper: send error in required format
 */
function sendError(res, statusCode, message) {
  return res.status(statusCode).json({ error: message });
}

/**
 * Helper: parse and validate times + business rules
 * Returns { startDate, endDate } on success, otherwise sends 400 and returns null.
 */
function validateTimes(res, startTime, endTime) {
  if (typeof startTime !== "string" || typeof endTime !== "string") {
    sendError(res, 400, "startTime ja endTime pitää olla ISO 8601 -merkkijonoja.");
    return null;
  }

  // Accept only:
  // - YYYY-MM-DDTHH:mm:ssZ
  // - YYYY-MM-DDTHH:mm:ss.sssZ
  const iso8601Regex =
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/;

  if (!iso8601Regex.test(startTime) || !iso8601Regex.test(endTime)) {
    sendError(res, 400, "Aikamuoto virheellinen. Käytä ISO 8601 -muotoa.");
    return null;
  }

  const startDate = new Date(startTime);
  const endDate = new Date(endTime);

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    sendError(res, 400, "Aikamuoto virheellinen. Käytä ISO 8601 -muotoa.");
    return null;
  }

  if (startDate >= endDate) {
    sendError(res, 400, "Aloitusajan täytyy olla ennen lopetusaikaa.");
    return null;
  }

  const now = new Date();
  if (startDate < now) {
    sendError(res, 400, "Varaus ei saa sijoittua menneisyyteen.");
    return null;
  }

  return { startDate, endDate };
}


/**
 * Helper: overlap check
 * overlap if startA < endB && startB < endA
 */
function overlaps(startA, endA, startB, endB) {
  return startA < endB && startB < endA;
}

/**
 * Helper: check if booking overlaps any existing booking in same room
 */
function hasOverlap(roomId, startDate, endDate) {
  return bookings.some((b) => {
    if (b.roomId !== roomId) return false;
    const existingStart = new Date(b.startTime);
    const existingEnd = new Date(b.endTime);
    return overlaps(startDate, endDate, existingStart, existingEnd);
  });
}

/**
 * POST /bookings - create booking
 * Body: { roomId, startTime, endTime }
 * Returns 201 + created booking JSON
 */
router.post("/", (req, res) => {
  const { roomId, startTime, endTime } = req.body || {};

  if (typeof roomId !== "string" || !ROOMS.has(roomId)) {
    return sendError(res, 400, "roomId on pakollinen ja sen täytyy olla yksi: huone1..huone5.");
  }

  const validated = validateTimes(res, startTime, endTime);
  if (!validated) return; // validateTimes already responded with 400

  const { startDate, endDate } = validated;

  // Overlap rule (back-to-back is allowed by overlap formula)
  if (hasOverlap(roomId, startDate, endDate)) {
    return sendError(res, 409, "Päällekkäinen varaus samassa huoneessa.");
  }

  const booking = {
    bookingId: crypto.randomUUID(),
    roomId,
    startTime: startDate.toISOString(),
    endTime: endDate.toISOString(),
  };

  bookings.push(booking);
  return res.status(201).json(booking);
});

/**
 * GET /bookings?roomId=...
 * Returns 200 + list of bookings for the room sorted by startTime asc
 */
router.get("/", (req, res) => {
  const roomId = req.query.roomId;

  if (typeof roomId !== "string" || !ROOMS.has(roomId)) {
    return sendError(res, 400, "Query-parametri roomId on pakollinen ja sen täytyy olla yksi: huone1..huone5.");
  }

  const roomBookings = bookings
    .filter((b) => b.roomId === roomId)
    .slice()
    .sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

  return res.status(200).json(roomBookings);
});

/**
 * DELETE /bookings/:bookingId
 * Returns 204 if deleted, 404 if not found
 */
router.delete("/:bookingId", (req, res) => {
  const { bookingId } = req.params;

  const index = bookings.findIndex((b) => b.bookingId === bookingId);
  if (index === -1) {
    return sendError(res, 404, "Varausta ei löydy annetulla bookingId:llä.");
  }

  bookings.splice(index, 1);
  return res.status(204).send();
});

module.exports = router;



Tämä on jo selvästi parempi kuin alkuperäinen: reitit on erotettu, validointi on tiukentunut, ja “menneisyys”-tarkistus on selkeytynyt. Seuraavassa sama tyyppinen katselmus kuin aiemmin – eli bugiriskit, kehityskohdat, refaktorointi-ideat.

---

## 1) Toiminnalliset riskit ja logiikkareunat

### 1.1 In-memory store on nyt “piilossa” route-tiedostossa (iso arkkitehtuuririski)

`const bookings = []` on nyt suoraan route-moduulissa. Tämä aiheuttaa helposti ongelmia kun:

* lisäät myöhemmin toisen routerin / testejä
* haluat nollata datan testissä
* haluat jakaa saman storagen usean moduulin kesken

➡️ **Parannus:** siirrä `ROOMS` ja `bookings` omaan `src/store/bookingsStore.js` (tai `src/data/store.js`) ja exporttaa ne.
Hyöty: testattavuus, selkeys.

### 1.2 ISO 8601 -regex on nyt tiukka… mutta ehkä *liian* tiukka

Hyvä: pakotat `Z`:n ja estät “timezone-less” tulkinnan.
Mutta regex hyväksyy vain:

* `YYYY-MM-DDTHH:mm:ssZ` tai `.sssZ`

Se **hylkää** täysin validit ISO 8601 -ajat kuten:

* `2026-01-30T10:00:00+02:00` (offset, täysin ok ISO 8601)
* `2026-01-30T10:00:00.12Z` (desimaalit eivät aina ole 3 numeroa)
* `2026-01-30T10:00:00.000000Z` (joissain systeemeissä)

➡️ **Mieti tavoite:** haluatko tehtävässä vaatia *nimenomaan UTC Z* (tosi ok), vai “ISO 8601 timezone” (Z tai offset)?

* Jos vaatimus on “UTC Z”, muuta error-teksti: **“Käytä ISO 8601 UTC -muotoa (…Z).”**
* Jos haluat sallia offsetit, laajenna regex: hyväksy myös `±HH:MM`.

> Tärkein: **viestin ja validoinnin pitää vastata toisiaan**. Nyt viesti sanoo “ISO 8601”, mutta toteutus sanoo käytännössä “ISO 8601 UTC Z”.

### 1.3 Menneisyyssääntö tarkistaa vain startTimen – hyvä, mutta määrittely puuttuu

Nyt sallitaan varaus joka alkaa “nyt heti” tai 1ms tulevaisuudessa. Se on ok, mutta joskus halutaan “vähintään nykyhetki” / “ei samaan sekuntiin” -tyyppinen tulkinta.

### 1.4 Overlap-check tekee turhaa Date-parsintaa joka POSTilla

Sama kuin aiemmin: `hasOverlap()` parsii `new Date(b.startTime)` joka kerta.
➡️ **Parannus:** tallenna myös `startMs/endMs` booking-objektiin tai tee sisäinen normalisointi:

```js
// booking: { ..., startTime, endTime, startMs, endMs }
```

Sitten overlap on pelkkää numerovertailua.

### 1.5 “ROOMS” on route-tiedostossa → duplikaatioriski

Jos server.js / app.js myös käyttää ROOMS:ia (tai tulevaisuudessa), se lähtee helposti haarautumaan.
➡️ Sama ratkaisu kuin 1.1: `src/config/rooms.js` tai `src/domain/rooms.js`.

---

## 2) Virheenkäsittely ja robustius

### 2.1 Puuttuu edelleen keskitetty virheenkäsittelijä

Route-funktiot palauttavat siististi kontrolloidut virheet, mutta odottamattomat virheet (esim. `crypto.randomUUID()` jos Node on liian vanha, tai bugi koodissa) jää Expressin defaultin varaan.

➡️ **Parannus:** lisää app-tasolle error middleware, joka palauttaa aina JSON:

* `{ error: "Internal server error" }`
* ja loggaa serverille oikean virheen

Tämä on hyvä “ammattimaisuuscommit”.

### 2.2 validateTimes on hyvä, mutta “kaksinkertainen tarkistus” löytyy

Regex + `new Date()` + `isNaN()` – regexin jälkeen `isNaN()` on käytännössä varmistus, ok mutta vähän redundant.
➡️ Ei pakko muuttaa, mutta voit tiivistää ja tehdä koodista helpommin luettavaa.

---

## 3) Rakenne ja luettavuus

### 3.1 Booking-logiikka on edelleen reitin sisällä

Route hoitaa nyt:

* validoinnin
* overlap-checkin
* bookingin luomisen
* datan tallennuksen

➡️ **Parannus:** tee `src/services/bookingService.js`:

* `createBooking({ roomId, startTime, endTime })`
* `listBookings(roomId)`
* `deleteBooking(bookingId)`

Route jää ohueksi: “ottaa inputin, kutsuu serviceä, palauttaa HTTP”.

### 3.2 “sendError” on ok – mutta kannattaa standardoida käyttö

Nyt se on jokaisessa route-tiedostossa paikallinen. Jos sinulla on muitakin reittejä, tämä kopioituu.
➡️ **Parannus:** `src/utils/http.js` tai `src/middleware/errors.js` (yksi paikka).

---

## 4) Pienet mutta hyvät “polish”-kohdat


### 4.1 GET-sorttaus: käytä `Date.parse` tai ms kenttiä

Pieni siistiminen:

```js
.sort((a,b) => Date.parse(a.startTime) - Date.parse(b.startTime))
```

tai jos lisäät `startMs`, niin `a.startMs - b.startMs`.


## Top 5 konkreettisinta parannusta tähän tiedostoon

1. **Siirrä `ROOMS` ja `bookings` store-moduuliin** (poistaa “router omistaa datan” -ongelman).
2. **Päätä ja dokumentoi ISO-linja:** joko “vain Z” (päivitä virheviesti) tai “Z/offset” (laajenna regex).
3. **Erota bookingService**: reitit ohuiksi, logiikka testattavaksi.
4. **Lisää app-tasolle error middleware** (JSON myös odottamattomille virheille).
5. **Optimoi overlap** tallentamalla ms-arvot, vähennä parsintaa.



Vaihe 2 C - Kehitystyön jatkaminen


Teen testit käyttäen Jest + supertestiä. 

Kirjoita vain yksi testitiedosto, joka testaa jokaisen endpointin oleellisimmat tapaukset:
- onnistunut pyyntö
- keskeinen virhetilanne (400 / 404 / 409)

Testien tulee olla stabiileja in-memory-tallennuksen kanssa.
Älä ehdota tai tee muutoksia itse API-koodiin.

kysy


Jep — jotta saan tehtyä **yhden Jest+supertest -testitiedoston** joka toimii sun projektissa *ilman että muutetaan API-koodia*, mun pitää tietää 3 asiaa sun nykyisestä rakenteesta:

1. **Mistä tiedostosta Express `app` on importattavissa testiin?**

   * Esim. `require("../src/app")` tai `require("../index")` tms.
   * (Supertest tarvitsee `app`:in, ei `listen()`-serveriä.)

2. **Mihin polkuun bookings-router on mountattu?**

   * Onko se `app.use("/bookings", bookingsRouter)` vai joku muu?

3. **Mikä on sun testikansion/konfigin oletus?**

   * Ajetaanko testit projektin juuresta ja käytetäänkö `jest` oletusasetuksilla (esim. `__tests__` tai `tests/`), vai onko sulla oma `jest.config.js`?

Liitä vastaukset vaikka näin:

* app-export: `...`
* mount path: `...`
* test path / jest config: `...`

Kun annat nämä, kirjoitan heti sen **yhden** testitiedoston, joka testaa jokaisen endpointin:

* success
* 400 / 404 / 409
  ja on stabiili in-memory-tallennuksen kanssa (eli nollaa tilan testien välillä ilman API-muutoksia).



app-export: require("../src/app")

mount path: "/bookings"
(app.use("/bookings", bookingsRouter))

test path / jest config:
- Testit ajetaan projektin juuresta
- Jest käytössä oletusasetuksilla
- Testitiedostot sijoitetaan __tests__/ -kansioon
- Ei erillistä jest.config.js -tiedostoa



// __tests__/bookings.test.js
const request = require("supertest");

function loadFreshApp() {
  // Reload modules so the in-memory bookings array starts empty for each test.
  jest.resetModules();
  return require("../src/app");
}

function futureISO(minutesFromNow) {
  return new Date(Date.now() + minutesFromNow * 60 * 1000).toISOString();
}

describe("Meeting room Booking API (/bookings)", () => {
  describe("POST /bookings", () => {
    test("201: creates a booking with valid payload", async () => {
      const app = loadFreshApp();

      const res = await request(app).post("/bookings").send({
        roomId: "huone1",
        startTime: futureISO(10),
        endTime: futureISO(70),
      });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("bookingId");
      expect(res.body).toMatchObject({
        roomId: "huone1",
      });
      expect(typeof res.body.startTime).toBe("string");
      expect(typeof res.body.endTime).toBe("string");
    });

    test("400: rejects invalid time format (not ISO 8601 Z)", async () => {
      const app = loadFreshApp();

      const res = await request(app).post("/bookings").send({
        roomId: "huone1",
        startTime: "05-05-2026 10:00",
        endTime: "05-05-2026 11:00",
      });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: expect.any(String) });
    });

    test("409: rejects overlapping booking in same room", async () => {
      const app = loadFreshApp();

      const start1 = futureISO(10);
      const end1 = futureISO(70);

      const start2 = futureISO(40); // overlaps with 10..70
      const end2 = futureISO(100);

      const first = await request(app).post("/bookings").send({
        roomId: "huone1",
        startTime: start1,
        endTime: end1,
      });
      expect(first.status).toBe(201);

      const second = await request(app).post("/bookings").send({
        roomId: "huone1",
        startTime: start2,
        endTime: end2,
      });

      expect(second.status).toBe(409);
      expect(second.body).toEqual({ error: expect.any(String) });
    });
  });

  describe("GET /bookings?roomId=...", () => {
    test("200: lists bookings for a room sorted by startTime asc", async () => {
      const app = loadFreshApp();

      // Create two bookings intentionally out of chronological order
      const later = await request(app).post("/bookings").send({
        roomId: "huone2",
        startTime: futureISO(60),
        endTime: futureISO(120),
      });
      expect(later.status).toBe(201);

      const earlier = await request(app).post("/bookings").send({
        roomId: "huone2",
        startTime: futureISO(10),
        endTime: futureISO(50),
      });
      expect(earlier.status).toBe(201);

      const res = await request(app).get("/bookings").query({ roomId: "huone2" });

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body).toHaveLength(2);

      const times = res.body.map((b) => b.startTime);
      expect(times[0] <= times[1]).toBe(true);

      // Ensure only the requested room is returned
      for (const b of res.body) {
        expect(b.roomId).toBe("huone2");
      }
    });

    test("400: rejects missing/invalid roomId query", async () => {
      const app = loadFreshApp();

      const res = await request(app).get("/bookings"); // no roomId

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: expect.any(String) });
    });
  });

  describe("DELETE /bookings/:bookingId", () => {
    test("204: deletes an existing booking", async () => {
      const app = loadFreshApp();

      const created = await request(app).post("/bookings").send({
        roomId: "huone3",
        startTime: futureISO(10),
        endTime: futureISO(70),
      });
      expect(created.status).toBe(201);

      const bookingId = created.body.bookingId;
      expect(typeof bookingId).toBe("string");

      const del = await request(app).delete(`/bookings/${bookingId}`);

      expect(del.status).toBe(204);
      expect(del.text).toBe("");

      // Verify it is gone: deleting again should yield 404
      const delAgain = await request(app).delete(`/bookings/${bookingId}`);
      expect(delAgain.status).toBe(404);
      expect(delAgain.body).toEqual({ error: expect.any(String) });
    });

    test("404: returns not found for unknown bookingId", async () => {
      const app = loadFreshApp();

      const res = await request(app).delete("/bookings/does-not-exist");

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ error: expect.any(String) });
    });
  });
});


Tee pieni parannus nykyiseen CLI-toteutukseen:

Ongelma:
Jos käyttäjä aloittaa "create"-komennon mutta ei haluakaan jatkaa,
hän ei pääse poistumaan syötekyselyistä (esim. startTime / endTime).

Tehtävä:
- Mahdollista keskeytys kirjoittamalla "exit", "lopeta" tai "cancel"
  missä tahansa syötekyselyssä.
- Keskeytys palaa päävalikkoon, ei sulje koko CLI:tä.
- Älä lisää uusia toimintoja tai endpointeja.
- Älä muuta API-koodia.

Palauta:
- vain päivitetty CLI-koodi
- ei selityksiä

// scripts/cli.js
// Terminal CLI for Booking API (interactive)
// Commands: create, list, delete
// - Uses fetch to call http://localhost:3000
// - Forces ISO 8601 Z input: YYYY-MM-DDTHH:mm:ssZ or YYYY-MM-DDTHH:mm:ss.sssZ
// - Prints API { error } message on failures
// - Interactive menu loop + clean exit
// - Allows canceling any prompt with: exit | lopeta | cancel (returns to main menu)

const { createInterface } = require("readline/promises");
const { stdin, stdout } = require("process");

const BASE_URL = "http://localhost:3000";
const ISO_8601_Z_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/;
const CANCEL_WORDS = new Set(["exit", "lopeta", "cancel"]);

function isValidIso8601Z(value) {
  return typeof value === "string" && ISO_8601_Z_REGEX.test(value);
}

function isCancelWord(value) {
  return CANCEL_WORDS.has(String(value).trim().toLowerCase());
}

async function readJsonSafely(res) {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

async function printApiError(res) {
  const body = await readJsonSafely(res);
  if (body && typeof body.error === "string") {
    console.error(`Error: ${body.error}`);
    return;
  }
  console.error(`Error: HTTP ${res.status}`);
}

async function promptUntil(rl, question, validator, errorMsg) {
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const answer = (await rl.question(question)).trim();
    if (isCancelWord(answer)) return null;
    if (validator(answer)) return answer;
    console.log(errorMsg);
  }
}

function printMenu() {
  console.log("\n=== Booking API CLI ===");
  console.log("1) create  - Luo varaus");
  console.log("2) list    - Listaa huoneen varaukset");
  console.log("3) delete  - Poista varaus bookingId:llä");
  console.log("4) exit    - Lopeta");
}

async function chooseMenuOption(rl) {
  const raw = (await rl.question("\nValitse (1-4) tai kirjoita create/list/delete/exit: ")).trim().toLowerCase();

  if (raw === "1" || raw === "create") return "create";
  if (raw === "2" || raw === "list") return "list";
  if (raw === "3" || raw === "delete") return "delete";
  if (raw === "4" || raw === "exit" || raw === "lopeta") return "exit";

  return "unknown";
}

async function createBooking(rl) {
  const roomId = await promptUntil(
    rl,
    'roomId (huone1..huone5) (cancel: "exit"/"lopeta"/"cancel"): ',
    (v) => ["huone1", "huone2", "huone3", "huone4", "huone5"].includes(v),
    "Virhe: roomId pitää olla yksi: huone1, huone2, huone3, huone4, huone5."
  );
  if (roomId === null) return;

  const startTime = await promptUntil(
    rl,
    'startTime (ISO 8601 Z, esim. 2026-02-01T10:00:00Z tai 2026-02-01T10:00:00.123Z) (cancel: "exit"/"lopeta"/"cancel"): ',
    isValidIso8601Z,
    "Virhe: startTime pitää olla ISO 8601 Z -muodossa (YYYY-MM-DDTHH:mm:ssZ tai YYYY-MM-DDTHH:mm:ss.sssZ)."
  );
  if (startTime === null) return;

  const endTime = await promptUntil(
    rl,
    'endTime (ISO 8601 Z, esim. 2026-02-01T11:00:00Z tai 2026-02-01T11:00:00.123Z) (cancel: "exit"/"lopeta"/"cancel"): ',
    isValidIso8601Z,
    "Virhe: endTime pitää olla ISO 8601 Z -muodossa (YYYY-MM-DDTHH:mm:ssZ tai YYYY-MM-DDTHH:mm:ss.sssZ)."
  );
  if (endTime === null) return;

  const res = await fetch(`${BASE_URL}/bookings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ roomId, startTime, endTime }),
  });

  if (!res.ok) {
    await printApiError(res);
    return;
  }

  const created = await res.json();
  console.log("\nCreated:");
  console.log(JSON.stringify(created, null, 2));
}

async function listBookings(rl) {
  const roomId = await promptUntil(
    rl,
    'roomId (huone1..huone5) (cancel: "exit"/"lopeta"/"cancel"): ',
    (v) => ["huone1", "huone2", "huone3", "huone4", "huone5"].includes(v),
    "Virhe: roomId pitää olla yksi: huone1, huone2, huone3, huone4, huone5."
  );
  if (roomId === null) return;

  const res = await fetch(`${BASE_URL}/bookings?roomId=${encodeURIComponent(roomId)}`);

  if (!res.ok) {
    await printApiError(res);
    return;
  }

  const list = await res.json();
  console.log(`\nBookings for ${roomId}:`);
  console.log(JSON.stringify(list, null, 2));
}

async function deleteBooking(rl) {
  const bookingId = await promptUntil(
    rl,
    'bookingId (cancel: "exit"/"lopeta"/"cancel"): ',
    (v) => v.length > 0,
    "Virhe: bookingId ei saa olla tyhjä."
  );
  if (bookingId === null) return;

  const res = await fetch(`${BASE_URL}/bookings/${encodeURIComponent(bookingId)}`, {
    method: "DELETE",
  });

  if (res.status === 204) {
    console.log("\nDeleted (204).");
    return;
  }

  await printApiError(res);
}

async function main() {
  const rl = createInterface({ input: stdin, output: stdout });

  try {
    let running = true;

    while (running) {
      printMenu();
      const action = await chooseMenuOption(rl);

      if (action === "create") {
        await createBooking(rl);
      } else if (action === "list") {
        await listBookings(rl);
      } else if (action === "delete") {
        await deleteBooking(rl);
      } else if (action === "exit") {
        running = false;
        console.log("\nMoikka! 👋");
      } else {
        console.log("\nTuntematon valinta. Sallitut: 1-4 tai create/list/delete/exit (tai lopeta).");
      }
    }
  } catch (err) {
    console.error("Error:", err && err.message ? err.message : String(err));
    process.exitCode = 1;
  } finally {
    rl.close();
  }
}

main();
