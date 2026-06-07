// ═══════════════════════════════════════
//  lyrics.js — Lyrics parsing & display
// ═══════════════════════════════════════

import { fetchLyrics } from './api.js';

let plainLyrics      = '';
let syncedLyrics     = []; // [{time, text}]
let activeLyricIndex = -1;

/**
 * Parse LRC-format synced lyrics string into timed array
 * @param {string} lrcText
 * @returns {Array<{time: number, text: string}>}
 */
export function parseSyncedLyrics(lrcText) {
  if (!lrcText) return [];
  const timeRegex = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/;
  return lrcText
    .split('\n')
    .map(line => {
      const match = line.match(timeRegex);
      if (!match) return null;
      const min  = parseInt(match[1]);
      const sec  = parseInt(match[2]);
      const ms   = parseInt(match[3].padEnd(3, '0'));
      const time = min * 60 + sec + ms / 1000;
      const text = line.replace(timeRegex, '').trim();
      return text ? { time, text } : null;
    })
    .filter(Boolean);
}

/**
 * Load lyrics for the current track and store them
 * @param {string} title
 * @param {string} artist
 */
export async function loadLyrics(title, artist) {
  const result = await fetchLyrics(title, artist);
  if (result) {
    plainLyrics  = result.plainLyrics;
    syncedLyrics = parseSyncedLyrics(result.syncedLyrics);
  } else {
    plainLyrics  = '';
    syncedLyrics = [];
  }
}

/**
 * Render lyrics into the modal scroll container
 * @param {HTMLElement} container
 */
export function renderLyrics(container) {
  activeLyricIndex = -1;

  if (syncedLyrics.length > 0) {
    container.innerHTML = syncedLyrics.map(line => `
      <div class="lyric-line" data-time="${line.time}">${escHtml(line.text)}</div>
    `).join('');
    return;
  }

  if (plainLyrics) {
    container.innerHTML = plainLyrics
      .split('\n')
      .map(line => `<div class="lyric-line">${escHtml(line) || '<br>'}</div>`)
      .join('');
    return;
  }

  container.innerHTML = `
    <div class="loading-state">
      <i class="fas fa-music" style="font-size:2rem;opacity:0.2;color:var(--accent)"></i>
      <p class="loading-text">Lirik tidak tersedia untuk lagu ini</p>
    </div>
  `;
}

/**
 * Update active lyric highlight based on audio currentTime
 * @param {HTMLElement} container
 * @param {number} currentTime
 */
export function updateActiveLyric(container, currentTime) {
  if (!syncedLyrics.length) return;

  let newIndex = -1;
  for (let i = 0; i < syncedLyrics.length; i++) {
    if (currentTime >= syncedLyrics[i].time) newIndex = i;
    else break;
  }

  if (newIndex === activeLyricIndex) return;
  activeLyricIndex = newIndex;

  const lines = container.querySelectorAll('.lyric-line');
  lines.forEach(l => l.classList.remove('active'));

  if (newIndex >= 0 && newIndex < lines.length) {
    lines[newIndex].classList.add('active');
    lines[newIndex].scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

/**
 * Get plain text of lyrics for copying
 * @returns {string}
 */
export function getLyricsText() {
  if (syncedLyrics.length > 0) return syncedLyrics.map(l => l.text).join('\n');
  return plainLyrics;
}

/**
 * Check if synced lyrics are available
 */
export function hasSyncedLyrics() { return syncedLyrics.length > 0; }

function escHtml(s) {
  if (!s) return '';
  return s.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]);
}
