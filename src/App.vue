<template>
  <div class="app">
    <header class="masthead">
      <div class="shell masthead-inner">
        <p class="brand"><span class="brand-mark" aria-hidden="true">&#8224;</span> Herziene Statenvertaling</p>
        <p class="masthead-note">Tekst gereedmaken voor leesbaar gebruik</p>
      </div>
    </header>

    <main class="shell">
      <section class="hero">
        <div class="hero-lede">
          <h1>Bijbeltekst <em>doorlopend</em> maken</h1>
          <p>
            Kies een boek, hoofdstuk en versbereik, of plak ruwe tekst met
            versnummers. De verzen worden samengevoegd tot alinea’s die lezen als
            proza, klaar om te kopiëren naar liturgie, studie of leesrooster.
          </p>
        </div>

        <figure class="hero-quote">
          <blockquote>
            Uw woord is een lamp voor mijn voet en een licht op mijn pad.
          </blockquote>
          <figcaption>Psalm 119:105</figcaption>
        </figure>
      </section>

      <div class="ornament" aria-hidden="true">
        <span class="ornament-rule"></span>
        <span class="ornament-mark">+</span>
        <span class="ornament-rule"></span>
      </div>

      <section class="step" aria-labelledby="stap-1">
        <p class="label" id="stap-1">Stap 1 · Bijbelverwijzing</p>

        <div class="picker">
          <label class="field">
            <span class="field-label">Boek</span>
            <div class="select-wrap">
              <select :value="selectedBookSlug" @change="onBookChange($event.target.value)">
                <optgroup label="Oude Testament">
                  <option v-for="book in oldTestament" :key="book.slug" :value="book.slug">
                    {{ book.listName || book.name }}
                  </option>
                </optgroup>
                <optgroup label="Nieuwe Testament">
                  <option v-for="book in newTestament" :key="book.slug" :value="book.slug">
                    {{ book.listName || book.name }}
                  </option>
                </optgroup>
              </select>
            </div>
          </label>

          <label class="field">
            <span class="field-label">Hoofdstuk</span>
            <div class="select-wrap">
              <select v-model="selectedChapter">
                <option v-for="n in chapterCount" :key="n" :value="n">{{ n }}</option>
              </select>
            </div>
          </label>

          <label class="field">
            <span class="field-label">Van vers</span>
            <div class="select-wrap">
              <select v-model="fromVerse" :disabled="!verseNumbers.length">
                <option v-for="n in verseNumbers" :key="n" :value="n">{{ n }}</option>
              </select>
            </div>
          </label>

          <label class="field">
            <span class="field-label">Tot vers</span>
            <div class="select-wrap">
              <select v-model="toVerse" :disabled="!verseNumbers.length">
                <option v-for="n in toVerseOptions" :key="n" :value="n">{{ n }}</option>
              </select>
            </div>
          </label>
        </div>

        <div class="reference-row">
          <label class="field field-grow">
            <span class="field-label">Of typ een verwijzing</span>
            <input
                v-model="referenceInput"
                type="text"
                class="reference-input"
                placeholder="Bijv. Handelingen 28:11-31"
                @keydown.enter.prevent="loadBibleReference"
            />
          </label>

          <button class="btn btn-accent" :disabled="isLoading" @click="loadBibleReference">
            {{ isLoading ? 'Bezig…' : 'Haal tekst op' }}
          </button>

          <div class="stats">
            <div class="stat">
              <span class="stat-value">{{ versesCount }}</span>
              <span class="stat-label">{{ versesCount === 1 ? 'vers' : 'verzen' }}</span>
            </div>
            <div class="stat">
              <span class="stat-value">{{ paragraphsCount }}</span>
              <span class="stat-label">{{ paragraphsCount === 1 ? 'alinea' : "alinea's" }}</span>
            </div>
          </div>
        </div>

        <p v-if="!canFetch" class="message message-warning">
          Automatisch ophalen werkt hier niet. Start de dev-server
          (<span class="mono">npm run dev</span>) of stel
          <span class="mono">VITE_HSV_BASE_URL</span> in. Je kunt de tekst wel
          zelf in het linkervak plakken.
        </p>
        <p v-if="fetchError" class="message message-error">{{ fetchError }}</p>
        <p v-else-if="isLoading" class="message message-info">{{ loadingLabel }} wordt geladen…</p>
        <p v-else-if="fetchSuccess" class="message message-success">{{ fetchSuccess }}</p>
      </section>

      <section class="step step-settings" aria-labelledby="stap-2">
        <div class="settings">
          <label class="field field-narrow">
            <span class="label" id="stap-2">Stap 2 · Verzen per alinea</span>
            <input v-model.number="versesPerParagraph" type="number" min="1" max="50" />
          </label>

          <div class="field">
            <span class="label">Opmaak</span>
            <div class="toggles">
              <button
                  type="button"
                  class="toggle"
                  role="switch"
                  :aria-checked="keepVerseNumbers"
                  @click="keepVerseNumbers = !keepVerseNumbers"
              >
                Versnummers: <b>{{ keepVerseNumbers ? 'aan' : 'weg' }}</b>
              </button>

              <button
                  type="button"
                  class="toggle"
                  role="switch"
                  :aria-checked="doubleLineBreak"
                  @click="doubleLineBreak = !doubleLineBreak"
              >
                Witregel: <b>{{ doubleLineBreak ? 'aan' : 'uit' }}</b>
              </button>
            </div>
          </div>
        </div>
      </section>

      <section class="panels">
        <section class="panel">
          <div class="panel-head">
            <p class="label">Ruwe tekst</p>
            <button
                type="button"
                class="text-btn"
                :disabled="!inputText"
                @click="clearAll"
            >Wissen</button>
          </div>

          <textarea
              v-model="inputText"
              class="raw-input"
              spellcheck="false"
              placeholder="1 In het begin schiep God de hemel en de aarde.&#10;2 De aarde nu was woest en leeg…"
          />
        </section>

        <section class="panel">
          <div class="panel-head">
            <p class="label" id="stap-3">Stap 3 · Doorlopende tekst</p>
            <p class="label label-muted">
              {{ paragraphsCount }} {{ paragraphsCount === 1 ? 'alinea' : "alinea's" }}
            </p>
          </div>

          <div class="output" aria-labelledby="stap-3">
            <div class="output-top">
              <p class="output-ref">{{ outputReference }}</p>

              <button
                  type="button"
                  class="copy-btn"
                  :class="{ 'is-done': copyState === 'done', 'is-error': copyState === 'error' }"
                  :disabled="!outputText"
                  :title="copyTitle"
                  :aria-label="copyTitle"
                  @click="copyOutput"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path v-if="copyState === 'done'" d="m5 12.5 4.5 4.5L19 7" />
                  <template v-else>
                    <rect x="9" y="9" width="11" height="11" rx="2" />
                    <path d="M5 15V5a2 2 0 0 1 2-2h10" />
                  </template>
                </svg>
                <span class="copy-btn-text">{{ copyButtonText }}</span>
              </button>
            </div>

            <p
                v-for="(paragraph, index) in outputParagraphs"
                :key="index"
                class="output-paragraph"
            >{{ paragraph }}</p>
            <p v-if="!outputParagraphs.length" class="output-empty">
              De doorlopende tekst verschijnt hier.
            </p>
          </div>
        </section>
      </section>

      <section class="notes">
        <div class="note">
          <p class="label">01 — Verwijzing</p>
          <p>Leest boek, hoofdstuk en versbereik en haalt precies dat bereik op.</p>
        </div>
        <div class="note">
          <p class="label">02 — Versnummers</p>
          <p>Haalt de nummers weg, of laat ze staan wanneer je ze nodig hebt.</p>
        </div>
        <div class="note">
          <p class="label">03 — Alinea’s</p>
          <p>Voegt verzen samen tot blokken van het aantal dat jij kiest.</p>
        </div>
        <div class="note">
          <p class="label">04 — Kopiëren</p>
          <p>De schone tekst staat direct klaar voor liturgie of studie.</p>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'

