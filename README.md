# BrorsBookingAPI

Yksinkertainen REST API kokoushuoneiden varaamiseen.  
Toteutettu Node.js + Express -ympäristössä käyttäen in-memory-tallennusta.

---

## Vaatimukset

- Node.js >= 18
- npm

---

## Asennus

Kloonaa projekti ja asenna riippuvuudet:

```bash
npm install
````

---

## Käynnistys

Käynnistä palvelin:

```bash
npm start
```

Palvelin käynnistyy osoitteeseen:

```
http://localhost:3000
```

---

## Testit

Aja testit:

```bash
npm test
```

Testit on toteutettu Jest + Supertest -kirjastoilla ja ne kattavat kaikki
keskeiset business-säännöt ja API-endpointit.

---

## Huoneet

API:ssa on viisi ennalta määriteltyä huonetta:

* huone1
* huone2
* huone3
* huone4
* huone5

Huoneita ei voi lisätä tai poistaa API:n kautta.

---

## API-endpointit

### POST /bookings

Luo varaus huoneelle.

Request body:

```json
{
  "roomId": "huone1",
  "startTime": "2026-02-01T10:00:00Z",
  "endTime": "2026-02-01T11:00:00Z"
}
```

Palauttaa:

* `201` onnistuneesta varauksesta
* `400` virheellisestä syötteestä tai menneisyydestä
* `409` päällekkäisestä varauksesta

---

### GET /bookings?roomId=huone1

Listaa huoneen varaukset aikajärjestyksessä.

Palauttaa:

* `200` ja listan varauksista
* `400` jos roomId puuttuu tai on virheellinen

---

### DELETE /bookings/:bookingId

Poistaa varauksen bookingId:n perusteella.

Palauttaa:

* `204` jos varaus poistettiin
* `404` jos varausta ei löydy

---

## Aikaleimat

Kaikki aikaleimat annetaan ISO 8601 -muodossa (UTC, Z):

```
YYYY-MM-DDTHH:mm:ssZ
YYYY-MM-DDTHH:mm:ss.sssZ
```

---

## Kehittäjän CLI

Projektissa on mukana vapaaehtoinen terminaalipohjainen CLI kehittäjän apuvälineeksi.

```bash
npm run cli
```

CLI kutsuu olemassa olevia API-endpointeja HTTP:n yli eikä muuta API:n toimintaa.

---

## Huomioitavaa

* Tallennus on toteutettu in-memory-muodossa (ei tietokantaa)
* Kaikki data katoaa palvelimen uudelleenkäynnistyksessä
