import { readdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

const audioRoot = path.resolve('public/audio')
const entries = await readdir(audioRoot, { withFileTypes: true })
const reciters = entries
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort((a, b) => a.localeCompare(b))

await writeFile(path.join(audioRoot, 'reciters.json'), JSON.stringify(reciters, null, 2) + '\n')
console.log(`Updated public/audio/reciters.json with ${reciters.length} reciters.`)