/*
 * Boeken zoals de HSV-website ze in de URL gebruikt (/teksten/<slug>/<hoofdstuk>).
 * Slugs en hoofdstukaantallen zijn geverifieerd tegen herzienestatenvertaling.nl.
 * `aliases` zijn extra schrijfwijzen/afkortingen voor het tekstveld; daarnaast
 * werkt elke unieke afkorting (zoals "Deut" of "Openb") automatisch.
 */
const OLD_TESTAMENT = [
  { slug: 'genesis', name: 'Genesis', chapters: 50 },
  { slug: 'exodus', name: 'Exodus', chapters: 40 },
  { slug: 'leviticus', name: 'Leviticus', chapters: 27 },
  { slug: 'numeri', name: 'Numeri', chapters: 36 },
  { slug: 'deuteronomium', name: 'Deuteronomium', chapters: 34, aliases: ['dt'] },
  { slug: 'jozua', name: 'Jozua', chapters: 24 },
  { slug: 'richteren', name: 'Richteren', chapters: 21, aliases: ['rechters'] },
  { slug: 'ruth', name: 'Ruth', chapters: 4 },
  { slug: '1 samuel', name: '1 Samuel', chapters: 31 },
  { slug: '2 samuel', name: '2 Samuel', chapters: 24 },
  { slug: '1 koningen', name: '1 Koningen', chapters: 22 },
  { slug: '2 koningen', name: '2 Koningen', chapters: 25 },
  { slug: '1 kronieken', name: '1 Kronieken', chapters: 29 },
  { slug: '2 kronieken', name: '2 Kronieken', chapters: 36 },
  { slug: 'ezra', name: 'Ezra', chapters: 10 },
  { slug: 'nehemia', name: 'Nehemia', chapters: 13 },
  { slug: 'esther', name: 'Esther', chapters: 10, aliases: ['ester'] },
  { slug: 'job', name: 'Job', chapters: 42 },
  { slug: 'psalm', name: 'Psalm', listName: 'Psalmen', chapters: 150, aliases: ['psalmen', 'ps'] },
  { slug: 'spreuken', name: 'Spreuken', chapters: 31 },
  { slug: 'prediker', name: 'Prediker', chapters: 12 },
  { slug: 'hooglied', name: 'Hooglied', chapters: 8, aliases: ['hl'] },
  { slug: 'jesaja', name: 'Jesaja', chapters: 66 },
  { slug: 'jeremia', name: 'Jeremia', chapters: 52 },
  { slug: 'klaagliederen', name: 'Klaagliederen', chapters: 5, aliases: ['klaagl'] },
  { slug: 'ezechiël', name: 'Ezechiël', chapters: 48, aliases: ['ez', 'ezech'] },
  { slug: 'daniël', name: 'Daniël', chapters: 12 },
  { slug: 'hosea', name: 'Hosea', chapters: 14 },
  { slug: 'joël', name: 'Joël', chapters: 3 },
  { slug: 'amos', name: 'Amos', chapters: 9 },
  { slug: 'obadja', name: 'Obadja', chapters: 1 },
  { slug: 'jona', name: 'Jona', chapters: 4 },
  { slug: 'micha', name: 'Micha', chapters: 7 },
  { slug: 'nahum', name: 'Nahum', chapters: 3 },
  { slug: 'habakuk', name: 'Habakuk', chapters: 3 },
  { slug: 'zefanja', name: 'Zefanja', chapters: 3, aliases: ['sefanja'] },
  { slug: 'haggaï', name: 'Haggaï', chapters: 2 },
  { slug: 'zacharia', name: 'Zacharia', chapters: 14 },
  { slug: 'maleachi', name: 'Maleachi', chapters: 4 },
]

