<template>
  <div class="page">
    <div class="background-glow background-glow-left"></div>
    <div class="background-glow background-glow-right"></div>

    <div class="container">
      <header class="hero">
        <div class="hero-badge">HSV formatter</div>
        <h1>Bible Text Formatter</h1>
        <p>
          Kies een boek, hoofdstuk en verzen, of typ een verwijzing zoals
          <strong>Handelingen 28:11-31</strong>. De tool haalt de verzen op,
          maakt nette alinea’s en geeft direct kopieerbare output terug.
        </p>
      </header>

      <section class="fetch-card">
        <div class="fetch-top">
          <div>
            <h2>Bijbeltekst kiezen</h2>
            <p>
              Selecteer boek, hoofdstuk en versbereik. De tekst verschijnt
              direct in het inputvak en wordt meteen geformatteerd.
            </p>
          </div>
          <div class="status-pills">
            <span class="pill">{{ versesCount }} verzen</span>
            <span class="pill">{{ paragraphsCount }} alinea's</span>
          </div>
        </div>

        <div class="select-grid">
          <label class="field">
            <span>Boek</span>
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
          </label>

          <label class="field">
            <span>Hoofdstuk</span>
            <select v-model="selectedChapter">
              <option v-for="n in chapterCount" :key="n" :value="n">{{ n }}</option>
            </select>
          </label>

          <label class="field">
            <span>Van vers</span>
            <select v-model="fromVerse" :disabled="!verseNumbers.length">
              <option v-for="n in verseNumbers" :key="n" :value="n">{{ n }}</option>
            </select>
          </label>

          <label class="field">
            <span>Tot vers</span>
            <select v-model="toVerse" :disabled="!verseNumbers.length">
              <option v-for="n in toVerseOptions" :key="n" :value="n">{{ n }}</option>
            </select>
          </label>
        </div>

        <div class="fetch-grid">
          <label class="field field-wide">
            <span>Of typ een verwijzing</span>
            <input
                v-model="referenceInput"
                type="text"
                placeholder="Bijv. Handelingen 28:11-31, Ps. 23 of 1 Kor. 13:4-7"
                @keydown.enter.prevent="loadBibleReference"
            />
          </label>

          <button class="primary" :disabled="isLoading" @click="loadBibleReference">
            {{ isLoading ? 'Bezig...' : 'Haal tekst op' }}
          </button>
        </div>

        <p v-if="!canFetch" class="message warning">
          Automatisch ophalen werkt alleen via de lokale dev-server
          (<span class="mono">npm run dev</span>) of met een ingestelde proxy
          (<span class="mono">VITE_HSV_BASE_URL</span>). Plak anders de tekst
          handmatig in het inputvak.
        </p>
        <p v-if="fetchError" class="message error">{{ fetchError }}</p>
        <p v-else-if="isLoading" class="message info">{{ loadingLabel }} wordt geladen…</p>
        <p v-else-if="fetchSuccess" class="message success">{{ fetchSuccess }}</p>
      </section>

      <section class="controls-card">
        <div class="controls-top">
          <div>
            <h2>Instellingen</h2>
            <p>Kies hoe de tekst moet worden opgemaakt.</p>
          </div>
        </div>

        <div class="controls-grid">
          <label class="field">
            <span>Alinea na aantal verzen</span>
            <input
                v-model.number="versesPerParagraph"
                type="number"
                min="1"
                max="50"
            />
          </label>

          <label class="toggle-card">
            <div>
              <strong>Versnummers behouden</strong>
              <small>Laat nummers zichtbaar in de output</small>
            </div>
            <input v-model="keepVerseNumbers" type="checkbox" />
          </label>

          <label class="toggle-card">
            <div>
              <strong>Lege regel tussen alinea's</strong>
              <small>Meer ruimte tussen tekstblokken</small>
            </div>
            <input v-model="doubleLineBreak" type="checkbox" />
          </label>
        </div>

        <div class="button-row">
          <button class="primary" @click="formatText">Formatteren</button>
          <button class="secondary" @click="copyOutput">Kopieer output</button>
          <button class="danger" @click="clearAll">Leegmaken</button>
        </div>
      </section>

      <main class="editor-grid">
        <section class="panel">
          <div class="panel-header">
            <div>
              <h2>Input</h2>
              <span>Opgehaalde of geplakte tekst</span>
            </div>
          </div>

          <textarea
              v-model="inputText"
              class="editor"
              placeholder="Bijvoorbeeld:&#10;1 In het begin schiep God de hemel en de aarde.&#10;2 De aarde nu was woest en leeg..."
          />
        </section>

        <section class="panel">
          <div class="panel-header">
            <div>
              <h2>Output</h2>
              <span>Klaar om te kopiëren</span>
            </div>
          </div>

          <textarea
              :value="outputText"
              class="editor output"
              readonly
              placeholder="De geformatteerde tekst komt hier te staan"
          />
        </section>
      </main>

      <section class="help-card">
        <h3>Wat deze formatter doet</h3>
        <div class="help-grid">
          <div class="help-item">
            <strong>Kies boek, hoofdstuk en verzen</strong>
            <p>De HSV-tekst van jouw selectie wordt direct opgehaald, zonder kopiëren en plakken.</p>
          </div>
          <div class="help-item">
            <strong>Of typ een verwijzing</strong>
            <p>Bijvoorbeeld <span class="mono">Hand. 28:11-31</span>, <span class="mono">Psalm 23</span> of <span class="mono">1 Kor. 13:4-7</span>.</p>
          </div>
          <div class="help-item">
            <strong>Maakt nette alinea’s</strong>
            <p>Verdeelt automatisch op basis van jouw gekozen aantal verzen.</p>
          </div>
          <div class="help-item">
            <strong>Direct kopieerbaar</strong>
            <p>De output staat meteen klaar voor gebruik in je project.</p>
          </div>
        </div>
      </section>
    </div>
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
 * zie vite.config.js). Voor een gehoste versie kan een eigen proxy worden
 * ingesteld via VITE_HSV_BASE_URL.
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

