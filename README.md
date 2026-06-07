# MusixLyric Pro 🎵

> Streaming musik + lirik sync, tampilan modern, multi-file structure.

## Struktur Project

```
MusixLyric-Pro/
├── index.html              ← Halaman utama (search + player)
├── pages/
│   └── lyrics.html         ← Halaman lirik standalone
├── assets/
│   ├── css/
│   │   ├── main.css        ← Design tokens, layout, cards
│   │   ├── player.css      ← Player bar styles
│   │   └── animations.css  ← Semua keyframes & animasi
│   └── js/
│       ├── api.js          ← Semua API calls (search, download, lyrics, telegram)
│       ├── player.js       ← Audio engine (play, pause, next, prev, progress)
│       ├── lyrics.js       ← Parse LRC, render, sync highlight
│       └── app.js          ← Controller utama (search, grid, modal)
├── components/
│   ├── navbar.js           ← Navbar component
│   ├── music-card.js       ← Card builder helper
│   └── modal.js            ← Modal builder helper
└── README.md
```

## Fitur

- 🔍 **Search** lagu & artis dari Spotify
- 🎵 **Putar** langsung dengan custom player
- ⏭ **Next / Prev** track
- 📃 **Lirik sync** — highlight otomatis sesuai posisi audio
- 📋 **Salin lirik** sekali klik
- ⬇️ **Download MP3**
- 🔔 **Notif Telegram** saat ada yang play
- 💅 **Dark glassmorphism UI** dengan animasi modern

## API yang digunakan

| Layanan     | Endpoint                                      |
|-------------|-----------------------------------------------|
| Search      | `api.theresav.biz.id/search/spotify`          |
| Download    | `api.theresav.biz.id/download/spotify`        |
| Lyrics      | `api-varhad.my.id/tools/lyrics`               |
| Telegram    | `api.telegram.org/bot{TOKEN}/sendMessage`     |

## Deploy ke Vercel

1. Upload folder `MusixLyric-Pro/` ke GitHub
2. Connect ke Vercel → Import repo
3. Settings: **Framework Preset = Other**, Output Directory = `/`
4. Deploy!

> Karena menggunakan ES Modules (`type="module"`), pastikan deploy via server (Vercel/Netlify).  
> Tidak bisa dibuka langsung dengan `file://` di browser.

## Konfigurasi (di `assets/js/api.js`)

```js
TG_TOKEN: 'ISI_BOT_TOKEN_KAMU',
TG_OWNER: 'ISI_CHAT_ID_KAMU',
KEY:      'daps_apikey',
```