const NEW_TESTAMENT = [
  { slug: 'mattheüs', name: 'Mattheüs', chapters: 28, aliases: ['matteus', 'mt'] },
  { slug: 'markus', name: 'Markus', chapters: 16, aliases: ['marcus', 'mk'] },
  { slug: 'lukas', name: 'Lukas', chapters: 24, aliases: ['lucas', 'lk'] },
  { slug: 'johannes', name: 'Johannes', chapters: 21 },
  { slug: 'handelingen', name: 'Handelingen', chapters: 28 },
  { slug: 'romeinen', name: 'Romeinen', chapters: 16 },
  { slug: '1 korinthe', name: '1 Korinthe', chapters: 16, aliases: ['1 korinthiers', '1 korintiers'] },
  { slug: '2 korinthe', name: '2 Korinthe', chapters: 13, aliases: ['2 korinthiers', '2 korintiers'] },
  { slug: 'galaten', name: 'Galaten', chapters: 6 },
  { slug: 'efeze', name: 'Efeze', chapters: 6, aliases: ['efeziers'] },
  { slug: 'filippenzen', name: 'Filippenzen', chapters: 4 },
  { slug: 'kolossenzen', name: 'Kolossenzen', chapters: 4 },
  { slug: '1 thessalonicenzen', name: '1 Thessalonicenzen', chapters: 5, aliases: ['1 tessalonicenzen', '1 tess'] },
  { slug: '2 thessalonicenzen', name: '2 Thessalonicenzen', chapters: 3, aliases: ['2 tessalonicenzen', '2 tess'] },
  { slug: '1 timotheüs', name: '1 Timotheüs', chapters: 6, aliases: ['1 timoteus'] },
  { slug: '2 timotheüs', name: '2 Timotheüs', chapters: 4, aliases: ['2 timoteus'] },
  { slug: 'titus', name: 'Titus', chapters: 3 },
  { slug: 'filemon', name: 'Filemon', chapters: 1, aliases: ['flm'] },
  { slug: 'hebreeën', name: 'Hebreeën', chapters: 13 },
  { slug: 'jakobus', name: 'Jakobus', chapters: 5 },
  { slug: '1 petrus', name: '1 Petrus', chapters: 5 },
  { slug: '2 petrus', name: '2 Petrus', chapters: 3 },
  { slug: '1 johannes', name: '1 Johannes', chapters: 5 },
  { slug: '2 johannes', name: '2 Johannes', chapters: 1 },
  { slug: '3 johannes', name: '3 Johannes', chapters: 1 },
  { slug: 'judas', name: 'Judas', chapters: 1 },
  { slug: 'openbaring', name: 'Openbaring', chapters: 22, aliases: ['openb', 'opb', 'apocalyps'] },
]

const normalizeBookName = (name) => {
  return name
      .normalize('NFD')
      .replace(/\p{M}+/gu, '')
      .toLowerCase()
      .replace(/\./g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/^(iii|ii|i)\s/, (_, roman) => `${roman.length} `)
}

const BOOKS = [...OLD_TESTAMENT, ...NEW_TESTAMENT].map((book) => ({
  ...book,
  keys: [...new Set([book.name, book.slug, ...(book.aliases || [])].map(normalizeBookName))],
}))

const bookBySlug = new Map(BOOKS.map((book) => [book.slug, book]))
const oldTestament = BOOKS.slice(0, OLD_TESTAMENT.length)
const newTestament = BOOKS.slice(OLD_TESTAMENT.length)

/*
 * De HSV-website stuurt geen CORS-headers, dus de browser kan de tekst niet
 * rechtstreeks ophalen. Lokaal loopt het verkeer via de Vite-proxy (/hsv-api,
 * zie vite.config.js), gehost via de Cloudflare Worker in VITE_HSV_BASE_URL.
 */
const HSV_BASE_URL = String(import.meta.env.VITE_HSV_BASE_URL || '').replace(/\/+$/, '')
const canFetch = import.meta.env.DEV || HSV_BASE_URL !== ''
const FETCH_TIMEOUT_MS = 20000

const NO_FETCH_MESSAGE =
    'Automatisch ophalen is hier niet beschikbaar. Start de dev-server (npm run dev) of stel VITE_HSV_BASE_URL in.'

const referenceInput = ref('Handelingen 28:11-31')
const inputText = ref(`1 In het begin schiep God de hemel en de aarde.
2 De aarde nu was woest en leeg, en duisternis lag over de watervloed; en de Geest van God zweefde boven het water.
3 En God zei: Laat er licht zijn! En er was licht.
4 En God zag het licht dat het goed was; en God maakte scheiding tussen het licht en de duisternis.
5 En God noemde het licht dag en de duisternis noemde Hij nacht. Toen was het avond geweest en het was morgen geweest: de eerste dag.`)

const outputText = ref('')
const versesPerParagraph = ref(5)
const keepVerseNumbers = ref(true)
const doubleLineBreak = ref(true)
const isLoading = ref(false)
const loadingLabel = ref('')
const fetchError = ref('')
const fetchSuccess = ref('')
const copyState = ref('idle')

