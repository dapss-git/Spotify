// ═══════════════════════════════════════
//  app.js — Main application controller
// ═══════════════════════════════════════

import { searchTracks }      from './api.js';
import { initPlayer, playTrack, setPlaylist, getPlaylist, getCurrentIndex, getAudio, setLyricsModalOpen } from './player.js';
import { loadLyrics, renderLyrics, updateActiveLyric, getLyricsText, hasSyncedLyrics } from './lyrics.js';

/* ──────────────────────────────────────
   DOM REFS
────────────────────────────────────── */
const $ = id => document.getElementById(id);

const D = {
  searchInput:   $('searchInput'),
  searchBtn:     $('searchBtn'),
  resultArea:    $('resultArea'),
  resultTitle:   $('resultTitle'),
  resultCount:   $('resultCount'),
  musicGrid:     $('musicGrid'),
  artistChips:   $('artistChips'),
  emptyState:    $('emptyState'),

  // Player
  playerBar:     $('playerBar'),
  thumbImg:      $('playerThumb'),
  songName:      $('playerSongName'),
  artistName:    $('playerArtistName'),
  playPause:     $('playPauseBtn'),
  prevBtn:       $('prevBtn'),
  nextBtn:       $('nextBtn'),
  progressTrack: $('progressTrack'),
  progressFill:  $('progressFill'),
  currentTime:   $('currentTime'),
  durationTime:  $('durationTime'),
  downloadBtn:   $('downloadBtn'),
  lyricsBtn:     $('lyricsBtn'),

  // Modal
  lyricsModal:   $('lyricsModal'),
  modalSongName: $('modalSongName'),
  modalArtist:   $('modalArtist'),
  modalClose:    $('modalClose'),
  lyricsScroll:  $('lyricsScroll'),
  copyBtn:       $('copyBtn'),
  retryBtn:      $('retryBtn'),
};

/* ──────────────────────────────────────
   INIT
────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  initPlayer(
    {
      playerBar:     D.playerBar,
      thumbImg:      D.thumbImg,
      songName:      D.songName,
      artistName:    D.artistName,
      playPause:     D.playPause,
      prevBtn:       D.prevBtn,
      nextBtn:       D.nextBtn,
      progressTrack: D.progressTrack,
      progressFill:  D.progressFill,
      currentTime:   D.currentTime,
      durationTime:  D.durationTime,
      downloadBtn:   D.downloadBtn,
      lyricsContainer: D.lyricsScroll,
    },
    { onTrackChange: handleTrackChange }
  );

  // Search
  D.searchBtn.addEventListener('click', doSearch);
  D.searchInput.addEventListener('keydown', e => { if (e.key === 'Enter') doSearch(); });

  // Modal
  D.lyricsBtn?.addEventListener('click', openLyricsModal);
  D.thumbImg?.addEventListener('click', openLyricsModal);
  D.songName?.addEventListener('click', openLyricsModal);
  D.modalClose?.addEventListener('click', closeLyricsModal);
  D.lyricsModal?.addEventListener('click', e => { if (e.target === D.lyricsModal) closeLyricsModal(); });

  // Copy / retry
  D.copyBtn?.addEventListener('click', copyLyrics);
  D.retryBtn?.addEventListener('click', retryLyrics);

  // Keyboard close
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeLyricsModal(); });
});

/* ──────────────────────────────────────
   SEARCH
────────────────────────────────────── */
async function doSearch() {
  const q = D.searchInput.value.trim();
  if (!q) return;

  D.emptyState.style.display = 'none';
  D.resultArea.style.display = 'block';
  D.artistChips.style.display = 'none';
  D.artistChips.innerHTML = '';
  D.resultTitle.textContent = `"${q}"`;
  D.resultCount.textContent = '';
  showGridLoading();

  try {
    const tracks = await searchTracks(q);
    setPlaylist(tracks);

    D.resultCount.textContent = `${tracks.length} lagu ditemukan`;

    // Artist chips
    const artists = [...new Set(tracks.map(t => t.artists || t.artist).filter(Boolean))].slice(0, 8);
    if (artists.length > 0) {
      D.artistChips.style.display = 'flex';
      D.artistChips.innerHTML = artists.map(a => `
        <div class="artist-chip" onclick="window.__searchArtist('${escHtml(a)}')">
          <i class="fas fa-user" style="font-size:0.65rem;opacity:0.5"></i> ${escHtml(a)}
        </div>
      `).join('');
    }

    if (tracks.length > 0) {
      renderGrid(tracks);
    } else {
      showGridEmpty();
    }
  } catch (err) {
    showGridError(err.message);
  }
}

window.__searchArtist = (name) => {
  D.searchInput.value = name;
  doSearch();
};

