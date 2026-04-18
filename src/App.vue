<template>
  <div class="page">
    <div class="container">
      <header class="hero">
        <h1>Bible Text Formatter</h1>
        <p>
          Plak ruwe tekst met versnummers in het linkervak. De website haalt de
          nummers weg, maakt nette alinea's en geeft rechts direct kopieerbare
          tekst terug.
        </p>
      </header>

      <section class="controls-card">
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

          <label class="field checkbox-field">
            <input v-model="keepVerseNumbers" type="checkbox" />
            <span>Versnummers behouden</span>
          </label>

          <label class="field checkbox-field">
            <input v-model="doubleLineBreak" type="checkbox" />
            <span>Lege regel tussen alinea's</span>
          </label>
        </div>

        <div class="button-row">
          <button @click="formatText">Formatteren</button>
          <button class="secondary" @click="copyOutput">Kopieer output</button>
          <button class="secondary danger" @click="clearAll">Leegmaken</button>
        </div>
      </section>

      <main class="editor-grid">
        <section class="panel">
          <div class="panel-header">
            <h2>Input</h2>
            <span>Plak hier je tekst</span>
          </div>
          <textarea
              v-model="inputText"
              class="editor"
              placeholder="Bijvoorbeeld:&#10;1In het begin schiep God de hemel en de aarde.&#10;2De aarde nu was woest en leeg..."
          />
        </section>

        <section class="panel">
          <div class="panel-header">
            <h2>Output</h2>
            <span>Klaar om te kopiëren</span>
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
        <ul>
          <li>haalt losse versnummers aan het begin van een vers weg</li>
          <li>zet de tekst om naar doorlopende zinnen</li>
          <li>maakt automatisch alinea's op basis van het aantal verzen</li>
          <li>geeft direct een nette tekst terug voor je project</li>
        </ul>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

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
  background: #0f172a;
}

.page {
  min-height: 100vh;
  width: 100%;
  background:
      radial-gradient(circle at top left, rgba(59, 130, 246, 0.2), transparent 28%),
      radial-gradient(circle at top right, rgba(37, 99, 235, 0.14), transparent 24%),
      linear-gradient(180deg, #081224 0%, #0f172a 100%);
  color: #e5e7eb;
  padding: 24px;
}

.container {
  width: 100%;
  max-width: 100%;
  margin: 0;
}

.hero {
  margin-bottom: 24px;
  padding: 8px 6px;
}

.hero h1 {
  margin: 0 0 8px;
  font-size: clamp(2rem, 3vw, 3rem);
}

.hero p {
  margin: 0;
  max-width: 900px;
  color: #cbd5e1;
  line-height: 1.6;
  font-size: 1.05rem;
}

.controls-card,
.help-card,
.panel {
  background: rgba(15, 23, 42, 0.78);
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 24px;
  box-shadow: 0 20px 45px rgba(0, 0, 0, 0.22);
  backdrop-filter: blur(12px);
}

.controls-card,
.help-card {
  padding: 22px;
  margin-bottom: 22px;
}

.controls-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(220px, 1fr));
  gap: 16px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 0.95rem;
  color: #cbd5e1;
}

.field input[type='number'] {
  width: 100%;
  padding: 12px 14px;
  border-radius: 14px;
  border: 1px solid rgba(148, 163, 184, 0.25);
  background: rgba(30, 41, 59, 0.9);
  color: #f8fafc;
  font-size: 1rem;
}

.checkbox-field {
  flex-direction: row;
  align-items: center;
  margin-top: 31px;
}

.checkbox-field input {
  width: 18px;
  height: 18px;
}

.button-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 20px;
}

button {
  border: none;
  border-radius: 14px;
  padding: 12px 20px;
  background: #2563eb;
  color: white;
  font-size: 0.98rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s ease, opacity 0.2s ease;
}

button:hover {
  transform: translateY(-1px);
  opacity: 0.95;
}

button.secondary {
  background: #334155;
}

button.danger {
  background: #991b1b;
}

.editor-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 22px;
  align-items: stretch;
}

.panel {
  padding: 20px;
  min-height: calc(100vh - 360px);
  display: flex;
  flex-direction: column;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.panel-header h2 {
  margin: 0;
  font-size: 1.25rem;
}

.panel-header span {
  color: #94a3b8;
  font-size: 0.92rem;
}

.editor {
  width: 100%;
  flex: 1;
  min-height: 0;
  resize: none;
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 18px;
  background: rgba(2, 6, 23, 0.78);
  color: #f8fafc;
  padding: 18px;
  font-size: 1rem;
  line-height: 1.8;
}

.output {
  white-space: pre-wrap;
}

.help-card h3 {
  margin-top: 0;
  margin-bottom: 10px;
}

.help-card ul {
  margin: 12px 0 0;
  padding-left: 18px;
  color: #cbd5e1;
  line-height: 1.7;
}

@media (max-width: 1100px) {
  .controls-grid {
    grid-template-columns: 1fr 1fr;
  }

  .checkbox-field {
    margin-top: 0;
  }
}

@media (max-width: 900px) {
  .page {
    padding: 16px;
  }

  .editor-grid,
  .controls-grid {
    grid-template-columns: 1fr;
  }

  .panel {
    min-height: auto;
  }

  .editor {
    min-height: 320px;
  }
}
</style>