const selectedBookSlug = ref('handelingen')
const selectedChapter = ref(28)
const fromVerse = ref(11)
const toVerse = ref(31)
const chapterVerses = ref([])

// Onthoudt welke tekst wij zelf hebben opgehaald, zodat het label boven de
// output verdwijnt zodra iemand de ruwe tekst met de hand aanpast.
const generatedText = ref('')
const sourceLabel = ref('')

const selectedBook = computed(() => bookBySlug.get(selectedBookSlug.value))
const chapterCount = computed(() => selectedBook.value?.chapters || 1)
const verseNumbers = computed(() => chapterVerses.value.map((verse) => verse.number))
const toVerseOptions = computed(() => verseNumbers.value.filter((n) => n >= fromVerse.value))

const chapterCache = new Map()
let pendingRange = null
let activeRequest = 0
let copyTimer = null

const normalizeWhitespace = (text) => {
  return text
      .replace(/\r/g, '')
      .replace(/[ \t]+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim()
}

const formatReferenceLabel = (book, chapter, from, to, isWholeChapter) => {
  if (isWholeChapter) return `${book.name} ${chapter}`
  if (from === to) return `${book.name} ${chapter}:${from}`
  return `${book.name} ${chapter}:${from}-${to}`
}

const findBook = (rawName) => {
  const query = normalizeBookName(rawName)

  if (!query) {
    throw new Error('Vul een bijbelboek in, bijvoorbeeld: Handelingen 28:11-31')
  }

  const exact = BOOKS.find((book) => book.keys.includes(query))
  if (exact) return exact

  const candidates = BOOKS.filter((book) => book.keys.some((key) => key.startsWith(query)))

  if (candidates.length === 1) return candidates[0]

  if (candidates.length > 1) {
    const names = candidates.map((book) => book.name).join(', ')
    throw new Error(`"${rawName}" is niet eenduidig. Bedoel je: ${names}?`)
  }

  throw new Error(`Onbekend bijbelboek: ${rawName}`)
}

const parseReference = (input) => {
  const cleaned = input
      .trim()
      .replace(/[–—]/g, '-')
      .replace(/\s+/g, ' ')

  const match = cleaned.match(/^(.+?)\s*(\d+)\s*(?:[:.,]\s*(\d+)\s*(?:-\s*(\d+))?)?$/)

  if (!match) {
    throw new Error('Ongeldige verwijzing. Gebruik bijvoorbeeld: Handelingen 28:11-31')
  }

  const book = findBook(match[1])
  const chapter = Number(match[2])
  const from = match[3] ? Number(match[3]) : 1
  const to = match[4] ? Number(match[4]) : match[3] ? from : null

  if (!chapter || chapter > book.chapters) {
    const suffix = book.chapters === 1 ? 'hoofdstuk' : 'hoofdstukken'
    throw new Error(`${book.name} heeft ${book.chapters} ${suffix}.`)
  }

  if (!from || (to !== null && !to)) {
    throw new Error('De versnummers kloppen niet.')
  }

  if (to !== null && to < from) {
    throw new Error('Het eindvers mag niet lager zijn dan het beginvers.')
  }

  return { book, chapter, from, to }
}

const chapterUrl = (slug, chapter) => {
  return `${HSV_BASE_URL || '/hsv-api'}/teksten/${encodeURIComponent(slug)}/${chapter}`
}

const fetchChapterHtml = async (slug, chapter) => {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

  try {
    const response = await fetch(chapterUrl(slug, chapter), {
      redirect: 'manual',
      signal: controller.signal,
    })

    if (!response.ok) {
      throw new Error('Kon het hoofdstuk niet ophalen van de HSV-website.')
    }

    return await response.text()
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new Error('Het ophalen duurde te lang. Probeer het opnieuw.')
    }

    if (error instanceof TypeError) {
      throw new Error(
          import.meta.env.DEV
              ? 'Kon de HSV-website niet bereiken via de dev-proxy. Controleer je internetverbinding.'
              : 'Kon de HSV-website niet bereiken. Controleer de proxy-instelling (VITE_HSV_BASE_URL).'
      )
    }

    throw error
  } finally {
    clearTimeout(timer)
  }
}

/*
 * Zet het HTML-fragment van één vers om naar platte tekst. Kruisverwijzingen
 * (.x), voetnoten (.f), versnummers (.v) en tussenkopjes (.s) worden verwijderd;
 * toegevoegde woorden (.add) en de Godsnaam (.nd) blijven gewoon staan.
 */
const verseFragmentToText = (fragment) => {
  const template = document.createElement('template')
  template.innerHTML = fragment
      .replace(/<br\s*\/?>/gi, ' ')
      .replace(/<\/(p|div|li|h[1-6])>/gi, ' ')

  template.content
      .querySelectorAll('.x, .f, .v, .s, sup, script, style')
      .forEach((element) => element.remove())

  return template.content.textContent
      .replace(/\s+/g, ' ')
      .replace(/\s+([,.;:!?])/g, '$1')
      .trim()
}

/*
 * De HSV-website markeert elk vers met <!--SOV:n--> ... <!--EOV:n-->.
 * Daarmee vangen we ook tekst die niet in een verse-span staat, zoals
 * psalmopschriften (vers 1 van veel psalmen).
 */
