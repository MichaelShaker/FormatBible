<template>
  <div class="page">
    <div class="background-glow background-glow-left"></div>
    <div class="background-glow background-glow-right"></div>

    <div class="container">
      <header class="hero">
        <div class="hero-badge">Tekst tool</div>
        <h1>Bible Text Formatter</h1>
        <p>
          Plak ruwe tekst met versnummers in het linkervak. De tool haalt de
          nummers weg, maakt nette alinea’s en geeft rechts direct kopieerbare
          tekst terug.
        </p>
      </header>

      <section class="controls-card">
        <div class="controls-top">
          <div>
            <h2>Instellingen</h2>
            <p>Kies hoe de tekst moet worden opgemaakt.</p>
          </div>
          <div class="status-pills">
            <span class="pill">{{ versesCount }} verzen</span>
            <span class="pill">{{ paragraphsCount }} alinea's</span>
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
              <span>Plak hier je ruwe tekst</span>
            </div>
          </div>

          <textarea
              v-model="inputText"
              class="editor"
              placeholder="Bijvoorbeeld:&#10;1In het begin schiep God de hemel en de aarde.&#10;2De aarde nu was woest en leeg..."
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
            <strong>Verwijdert versnummers</strong>
            <p>Haalt losse versnummers aan het begin van een vers weg.</p>
          </div>
          <div class="help-item">
            <strong>Maakt vloeiende tekst</strong>
            <p>Zet losse regels om naar nette doorlopende zinnen.</p>
          </div>
          <div class="help-item">
            <strong>Maakt alinea’s</strong>
            <p>Verdeelt de tekst automatisch per gekozen aantal verzen.</p>
          </div>
          <div class="help-item">
            <strong>Direct kopieerbaar</strong>
            <p>Geeft meteen een schone output terug voor gebruik in je project.</p>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'

const inputText = ref(`1In het begin schiep God de hemel en de aarde.
2De aarde nu was woest en leeg, en duisternis lag over de watervloed; en de Geest van God zweefde boven het water.

3En God zei: Laat er licht zijn! En er was licht.
4En God zag het licht dat het goed was; en God maakte scheiding tussen het licht en de duisternis.
5En God noemde het licht dag en de duisternis noemde Hij nacht. Toen was het avond geweest en het was morgen geweest: de eerste dag.`)

const outputText = ref('')
const versesPerParagraph = ref(5)
const keepVerseNumbers = ref(false)
const doubleLineBreak = ref(true)

const normalizeWhitespace = (text) => {
  return text
      .replace(/\r/g, '')
      .replace(/[ \t]+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim()
}

const extractVerses = (text) => {
  const cleaned = normalizeWhitespace(text)

  if (!cleaned) return []

  const lines = cleaned
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)

  const verses = []

  for (const line of lines) {
    const match = line.match(/^(\d+)(.*)$/)

    if (match) {
      verses.push({
        number: match[1],
        text: match[2].trim(),
      })
    } else {
      if (verses.length > 0) {
        verses[verses.length - 1].text += ` ${line}`
      } else {
        verses.push({
          number: '',
          text: line,
        })
      }
    }
  }

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

    if (paragraph) {
      paragraphs.push(paragraph)
    }
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
  if (!outputText.value) {
    formatText()
  }

  if (!outputText.value) return

  try {
    await navigator.clipboard.writeText(outputText.value)
    alert('De output is gekopieerd.')
  } catch (error) {
    alert('Kopiëren lukte niet. Kopieer de tekst handmatig uit het outputvak.')
  }
}

const clearAll = () => {
  inputText.value = ''
  outputText.value = ''
}

const versesCount = computed(() => extractVerses(inputText.value).length)
const paragraphsCount = computed(() => {
  const verses = extractVerses(inputText.value)
  return buildParagraphs(verses).length
})

formatText()
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

:global(textarea, input, button) {
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
  gap: 8px;
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
  max-width: 820px;
  color: #cbd5e1;
  line-height: 1.7;
  font-size: 1.05rem;
}

.controls-card,
.panel,
.help-card {
  background: rgba(15, 23, 42, 0.72);
  border: 1px solid rgba(148, 163, 184, 0.14);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.28);
  backdrop-filter: blur(14px);
}

.controls-card,
.help-card {
  border-radius: 24px;
  padding: 24px;
  margin-bottom: 24px;
}

.controls-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 22px;
}

.controls-top h2 {
  margin: 0 0 6px;
  font-size: 1.25rem;
  color: #f8fafc;
}

.controls-top p {
  margin: 0;
  color: #94a3b8;
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

.controls-grid {
  display: grid;
  grid-template-columns: 1.1fr 1fr 1fr;
  gap: 16px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.field span {
  color: #cbd5e1;
  font-size: 0.95rem;
}

.field input[type='number'] {
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

.field input[type='number']:focus {
  border-color: rgba(96, 165, 250, 0.7);
  box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.12);
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

button:hover {
  transform: translateY(-1px);
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

  .controls-top {
    flex-direction: column;
    align-items: flex-start;
  }

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
</style>