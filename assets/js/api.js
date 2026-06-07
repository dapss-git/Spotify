// ═══════════════════════════════════════
//  api.js — All external API calls
// ═══════════════════════════════════════

const API = {
  SEARCH:   'https://api.theresav.biz.id/search/spotify',
  DOWNLOAD: 'https://api.theresav.biz.id/download/spotify',
  LYRICS:   'https://api-varhad.my.id/tools/lyrics',
  KEY:      'daps_apikey',

  TG_TOKEN: '8355084238:AAHVIGHigd8UUB6sONZatv3ue1i2PSOlHvU',
  TG_OWNER: '8136654727',
};

/**
 * Search Spotify tracks by query
 * @param {string} query
 * @returns {Promise<Array>} tracks array
 */
export async function searchTracks(query) {
  const url = `${API.SEARCH}?q=${encodeURIComponent(query)}&apikey=${API.KEY}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Search failed: ${res.status}`);
  const data = await res.json();
  if (!data.status || !Array.isArray(data.result)) return [];
  return data.result;
}

/**
 * Download (get MP3 URL) from Spotify URL
 * @param {string} spotifyUrl
 * @returns {Promise<string|null>} mp3 download URL
 */
export async function getDownloadUrl(spotifyUrl) {
  const url = `${API.DOWNLOAD}?url=${encodeURIComponent(spotifyUrl)}&apikey=${API.KEY}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed: ${res.status}`);
  const data = await res.json();
  if (data.status && data.result?.downloadUrl) return data.result.downloadUrl;
  return null;
}

/**
 * Fetch lyrics for a track (with fallback)
 * @param {string} title
 * @param {string} artist
 * @returns {Promise<{plainLyrics: string, syncedLyrics: string}|null>}
 */
export async function fetchLyrics(title, artist) {
  const tryFetch = async (query) => {
    const url = `${API.LYRICS}?title=${encodeURIComponent(query)}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.status && Array.isArray(data.result) && data.result.length > 0) {
      return data.result;
    }
    return null;
  };

  // Try combined query first, then title only
  let results = await tryFetch(`${title} ${artist}`);
  if (!results) results = await tryFetch(title);
  if (!results) return null;

  // Score and pick best match
  let best = results[0];
  let bestScore = 0;

  for (const item of results) {
    let score = 0;
    const a = (item.artistName || '').toLowerCase();
    const t = (item.name || item.trackName || '').toLowerCase();
    if (a.includes(artist.toLowerCase())) score += 10;
    if (t.includes(title.toLowerCase())) score += 5;
    if (score > bestScore) { bestScore = score; best = item; }
  }

  return {
    plainLyrics:  best.plainLyrics  || '',
    syncedLyrics: best.syncedLyrics || '',
  };
}

/**
 * Send Telegram notification when a song is played
 */
export async function notifyTelegram(title, artist) {
  const waktu = new Date().toLocaleString('id-ID');
  const device = /Android/i.test(navigator.userAgent) ? '📱 Android'
               : /iPhone/i.test(navigator.userAgent) ? '📱 iPhone'
               : /Windows/i.test(navigator.userAgent) ? '💻 Windows'
               : '💻 Unknown';
  const text = `🎵 *ADA YANG PLAY LAGU!*\n\n📌 *Judul:* ${title}\n🎤 *Artis:* ${artist}\n${device}\n⏰ *Waktu:* ${waktu}`;
  try {
    await fetch(`https://api.telegram.org/bot${API.TG_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: API.TG_OWNER, text, parse_mode: 'Markdown' }),
    });
  } catch (e) { /* silent fail */ }
}