const extractChapterVersesFromHtml = (html) => {
  const markerPattern = /<!--SOV:(\d+)-->/g
  const starts = []
  let marker

  while ((marker = markerPattern.exec(html)) !== null) {
    starts.push({ number: Number(marker[1]), index: marker.index + marker[0].length })
  }

  const verses = new Map()

  starts.forEach((start, position) => {
    const nextStart = starts[position + 1]?.index ?? html.length
    const endMarker = html.indexOf(`<!--EOV:${start.number}-->`, start.index)
    const end = endMarker !== -1 && endMarker < nextStart ? endMarker : nextStart
    const text = verseFragmentToText(html.slice(start.index, end))

    if (start.number > 0 && text && !verses.has(start.number)) {
      verses.set(start.number, { number: start.number, text })
    }
  })

  return [...verses.values()].sort((a, b) => a.number - b.number)
}

const fetchChapterVerses = async (slug, chapter) => {
  const key = `${slug}/${chapter}`

  if (chapterCache.has(key)) return chapterCache.get(key)

  const html = await fetchChapterHtml(slug, chapter)
  const verses = extractChapterVersesFromHtml(html)

  if (!verses.length) {
    throw new Error('Er zijn geen verzen gevonden op deze hoofdstukpagina.')
  }

  chapterCache.set(key, verses)
  return verses
}

const applySelection = () => {
  const verses = chapterVerses.value
  const book = selectedBook.value
  const from = fromVerse.value
  const to = toVerse.value

  if (!verses.length || !book || to < from) return

  const selected = verses.filter((verse) => verse.number >= from && verse.number <= to)
  if (!selected.length) return

  const label = formatReferenceLabel(
      book,
      selectedChapter.value,
      from,
      to,
      selected.length === verses.length
  )

  inputText.value = selected.map((verse) => `${verse.number} ${verse.text}`).join('\n')
  generatedText.value = inputText.value
  sourceLabel.value = label
  referenceInput.value = label
  formatText()

  fetchError.value = ''
  fetchSuccess.value = `${label} is opgehaald (${selected.length} ${selected.length === 1 ? 'vers' : 'verzen'}).`
}

const loadChapter = async (range = null) => {
  const book = selectedBook.value
  const chapter = selectedChapter.value

  if (!book) return

  fetchError.value = ''
  fetchSuccess.value = ''

  if (!canFetch) {
    fetchError.value = NO_FETCH_MESSAGE
    return
  }

  const requestId = ++activeRequest
  const label = `${book.name} ${chapter}`

  isLoading.value = true
  loadingLabel.value = label

  try {
    const verses = await fetchChapterVerses(book.slug, chapter)
    if (requestId !== activeRequest) return

    const last = verses[verses.length - 1].number

    if (range && range.from > last) {
      throw new Error(`${label} heeft ${last} ${last === 1 ? 'vers' : 'verzen'}; vers ${range.from} bestaat niet.`)
    }

    const from = range ? Math.max(1, range.from) : 1
    const to = range?.to ? Math.min(range.to, last) : last

    chapterVerses.value = verses
    fromVerse.value = from
    toVerse.value = Math.max(from, to)
    applySelection()
  } catch (error) {
    if (requestId !== activeRequest) return

    fetchError.value =
        error instanceof Error
            ? error.message
            : 'Er ging iets mis bij het ophalen van de bijbeltekst.'
  } finally {
    if (requestId === activeRequest) isLoading.value = false
  }
}

const onBookChange = (slug) => {
  if (slug === selectedBookSlug.value) return
  pendingRange = null
  selectedBookSlug.value = slug
  selectedChapter.value = 1
}

watch([selectedBookSlug, selectedChapter], () => {
  const range = pendingRange
  pendingRange = null
  loadChapter(range)
})

watch([fromVerse, toVerse], ([from, to]) => {
  if (to < from) {
    toVerse.value = from
    return
  }

  applySelection()
})

const loadBibleReference = () => {
  fetchError.value = ''
  fetchSuccess.value = ''

  try {
    const { book, chapter, from, to } = parseReference(referenceInput.value)
    const range = { from, to }

    if (book.slug === selectedBookSlug.value && chapter === selectedChapter.value) {
      loadChapter(range)
      return
    }

    pendingRange = range
    selectedBookSlug.value = book.slug
    selectedChapter.value = chapter
  } catch (error) {
    fetchError.value =
        error instanceof Error
            ? error.message
            : 'Er ging iets mis bij het lezen van de verwijzing.'
  }
}

const extractVerses = (text) => {
  const cleaned = normalizeWhitespace(text)

  if (!cleaned) return []

  const lines = cleaned
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)

  const verses = []
  let currentVerse = null

  for (const line of lines) {
    const match = line.match(/^(\d+)\s*(.+)$/)

    if (match) {
      if (currentVerse) verses.push(currentVerse)

      currentVerse = {
        number: match[1],
        text: match[2].trim(),
      }
    } else if (currentVerse) {
      currentVerse.text += ` ${line}`
    } else {
      verses.push({
        number: '',
        text: line,
      })
    }
  }

  if (currentVerse) verses.push(currentVerse)

  return verses.filter((verse) => verse.text)
}

const buildParagraphs = (verses) => {
  const groupSize = Math.max(1, Number(versesPerParagraph.value) || 5)
  const paragraphs = []

  for (let index = 0; index < verses.length; index += groupSize) {
    const group = verses.slice(index, index + groupSize)

    const paragraph = group
        .map((verse) => {
          if (keepVerseNumbers.value && verse.number) {
            return `${verse.number} ${verse.text}`
          }
          return verse.text
        })
        .join(' ')
        .replace(/\s+([,.;:!?])/g, '$1')
        .trim()

    if (paragraph) paragraphs.push(paragraph)
  }

  return paragraphs
}