const selectedBookSlug = ref('handelingen')
const selectedChapter = ref(28)
const fromVerse = ref(11)
const toVerse = ref(31)
const chapterVerses = ref([])

const selectedBook = computed(() => bookBySlug.get(selectedBookSlug.value))
const chapterCount = computed(() => selectedBook.value?.chapters || 1)
const verseNumbers = computed(() => chapterVerses.value.map((verse) => verse.number))
const toVerseOptions = computed(() => verseNumbers.value.filter((n) => n >= fromVerse.value))

const chapterCache = new Map()
let pendingRange = null
let activeRequest = 0

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

const copyOutput = async () => {
  if (!outputText.value) formatText()
  if (!outputText.value) return

  try {
    await navigator.clipboard.writeText(outputText.value)
    alert('De output is gekopieerd.')
  } catch {
    alert('Kopiëren lukte niet. Kopieer de tekst handmatig uit het outputvak.')
  }
}

const clearAll = () => {
  referenceInput.value = ''
  inputText.value = ''
  outputText.value = ''
  fetchError.value = ''
  fetchSuccess.value = ''
}

const versesCount = computed(() => extractVerses(inputText.value).length)
const paragraphsCount = computed(() => buildParagraphs(extractVerses(inputText.value)).length)

formatText()

onMounted(() => {
  if (canFetch) loadChapter({ from: fromVerse.value, to: toVerse.value })
})
</script>

<style scoped>
:global(*) {
  box-sizing: border-box;
}

:global(html, body, #app) {
  margin: 0;
  min-height: 100%;
}

:global(body) {
  font-family: Inter, Arial, Helvetica, sans-serif;
  background: #08111f;
  color: #e2e8f0;
}

:global(textarea, input, button, select) {
  font: inherit;
}

.page {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
  background:
      radial-gradient(circle at top left, rgba(59, 130, 246, 0.12), transparent 30%),
      radial-gradient(circle at top right, rgba(99, 102, 241, 0.1), transparent 28%),
      linear-gradient(180deg, #08111f 0%, #0b1220 100%);
  padding: 32px 24px 40px;
}

.background-glow {
  position: absolute;
  border-radius: 999px;
  filter: blur(80px);
  opacity: 0.22;
  pointer-events: none;
}

.background-glow-left {
  width: 280px;
  height: 280px;
  left: -80px;
  top: 60px;
  background: #2563eb;
}

.background-glow-right {
  width: 320px;
  height: 320px;
  right: -100px;
  top: 120px;
  background: #4f46e5;
}

.container {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 1500px;
  margin: 0 auto;
}

.hero {
  margin-bottom: 24px;
  padding: 8px 4px 4px;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  padding: 8px 12px;
  border-radius: 999px;
  background: rgba(37, 99, 235, 0.14);
  border: 1px solid rgba(96, 165, 250, 0.18);
  color: #bfdbfe;
  font-size: 0.88rem;
  margin-bottom: 14px;
}

.hero h1 {
  margin: 0 0 12px;
  font-size: clamp(2.1rem, 4vw, 3.6rem);
  line-height: 1.05;
  letter-spacing: -0.03em;
  color: #f8fafc;
}

.hero p {
  margin: 0;
  max-width: 900px;
  color: #cbd5e1;
  line-height: 1.7;
  font-size: 1.05rem;
}

.fetch-card,
.controls-card,
.panel,
.help-card {
  background: rgba(15, 23, 42, 0.72);
  border: 1px solid rgba(148, 163, 184, 0.14);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.28);
  backdrop-filter: blur(14px);
}

.fetch-card,
.controls-card,
.help-card {
  border-radius: 24px;
  padding: 24px;
  margin-bottom: 24px;
}

.fetch-top,
.controls-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
}

.fetch-top h2,
.controls-top h2 {
  margin: 0 0 6px;
  font-size: 1.25rem;
  color: #f8fafc;
}