/* ──────────────────────────────────────
   GRID
────────────────────────────────────── */
function renderGrid(tracks) {
  D.musicGrid.innerHTML = tracks.map((t, i) => {
    const title  = escHtml(t.name   || t.title   || 'Unknown');
    const artist = escHtml(t.artists || t.artist  || 'Unknown');
    const cover  = t.cover || 'https://placehold.co/300x300/131525/00e5a0?text=♪';
    return `
      <div class="music-card" id="card-${i}" onclick="window.__playCard(${i})">
        <div class="card-thumb-wrap">
          <img src="${cover}" alt="${title}" loading="lazy" onerror="this.src='https://placehold.co/300x300/131525/00e5a0?text=♪'">
          <div class="card-play-overlay">
            <div class="play-circle"><i class="fas fa-play" style="margin-left:2px"></i></div>
          </div>
        </div>
        <div class="card-info">
          <div class="card-title">${title}</div>
          <div class="card-artist">${artist}</div>
        </div>
      </div>
    `;
  }).join('');
}

window.__playCard = (index) => {
  // Remove active class from all cards
  document.querySelectorAll('.music-card').forEach(c => c.classList.remove('playing'));
  const card = document.getElementById(`card-${index}`);
  if (card) card.classList.add('playing');
  playTrack(index);
};

function handleTrackChange(track, index) {
  // Sync card highlights
  document.querySelectorAll('.music-card').forEach(c => c.classList.remove('playing'));
  const card = document.getElementById(`card-${index}`);
  if (card) card.classList.add('playing');
}

function showGridLoading() {
  D.musicGrid.innerHTML = `
    <div style="grid-column:1/-1;text-align:center;padding:60px;color:var(--text-muted)">
      <div class="spin-ring" style="margin:0 auto 16px"></div>
      <p style="font-size:0.82rem">Mencari lagu...</p>
    </div>
  `;
}

function showGridEmpty() {
  D.musicGrid.innerHTML = `
    <div style="grid-column:1/-1" class="empty-state">
      <i class="fas fa-search empty-icon"></i>
      <h3>Tidak ada hasil</h3>
      <p>Coba kata kunci yang berbeda</p>
    </div>
  `;
}

function showGridError(msg) {
  D.musicGrid.innerHTML = `
    <div style="grid-column:1/-1" class="empty-state">
      <i class="fas fa-triangle-exclamation empty-icon" style="color:var(--accent2)"></i>
      <h3>Terjadi kesalahan</h3>
      <p style="color:var(--text-muted);font-size:0.75rem">${escHtml(msg)}</p>
    </div>
  `;
}

/* ──────────────────────────────────────
   LYRICS MODAL
────────────────────────────────────── */
async function openLyricsModal() {
  const idx   = getCurrentIndex();
  const track = getPlaylist()[idx];
  if (!track) return;

  const title  = track.name   || track.title  || 'Unknown';
  const artist = track.artists || track.artist || 'Unknown';

  D.modalSongName.textContent = title;
  D.modalArtist.textContent   = artist;
  D.lyricsModal.classList.add('open');
  setLyricsModalOpen(true);

  D.lyricsScroll.innerHTML = `
    <div class="loading-state">
      <div class="spin-ring"></div>
      <p class="loading-text">Memuat lirik...</p>
    </div>
  `;

  await loadLyrics(title, artist);
  renderLyrics(D.lyricsScroll);

  // Sync to current audio position
  const au = getAudio();
  if (au && hasSyncedLyrics()) {
    updateActiveLyric(D.lyricsScroll, au.currentTime);
  }
}

function closeLyricsModal() {
  D.lyricsModal.classList.remove('open');
  setLyricsModalOpen(false);
}

async function retryLyrics() {
  const idx   = getCurrentIndex();
  const track = getPlaylist()[idx];
  if (!track) return;

  D.lyricsScroll.innerHTML = `
    <div class="loading-state">
      <div class="spin-ring"></div>
      <p class="loading-text">Mencari lirik lain...</p>
    </div>
  `;

  const title  = track.name   || track.title  || '';
  const artist = track.artists || track.artist || '';
  await loadLyrics(title, artist);
  renderLyrics(D.lyricsScroll);
}

function copyLyrics() {
  const text = getLyricsText();
  if (!text) { showToast('❌ Tidak ada lirik'); return; }
  navigator.clipboard.writeText(text)
    .then(() => showToast('✅ Lirik tersalin!'))
    .catch(() => {
      const ta = Object.assign(document.createElement('textarea'), {
        value: text, style: 'position:fixed;top:-9999px'
      });
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
      showToast('✅ Lirik tersalin!');
    });
}

/* ──────────────────────────────────────
   TOAST
────────────────────────────────────── */
function showToast(msg) {
  document.querySelectorAll('.toast').forEach(t => t.remove());
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = msg;
  document.body.appendChild(el);
  requestAnimationFrame(() => el.classList.add('show'));
  setTimeout(() => el.remove(), 2600);
}

/* ──────────────────────────────────────
   UTILS
────────────────────────────────────── */
function escHtml(s) {
  if (!s) return '';
  return String(s).replace(/[&<>'"]/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  })[c]);
}