const formatText = () => {
  const verses = extractVerses(inputText.value)
  const paragraphs = buildParagraphs(verses)
  const separator = doubleLineBreak.value ? '\n\n' : '\n'
  outputText.value = paragraphs.join(separator)
}

/*
 * Kopieert naar het klembord. De moderne Clipboard API is de eerste keuze; in
 * oudere browsers en afgeschermde webviews is die geblokkeerd, dus valt de
 * functie terug op een tijdelijk tekstveld met execCommand.
 */
const writeToClipboard = async (text) => {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    // Geen probleem: hieronder volgt de terugvaloptie.
  }

  const helper = document.createElement('textarea')
  helper.value = text
  helper.setAttribute('readonly', '')
  helper.style.position = 'fixed'
  helper.style.top = '0'
  helper.style.left = '0'
  helper.style.opacity = '0'
  document.body.appendChild(helper)

  const selection = document.getSelection()
  const previousRange = selection && selection.rangeCount ? selection.getRangeAt(0) : null

  helper.select()
  helper.setSelectionRange(0, helper.value.length)

  let copied = false

  try {
    copied = document.execCommand('copy')
  } catch {
    copied = false
  }

  helper.remove()

  if (selection && previousRange) {
    selection.removeAllRanges()
    selection.addRange(previousRange)
  }

  return copied
}

const copyOutput = async () => {
  if (!outputText.value) return

  clearTimeout(copyTimer)
  copyState.value = (await writeToClipboard(outputText.value)) ? 'done' : 'error'

  copyTimer = setTimeout(() => {
    copyState.value = 'idle'
  }, 2400)
}

const copyButtonText = computed(() => {
  if (copyState.value === 'done') return 'Gekopieerd'
  if (copyState.value === 'error') return 'Mislukt'
  return 'Kopieer'
})

const copyTitle = computed(() => {
  if (copyState.value === 'done') return 'Gekopieerd naar het klembord'
  if (copyState.value === 'error') return 'Kopiëren mislukt, selecteer de tekst handmatig'
  return 'Kopieer de doorlopende tekst'
})

const clearAll = () => {
  referenceInput.value = ''
  inputText.value = ''
  outputText.value = ''
  generatedText.value = ''
  sourceLabel.value = ''
  fetchError.value = ''
  fetchSuccess.value = ''
}

const versesCount = computed(() => extractVerses(inputText.value).length)
const paragraphsCount = computed(() => buildParagraphs(extractVerses(inputText.value)).length)

const outputParagraphs = computed(() =>
    outputText.value
        .split('\n')
        .map((paragraph) => paragraph.trim())
        .filter(Boolean)
)

const outputReference = computed(() =>
    sourceLabel.value && inputText.value === generatedText.value ? sourceLabel.value : ''
)

// Houd de output altijd gelijk aan de ruwe tekst en de gekozen instellingen.
watch([inputText, versesPerParagraph, keepVerseNumbers, doubleLineBreak], () => formatText())

formatText()

onMounted(() => {
  if (canFetch) loadChapter({ from: fromVerse.value, to: toVerse.value })
})
</script>

<style scoped>
:global(*),
:global(*::before),
:global(*::after) {
  box-sizing: border-box;
}

:global(html) {
  -webkit-text-size-adjust: 100%;
}

:global(html, body, #app) {
  margin: 0;
  padding: 0;
  min-height: 100%;
}

:global(body) {
  min-width: 320px;
  background: #f4f0e8;
  color: #23201b;
  color-scheme: light;
  font-family: 'EB Garamond', Georgia, 'Times New Roman', serif;
  -webkit-font-smoothing: antialiased;
}

.app {
  --paper: #f4f0e8;
  --paper-raised: #fbf9f4;
  --band: #ece5d7;
  --ink: #23201b;
  --ink-soft: #4f4941;
  --ink-muted: #8d8477;
  --rule: #ddd5c5;
  --rule-strong: #cbc2af;
  --accent: #9d3a17;
  --accent-dark: #7f2f11;
  --accent-tint: rgba(157, 58, 23, 0.08);

  --font-display: 'Playfair Display', Georgia, 'Times New Roman', serif;
  --font-serif: 'EB Garamond', Georgia, 'Times New Roman', serif;
  --font-label: system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif;

  min-height: 100vh;
  background: var(--paper);
  color: var(--ink);
  font-family: var(--font-serif);
  overflow-x: hidden;
}

.shell {
  width: 100%;
  max-width: 1240px;
  margin: 0 auto;
  padding-inline: clamp(20px, 4vw, 64px);
}

/* ---------- masthead ---------- */

.masthead {
  background: var(--band);
  border-bottom: 1px solid var(--rule);
  padding-top: env(safe-area-inset-top);
}

.masthead-inner {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px 24px;
  padding-block: 20px;
}

.brand,
.masthead-note {
  margin: 0;
  font-family: var(--font-label);
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.brand {
  color: var(--accent);
}

.brand-mark {
  margin-right: 8px;
  font-size: 1.1em;
}

.masthead-note {
  color: var(--ink-muted);
  font-weight: 500;
}

/* ---------- hero ---------- */

.hero {
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(0, 1fr);
  gap: clamp(28px, 5vw, 72px);
  align-items: start;
  padding-block: clamp(48px, 8vw, 96px) clamp(32px, 5vw, 56px);
}

h1 {
  margin: 0 0 clamp(20px, 3vw, 32px);
  font-family: var(--font-display);
  font-weight: 500;
  font-size: clamp(2.5rem, 7.2vw, 5.1rem);
  line-height: 1.02;
  letter-spacing: -0.015em;
  text-wrap: balance;
}

h1 em {
  color: var(--accent);
  font-style: italic;
}

.hero-lede p {
  margin: 0;
  max-width: 34em;
  font-size: clamp(1.08rem, 1.35vw, 1.32rem);
  line-height: 1.62;
  color: var(--ink-soft);
}

.hero-quote {
  margin: 0;
  padding-left: clamp(20px, 2.4vw, 30px);
  border-left: 2px solid var(--accent);
}

.hero-quote blockquote {
  margin: 0 0 16px;
  font-size: clamp(1.18rem, 1.7vw, 1.55rem);
  font-style: italic;
  line-height: 1.5;
  color: var(--ink);
}

.hero-quote figcaption {
  font-family: var(--font-label);
  font-size: 0.68rem;
  font-weight: 600;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--ink-muted);
}

