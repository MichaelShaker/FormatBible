# formatterbible

Formatteert HSV-bijbelteksten tot nette alinea's. Kies boek, hoofdstuk en verzen
(of typ een verwijzing zoals `Handelingen 28:11-31`) en de tekst wordt direct
opgehaald van herzienestatenvertaling.nl en geformatteerd.

## Bijbeltekst ophalen

De HSV-website stuurt geen CORS-headers, dus de browser kan de tekst niet
rechtstreeks ophalen.

- **Lokaal (`npm run dev`)**: het verkeer loopt via de Vite-proxy `/hsv-api`
  (zie `vite.config.js`). Dit werkt zonder extra instellingen.
- **Gehost (GitHub Pages)**: er is een klein tussenstation nodig dat de tekst
  bij de HSV-site ophaalt en doorgeeft. Dat is de Cloudflare Worker in
  [`cloudflare/worker.js`](cloudflare/worker.js); zie de stappen hieronder.
  Zonder worker toont de gehoste versie een melding en kun je de tekst
  handmatig plakken.

## Online ophalen via Cloudflare (eenmalig)

Het gratis plan van Cloudflare Workers heeft geen creditcard nodig en staat
100.000 verzoeken per dag toe. Elk gekozen hoofdstuk is één verzoek, dus dat is
ruim voldoende. Boven de limiet weigert Cloudflare verzoeken tot de volgende
dag; er wordt nooit iets afgeschreven.

Er zijn twee manieren om de worker te deployen. Route A koppelt Cloudflare aan
deze repository, zodat de worker bij elke push automatisch wordt bijgewerkt.

### Route A: vanuit deze repository (aanbevolen)

De instellingen die Cloudflare voorstelt kloppen al:

| Veld | Waarde |
| --- | --- |
| Project name | `formatbible` |
| Build command | `npm run build` (mag ook leeg) |
| Deploy command | `npx wrangler deploy` |

Wrangler leest [`wrangler.jsonc`](wrangler.jsonc) in de hoofdmap; daarin staat
dat `cloudflare/worker.js` de worker is. **Dat bestand moet in GitHub staan
voordat je op Deploy klikt**, anders faalt de deploy met "Missing entry-point".

1. Commit en push `wrangler.jsonc` en `cloudflare/worker.js`.
2. Klik in Cloudflare op **Deploy**.
3. Kopieer de URL van de worker, die ziet eruit als
   `https://formatbible.jouw-naam.workers.dev`. Test hem door
   `<die URL>/teksten/handelingen/28` in je browser te openen: je ziet dan de
   HTML van Handelingen 28.
4. Ga verder bij "De app op de worker wijzen" hieronder.

### Route B: code plakken in het dashboard

1. Ga in het menu naar **Workers & Pages** en kies **Create** →
   **Create Worker** ("Start with Hello World!"). Geef de worker een naam,
   bijvoorbeeld `formatbible-proxy`, en klik op **Deploy**.
2. Klik op **Edit code**, verwijder alle voorbeeldcode en plak de volledige
   inhoud van [`cloudflare/worker.js`](cloudflare/worker.js). Klik op **Deploy**.
3. Test de URL zoals hierboven en ga verder met de volgende stap.

### De app op de worker wijzen

Open [`.env.production`](.env.production), haal de `#` weg voor
`VITE_HSV_BASE_URL` en vul jouw worker-URL in:

```sh
VITE_HSV_BASE_URL=https://formatbible.jouw-naam.workers.dev
```

Commit en push. GitHub Actions bouwt de site opnieuw en daarna haalt de online
versie de verzen zelf op.

### Wie mag de worker gebruiken

De worker accepteert alleen adressen van de vorm `/teksten/<boek>/<hoofdstuk>`;
al het andere krijgt een 404. Daarnaast staat in `ALLOWED_ORIGINS` bovenin
[`cloudflare/worker.js`](cloudflare/worker.js) welke websites hem in de browser
mogen aanroepen:

- `https://michaelshaker.github.io` — de gehoste app.
- `http://localhost` en `http://127.0.0.1` (elke poort), zodat een lokale
  productie-build blijft werken. Zet `ALLOW_LOCALHOST` op `false` om dat uit te
  zetten.

Andere websites krijgen 403. Verzoeken zonder `Origin`-header (curl, of de URL
in je adresbalk) komen er wel door; CORS bestaat alleen voor browsers en die
zetten die header zelf, dus een andere site kan zich niet voordoen als de jouwe.

Een lege `ALLOWED_ORIGINS` betekent: alle websites mogen.

---

This template should help get you started developing with Vue 3 in Vite.

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Recommended Browser Setup

- Chromium-based browsers (Chrome, Edge, Brave, etc.):
  - [Vue.js devtools](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd)
  - [Turn on Custom Object Formatter in Chrome DevTools](http://bit.ly/object-formatters)
- Firefox:
  - [Vue.js devtools](https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/)
  - [Turn on Custom Object Formatter in Firefox DevTools](https://fxdx.dev/firefox-devtools-custom-object-formatters/)

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Compile and Minify for Production

```sh
npm run build
```