.fetch-top p,
.controls-top p {
  margin: 0;
  color: #94a3b8;
}

.select-grid {
  display: grid;
  grid-template-columns: minmax(0, 2.2fr) repeat(3, minmax(0, 1fr));
  gap: 14px;
  margin-bottom: 18px;
}

.fetch-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 14px;
  align-items: end;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.field-wide {
  min-width: 0;
}

.field span {
  color: #cbd5e1;
  font-size: 0.95rem;
}

.field input[type='number'],
.field input[type='text'],
.field select {
  width: 100%;
  height: 54px;
  border-radius: 16px;
  border: 1px solid rgba(148, 163, 184, 0.2);
  background: rgba(2, 6, 23, 0.7);
  color: #f8fafc;
  padding: 0 16px;
  font-size: 1rem;
  outline: none;
}

.field select {
  appearance: none;
  -webkit-appearance: none;
  padding-right: 44px;
  cursor: pointer;
  color-scheme: dark;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 16px center;
}

.field select:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.field input:focus,
.field select:focus {
  border-color: rgba(96, 165, 250, 0.7);
  box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.12);
}

.status-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.pill {
  padding: 10px 14px;
  border-radius: 999px;
  background: rgba(30, 41, 59, 0.82);
  border: 1px solid rgba(148, 163, 184, 0.16);
  color: #cbd5e1;
  font-size: 0.9rem;
  white-space: nowrap;
}

.mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  color: #dbeafe;
}

.message {
  margin: 14px 0 0;
  font-size: 0.95rem;
  line-height: 1.6;
}

.message.error {
  color: #fca5a5;
}

.message.success {
  color: #86efac;
}

.message.info {
  color: #93c5fd;
}

.message.warning {
  color: #fcd34d;
}

.controls-grid {
  display: grid;
  grid-template-columns: 1.1fr 1fr 1fr;
  gap: 16px;
}

.toggle-card {
  min-height: 54px;
  border-radius: 18px;
  padding: 16px 18px;
  background: rgba(2, 6, 23, 0.56);
  border: 1px solid rgba(148, 163, 184, 0.14);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.toggle-card strong {
  display: block;
  color: #f8fafc;
  font-size: 0.96rem;
  margin-bottom: 4px;
}

.toggle-card small {
  color: #94a3b8;
  font-size: 0.83rem;
}

.toggle-card input {
  width: 20px;
  height: 20px;
  accent-color: #2563eb;
  flex-shrink: 0;
}

.button-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 22px;
}

button {
  border: none;
  border-radius: 14px;
  padding: 13px 20px;
  font-size: 0.97rem;
  font-weight: 600;
  cursor: pointer;
  transition: 0.2s ease;
}

button:hover:not(:disabled) {
  transform: translateY(-1px);
}

button:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.primary {
  background: linear-gradient(135deg, #2563eb, #3b82f6);
  color: white;
}

.secondary {
  background: #334155;
  color: white;
}

.danger {
  background: #991b1b;
  color: white;
}

.editor-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-bottom: 24px;
}

.panel {
  border-radius: 26px;
  padding: 20px;
  min-height: 620px;
  display: flex;
  flex-direction: column;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}

.panel-header h2 {
  margin: 0 0 4px;
  color: #f8fafc;
  font-size: 1.2rem;
}

.panel-header span {
  color: #94a3b8;
  font-size: 0.92rem;
}

.editor {
  flex: 1;
  width: 100%;
  min-height: 0;
  resize: none;
  border: 1px solid rgba(148, 163, 184, 0.16);
  border-radius: 20px;
  background: rgba(2, 6, 23, 0.72);
  color: #f8fafc;
  padding: 20px;
  font-size: 1rem;
  line-height: 1.8;
  outline: none;
}

.editor:focus {
  border-color: rgba(96, 165, 250, 0.75);
  box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.12);
}

.output {
  white-space: pre-wrap;
}

.help-card h3 {
  margin: 0 0 18px;
  color: #f8fafc;
  font-size: 1.15rem;
}

.help-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.help-item {
  padding: 16px;
  border-radius: 18px;
  background: rgba(2, 6, 23, 0.4);
  border: 1px solid rgba(148, 163, 184, 0.1);
}

.help-item strong {
  display: block;
  margin-bottom: 8px;
  color: #f8fafc;
}

.help-item p {
  margin: 0;
  color: #94a3b8;
  line-height: 1.6;
  font-size: 0.94rem;
}

@media (max-width: 1200px) {
  .controls-grid {
    grid-template-columns: 1fr;
  }

  .help-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 900px) {
  .page {
    padding: 20px 14px 28px;
  }

  .fetch-top,
  .controls-top {
    flex-direction: column;
    align-items: flex-start;
  }

  .select-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .fetch-grid,
  .editor-grid {
    grid-template-columns: 1fr;
  }

  .panel {
    min-height: auto;
  }

  .editor {
    min-height: 340px;
  }

  .help-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 520px) {
  .select-grid {
    grid-template-columns: 1fr;
  }
}
</style>