/* ---------- ornament ---------- */

.ornament {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 18px;
  padding-block: clamp(24px, 4vw, 44px);
}

.ornament-rule {
  width: clamp(60px, 14vw, 160px);
  height: 1px;
  background: var(--rule-strong);
}

.ornament-mark {
  color: var(--accent);
  font-size: 1.1rem;
  line-height: 1;
}

/* ---------- shared bits ---------- */

.label {
  display: block;
  margin: 0 0 14px;
  font-family: var(--font-label);
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.17em;
  text-transform: uppercase;
  color: var(--accent);
}

.label-muted {
  color: var(--ink-muted);
  margin: 0;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
}

.field-label {
  font-family: var(--font-label);
  font-size: 0.68rem;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--ink-muted);
}

input[type='text'],
input[type='number'],
select,
textarea {
  width: 100%;
  font-family: var(--font-serif);
  font-size: 1.1rem;
  color: var(--ink);
  background: var(--paper-raised);
  border: 1px solid var(--rule-strong);
  border-radius: 2px;
  padding: 0 18px;
  height: 60px;
  outline: none;
  transition: border-color 0.16s ease, box-shadow 0.16s ease;
}

input:focus-visible,
select:focus-visible,
textarea:focus-visible {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-tint);
}

.select-wrap {
  position: relative;
}

.select-wrap::after {
  content: '';
  position: absolute;
  right: 18px;
  top: 50%;
  width: 8px;
  height: 8px;
  border-right: 1.5px solid var(--ink-muted);
  border-bottom: 1.5px solid var(--ink-muted);
  transform: translateY(-70%) rotate(45deg);
  pointer-events: none;
}

select {
  appearance: none;
  -webkit-appearance: none;
  padding-right: 44px;
  cursor: pointer;
  text-overflow: ellipsis;
}

select:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

/* ---------- step 1 ---------- */

.step {
  padding-block: clamp(8px, 1.5vw, 16px) clamp(32px, 5vw, 52px);
}

.picker {
  display: grid;
  grid-template-columns: minmax(0, 2fr) repeat(3, minmax(0, 1fr));
  gap: clamp(14px, 1.6vw, 22px);
  margin-bottom: clamp(20px, 2.6vw, 30px);
}

.reference-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto;
  gap: clamp(16px, 2vw, 28px);
  align-items: end;
}

.field-grow {
  min-width: 0;
}

.stats {
  display: flex;
  gap: clamp(20px, 3vw, 40px);
  padding-bottom: 6px;
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
}

.stat-value {
  font-family: var(--font-display);
  font-size: clamp(1.9rem, 3.2vw, 2.55rem);
  line-height: 1;
  font-weight: 400;
}

.stat-label {
  font-family: var(--font-label);
  font-size: 0.64rem;
  font-weight: 600;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--ink-muted);
}

/* ---------- buttons ---------- */

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 60px;
  padding: 0 clamp(24px, 3vw, 38px);
  border: 1px solid transparent;
  border-radius: 2px;
  font-family: var(--font-label);
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  cursor: pointer;
  white-space: nowrap;
  transition: background-color 0.16s ease, color 0.16s ease, border-color 0.16s ease;
}

.btn:disabled {
  opacity: 0.42;
  cursor: not-allowed;
}

.btn-accent {
  background: var(--accent);
  color: #fdf9f3;
}

.btn-accent:hover:not(:disabled) {
  background: var(--accent-dark);
}

/* ---------- messages ---------- */

.message {
  margin: 20px 0 0;
  font-size: 1.02rem;
  line-height: 1.55;
  color: var(--ink-soft);
}

.message-error {
  color: #8f2f22;
}

.message-success {
  color: #46603c;
}

.message-info,
.message-warning {
  color: var(--ink-muted);
}

.mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 0.9em;
  color: var(--ink);
}

/* ---------- step 2 ---------- */

.step-settings {
  border-top: 1px solid var(--rule);
  padding-top: clamp(28px, 4vw, 44px);
}

.settings {
  display: grid;
  grid-template-columns: minmax(180px, 220px) minmax(0, 1fr);
  gap: clamp(20px, 3vw, 44px);
  align-items: end;
}

.field-narrow input {
  max-width: 200px;
}

.toggles {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.toggle {
  min-height: 60px;
  padding: 0 22px;
  background: var(--paper-raised);
  border: 1px solid var(--rule-strong);
  border-radius: 2px;
  font-family: var(--font-serif);
  font-size: 1.02rem;
  color: var(--ink-soft);
  cursor: pointer;
  transition: border-color 0.16s ease, color 0.16s ease;
}

.toggle b {
  font-weight: 600;
  color: var(--accent);
}

.toggle:hover {
  border-color: var(--ink-muted);
}

/* ---------- kleine acties in de paneelkoppen ---------- */

.text-btn {
  padding: 4px 0;
  background: none;
  border: none;
  border-bottom: 1px solid var(--rule-strong);
  font-family: var(--font-label);
  font-size: 0.68rem;
  font-weight: 600;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--ink-muted);
  cursor: pointer;
  transition: color 0.16s ease, border-color 0.16s ease;
}

