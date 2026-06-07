// ═══════════════════════════════════════
//  player.js — Audio playback engine
// ═══════════════════════════════════════

import { getDownloadUrl, notifyTelegram } from './api.js';
import { loadLyrics, updateActiveLyric, hasSyncedLyrics } from './lyrics.js';

// State
let audio        = null;
let isPlaying    = false;
let playlist     = [];
let currentIndex = 0;
let onTrackChange = null; // callback(track, index)
let lyricsContainerEl = null;
let lyricsModalOpen   = false;

// DOM refs (set during init)
let els = {};

/* ──────────────────────────────────────
   INIT
────────────────────────────────────── */
export function initPlayer(domRefs, callbacks) {
  els = domRefs;
  if (callbacks?.onTrackChange) onTrackChange = callbacks.onTrackChange;

  // Controls
  els.playPause.addEventListener('click', togglePlayPause);
  els.prevBtn.addEventListener('click', playPrev);
  els.nextBtn.addEventListener('click', playNext);

  // Progress seek
  els.progressTrack.addEventListener('click', handleSeek);

  // Lyrics modal ref
  lyricsContainerEl = els.lyricsContainer || null;
}

export function setLyricsModalOpen(open) { lyricsModalOpen = open; }
export function setPlaylist(tracks) { playlist = tracks; }
export function getPlaylist()       { return playlist; }
export function getCurrentIndex()   { return currentIndex; }
export function getCurrentTrack()   { return playlist[currentIndex] || null; }
export function getAudio()          { return audio; }

/* ──────────────────────────────────────
   PLAY TRACK
────────────────────────────────────── */
export async function playTrack(index) {
  if (!playlist[index]) return;
  currentIndex = index;

  const track  = playlist[index];
  const title  = track.name  || track.title  || 'Unknown';
  const artist = track.artists || track.artist || 'Unknown';
  const cover  = track.cover || '';
  const spotUrl = track.spotifyUrl || track.spotify_url || '';

  // Update UI immediately
  updatePlayerUI({ title, artist, cover, loading: true });
  if (onTrackChange) onTrackChange(track, index);

  // Prefetch lyrics in background
  loadLyrics(title, artist);
  notifyTelegram(title, artist);

  try {
    const mp3Url = await getDownloadUrl(spotUrl);
    if (!mp3Url) throw new Error('No download URL');

    // Destroy old audio cleanly
    if (audio) {
      audio.pause();
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.src = '';
      audio = null;
    }

    // Create fresh audio — NO crossOrigin (breaks third-party APIs)
    audio = new Audio();
    audio.preload = 'auto';
    setupAudioEvents();
    audio.src = mp3Url;

    // Wait until browser has enough data to play
    await new Promise((resolve, reject) => {
      const onCanPlay = () => {
        audio.removeEventListener('canplay', onCanPlay);
        audio.removeEventListener('error',   onError);
        resolve();
      };
      const onError = (e) => {
        audio.removeEventListener('canplay', onCanPlay);
        audio.removeEventListener('error',   onError);
        reject(new Error('Audio load error'));
      };
      audio.addEventListener('canplay', onCanPlay);
      audio.addEventListener('error',   onError);
      audio.load();
    });

    await audio.play();
    isPlaying = true;
    updatePlayPauseBtn(true);
    els.playerBar.classList.add('is-playing');

    // Download link
    if (els.downloadBtn) {
      els.downloadBtn.href = mp3Url;
      els.downloadBtn.download = `${title} - ${artist}.mp3`;
    }

  } catch (err) {
    console.error('Player error:', err);
    updatePlayPauseBtn(false);
    showPlayerError();
  }
}

/* ──────────────────────────────────────
   CONTROLS
────────────────────────────────────── */
export function togglePlayPause() {
  if (!audio) return;
  if (isPlaying) {
    audio.pause();
    isPlaying = false;
    updatePlayPauseBtn(false);
    els.playerBar.classList.remove('is-playing');
  } else {
    audio.play();
    isPlaying = true;
    updatePlayPauseBtn(true);
    els.playerBar.classList.add('is-playing');
  }
}

export function playNext() {
  const next = currentIndex + 1 < playlist.length ? currentIndex + 1 : 0;
  playTrack(next);
}

export function playPrev() {
  if (audio && audio.currentTime > 3) {
    audio.currentTime = 0;
    return;
  }
  const prev = currentIndex > 0 ? currentIndex - 1 : playlist.length - 1;
  playTrack(prev);
}

function handleSeek(e) {
  if (!audio || !audio.duration) return;
  const rect = e.currentTarget.getBoundingClientRect();
  const pct  = (e.clientX - rect.left) / rect.width;
  audio.currentTime = pct * audio.duration;
}

/* ──────────────────────────────────────
   AUDIO EVENTS
────────────────────────────────────── */
function setupAudioEvents() {
  // Named refs so we can remove them later
  audio.addEventListener('timeupdate', onTimeUpdate);
  audio.addEventListener('ended',      playNext);
  audio.addEventListener('error',      showPlayerError);
  audio.addEventListener('waiting',    () => updatePlayPauseBtn('loading'));
  audio.addEventListener('playing',    () => {
    isPlaying = true;
    updatePlayPauseBtn(true);
    els.playerBar.classList.add('is-playing');
  });
  audio.addEventListener('pause', () => {
    // Only update UI if pause wasn't triggered by track change
    if (audio && audio.src) {
      isPlaying = false;
      updatePlayPauseBtn(false);
      els.playerBar.classList.remove('is-playing');
    }
  });
}

function onTimeUpdate() {
  if (!audio.duration) return;
  const pct = (audio.currentTime / audio.duration) * 100;
  els.progressFill.style.width = pct + '%';
  els.currentTime.textContent  = formatTime(audio.currentTime);
  els.durationTime.textContent = formatTime(audio.duration);

  // Sync lyrics if modal is open
  if (lyricsModalOpen && lyricsContainerEl && hasSyncedLyrics()) {
    updateActiveLyric(lyricsContainerEl, audio.currentTime);
  }
}

/* ──────────────────────────────────────
   UI HELPERS
────────────────────────────────────── */
function updatePlayerUI({ title, artist, cover, loading }) {
  els.playerBar.classList.add('visible');
  els.playerBar.style.display = 'flex';
  els.songName.textContent   = title;
  els.artistName.textContent = artist;
  els.thumbImg.src           = cover || 'https://placehold.co/48x48/131525/00e5a0?text=♪';
  els.progressFill.style.width = '0%';
  els.currentTime.textContent  = '0:00';
  els.durationTime.textContent = '0:00';

  if (loading) updatePlayPauseBtn('loading');
}

function updatePlayPauseBtn(state) {
  const icon = els.playPause.querySelector('i');
  if (!icon) return;
  if (state === 'loading') {
    icon.className = 'fas fa-circle-notch fa-spin';
  } else if (state === true) {
    icon.className = 'fas fa-pause';
  } else {
    icon.className = 'fas fa-play';
  }
}

function showPlayerError() {
  updatePlayPauseBtn(false);
  isPlaying = false;
  els.playerBar.classList.remove('is-playing');
}

function formatTime(secs) {
  if (!secs || isNaN(secs)) return '0:00';
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}
