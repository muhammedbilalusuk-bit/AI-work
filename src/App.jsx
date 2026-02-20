import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { FixedSizeList as List } from 'react-window'

const THEMES = ['dark', 'light', 'parchment']

function normalizeSurahNumber(num) {
  return String(num).padStart(3, '0')
}

function buildAudioPath(reciter, surahNumber) {
  return `/audio/${reciter}/${normalizeSurahNumber(surahNumber)}.mp3`
}

function getAyahIndexFromTime(ayahs, currentTime, duration) {
  if (!ayahs.length) return -1
  const timedIndex = ayahs.findIndex((ayah) => {
    if (typeof ayah.start !== 'number' || typeof ayah.end !== 'number') return false
    return currentTime >= ayah.start && currentTime < ayah.end
  })

  if (timedIndex >= 0) return timedIndex

  if (!duration || Number.isNaN(duration)) return 0
  const percentage = Math.min(1, Math.max(0, currentTime / duration))
  return Math.min(ayahs.length - 1, Math.floor(percentage * ayahs.length))
}

async function loadReciters() {
  try {
    const response = await fetch('/audio/reciters.json')
    if (response.ok) {
      const data = await response.json()
      if (Array.isArray(data) && data.length > 0) return data
    }
  } catch {
    // ignore and continue with defaults
  }

  return ['Abdul_Basit', 'Alafasy']
}

export default function App() {
  const [quran, setQuran] = useState([])
  const [loading, setLoading] = useState(true)
  const [mode, setMode] = useState(null)
  const [currentSurah, setCurrentSurah] = useState(1)
  const [currentAyahIndex, setCurrentAyahIndex] = useState(-1)
  const [reciters, setReciters] = useState([])
  const [currentReciter, setCurrentReciter] = useState('')
  const [theme, setTheme] = useState('parchment')
  const [isPlaying, setIsPlaying] = useState(false)

  const audioRef = useRef(null)
  const activeAyahRef = useRef(null)

  useEffect(() => {
    async function bootstrap() {
      const [quranResponse, loadedReciters] = await Promise.all([
        fetch('/quran.json').then((res) => res.json()),
        loadReciters(),
      ])
      setQuran(Array.isArray(quranResponse.surahs) ? quranResponse.surahs : quranResponse)
      setReciters(loadedReciters)
      setCurrentReciter(loadedReciters[0] ?? '')
      setLoading(false)
    }

    bootstrap()
  }, [])

  const surah = useMemo(
    () => quran.find((s) => Number(s.number) === Number(currentSurah)),
    [quran, currentSurah],
  )

  useEffect(() => {
    if (mode !== 'listen-read' || !audioRef.current || !surah || !currentReciter) return

    const audio = audioRef.current
    audio.src = buildAudioPath(currentReciter, surah.number)
    audio.load()
    setCurrentAyahIndex(-1)
  }, [mode, surah, currentReciter])

  useEffect(() => {
    if (mode !== 'listen-read' || !activeAyahRef.current) return
    activeAyahRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [currentAyahIndex, mode])

  function onAudioTimeUpdate() {
    if (!audioRef.current || !surah) return
    const nextAyahIndex = getAyahIndexFromTime(
      surah.ayahs,
      audioRef.current.currentTime,
      audioRef.current.duration,
    )
    setCurrentAyahIndex(nextAyahIndex)
  }

  function AyahRow({ index, style, data }) {
    const ayah = data[index]
    const active = mode === 'listen-read' && index === currentAyahIndex

    return (
      <div
        style={style}
        className={`ayah-row ${active ? 'ayah-active' : ''}`}
        ref={active ? activeAyahRef : null}
      >
        <span className="ayah-number">{ayah.numberInSurah}</span>
        <p className="ayah-text">{ayah.text}</p>
      </div>
    )
  }

  return (
    <div className={`app ${theme}`}>
      <header className="topbar">
        <h1>Quran (Offline)</h1>
        <div className="controls">
          <label>
            Theme
            <select value={theme} onChange={(e) => setTheme(e.target.value)}>
              {THEMES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
          <label>
            Select Reciter
            <select
              value={currentReciter}
              disabled={!reciters.length || mode === 'read'}
              onChange={(e) => setCurrentReciter(e.target.value)}
            >
              {reciters.map((reciter) => (
                <option key={reciter} value={reciter}>
                  {reciter.replaceAll('_', ' ')}
                </option>
              ))}
            </select>
          </label>
          <label>
            Surah
            <select value={currentSurah} onChange={(e) => setCurrentSurah(Number(e.target.value))}>
              {quran.map((s) => (
                <option key={s.number} value={s.number}>
                  {s.number}. {s.englishName} ({s.name})
                </option>
              ))}
            </select>
          </label>
        </div>
      </header>

      {loading ? (
        <div className="center">Loading local Quran data...</div>
      ) : (
        <>
          <AnimatePresence>
            {!mode && (
              <motion.div
                className="splash"
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -18 }}
              >
                <motion.button
                  className="entry-card"
                  whileHover={{ scale: 1.03 }}
                  onClick={() => {
                    setMode('read')
                    setIsPlaying(false)
                  }}
                >
                  <h2>Read Mode</h2>
                  <p>Distraction-free Quran reading. Audio disabled.</p>
                </motion.button>
                <motion.button
                  className="entry-card"
                  whileHover={{ scale: 1.03 }}
                  onClick={() => setMode('listen-read')}
                >
                  <h2>Listen & Read</h2>
                  <p>Synchronized playback with ayah highlighting.</p>
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>

          {mode && surah && (
            <main className="reader-layout">
              {mode === 'listen-read' ? (
                <section className="audio-panel">
                  <audio
                    ref={audioRef}
                    controls
                    onTimeUpdate={onAudioTimeUpdate}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    onEnded={() => setIsPlaying(false)}
                  />
                  <p className="playback">Status: {isPlaying ? 'Playing' : 'Paused'}</p>
                  <p className="playback">Source: {buildAudioPath(currentReciter, surah.number)}</p>
                </section>
              ) : (
                <section className="audio-panel muted">
                  <p>Read mode active — audio listeners disabled.</p>
                </section>
              )}

              <section className="quran-panel">
                <h2>
                  {surah.number}. {surah.englishName} - {surah.name}
                </h2>
                <List
                  className="ayah-list"
                  height={Math.min(window.innerHeight - 220, 620)}
                  width="100%"
                  itemCount={surah.ayahs.length}
                  itemSize={86}
                  itemData={surah.ayahs}
                >
                  {AyahRow}
                </List>
              </section>
            </main>
          )}
        </>
      )}
    </div>
  )
}