.text-btn:hover:not(:disabled) {
  color: var(--accent);
  border-color: var(--accent);
}

.text-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.copy-btn {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 38px;
  padding: 0 14px;
  margin: -6px -8px 0 12px;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 2px;
  font-family: var(--font-label);
  font-size: 0.66rem;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--ink-muted);
  cursor: pointer;
  transition: color 0.16s ease, border-color 0.16s ease, background-color 0.16s ease;
}

.copy-btn svg {
  width: 17px;
  height: 17px;
  flex-shrink: 0;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.7;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.copy-btn:hover:not(:disabled),
.copy-btn:focus-visible {
  color: var(--accent);
  border-color: var(--rule-strong);
  background: var(--paper);
}

.copy-btn.is-done {
  color: #46603c;
  border-color: transparent;
  background: transparent;
}

.copy-btn.is-error {
  color: #8f2f22;
}

.copy-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

/* ---------- panels ---------- */

.panels {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: clamp(28px, 4vw, 56px);
  margin-top: clamp(36px, 5vw, 60px);
  padding-top: clamp(28px, 4vw, 44px);
  border-top: 1px solid var(--rule);
}

.panel {
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.panel-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}

.panel-head .label {
  margin-bottom: 0;
}

.raw-input {
  flex: 1;
  min-height: 420px;
  height: auto;
  padding: 26px 28px;
  line-height: 1.72;
  resize: vertical;
}

.output {
  flex: 1;
  min-height: 420px;
  padding: 26px 28px;
  background: var(--paper-raised);
  border: 1px solid var(--rule);
  border-radius: 2px;
  overflow-wrap: break-word;
}

.output-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
  min-height: 26px;
  margin-bottom: 20px;
}

.output-ref {
  margin: 0;
  padding-top: 4px;
  font-family: var(--font-label);
  font-size: 0.68rem;
  font-weight: 600;
  letter-spacing: 0.17em;
  text-transform: uppercase;
  color: var(--ink-muted);
}

.output-paragraph {
  margin: 0 0 1.15em;
  font-size: 1.12rem;
  line-height: 1.78;
  text-align: justify;
  hyphens: auto;
}

.output-paragraph:last-child {
  margin-bottom: 0;
}

.output-empty {
  margin: 0;
  color: var(--ink-muted);
  font-style: italic;
}

/* ---------- notes ---------- */

.notes {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: clamp(24px, 3vw, 44px);
  margin-top: clamp(44px, 6vw, 72px);
  padding-block: clamp(32px, 4vw, 48px) clamp(48px, 7vw, 88px);
  border-top: 1px solid var(--rule);
}

.note p:last-child {
  margin: 0;
  font-size: 1.02rem;
  line-height: 1.6;
  color: var(--ink-soft);
  max-width: 26em;
}

/* ---------- tablet ---------- */

@media (max-width: 1080px) {
  .hero {
    grid-template-columns: minmax(0, 1fr);
    gap: clamp(28px, 5vw, 44px);
  }

  .hero-quote {
    max-width: 34em;
  }

  .picker {
    grid-template-columns: minmax(0, 1.6fr) repeat(3, minmax(0, 1fr));
  }

  .settings {
    grid-template-columns: minmax(140px, 200px) minmax(0, 1fr);
  }

  .panels {
    grid-template-columns: minmax(0, 1fr);
  }

  .raw-input,
  .output {
    min-height: 340px;
  }

  .notes {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

/* ---------- small tablet / large phone ---------- */

@media (max-width: 820px) {
  .picker {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .picker .field:first-child {
    grid-column: 1 / -1;
  }

  .reference-row {
    grid-template-columns: minmax(0, 1fr);
    gap: 18px;
  }

  .reference-row .btn {
    width: 100%;
  }

  .stats {
    justify-content: flex-start;
    gap: 36px;
    padding-bottom: 0;
  }
}

/* ---------- phone ---------- */

@media (max-width: 560px) {
  .masthead-inner {
    padding-block: 16px;
  }

  .masthead-note {
    display: none;
  }

  .hero {
    padding-block: 36px 24px;
  }

  h1 {
    font-size: clamp(2.3rem, 11vw, 3.2rem);
  }

  .picker {
    grid-template-columns: minmax(0, 1fr);
  }

  .settings {
    grid-template-columns: minmax(0, 1fr);
    align-items: stretch;
  }

  .field-narrow input {
    max-width: none;
  }

  .toggles {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
  }

  .toggle {
    text-align: left;
  }

  .btn {
    width: 100%;
  }

  .copy-btn-text {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }

  .copy-btn {
    min-width: 44px;
    min-height: 44px;
    justify-content: center;
    margin: -8px -10px 0 12px;
  }

  input[type='text'],
  input[type='number'],
  select,
  .btn,
  .toggle {
    height: 56px;
    min-height: 56px;
  }

  .raw-input,
  .output {
    min-height: 300px;
    padding: 20px;
  }

  .output-paragraph {
    text-align: left;
    hyphens: manual;
  }

  .notes {
    grid-template-columns: minmax(0, 1fr);
    gap: 26px;
  }
}

@media (prefers-reduced-motion: reduce) {
  * {
    transition-duration: 0.01ms !important;
    animation-duration: 0.01ms !important;
  }
}
</style>
