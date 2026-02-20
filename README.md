# Offline Quran Web App

A client-side React app that reads Quran text from local `public/quran.json` and local recitations from `public/audio/[Qari_Name]/[Surah_Number].mp3`.

## Features
- Split splash entry (Read Mode / Listen & Read Mode) with Framer Motion transitions.
- Dynamic reciter dropdown using local `public/audio/reciters.json` generated from available audio folders.
- Surah-based player path resolution (`/audio/{reciter}/{surah}.mp3`).
- Real-time ayah highlighting on `timeupdate` with smooth glow transitions.
- Auto-scroll of active ayah to center view.
- Dark / Light / Parchment themes.
- Virtualized ayah list via `react-window`.

## Run
```bash
npm install
npm run dev
```

## Notes
- Replace `public/quran.json` with your full Mushaf dataset using the same shape.
- Add real MP3 files under each reciter folder (`001.mp3` ... `114.mp3`).
- Optional per-ayah timing keys (`start`, `end`) improve synchronization accuracy.

## Update reciter manifest
```bash
npm run scan:reciters
```
