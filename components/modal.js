// ═══════════════════════════════════════
//  components/modal.js
// ═══════════════════════════════════════

/**
 * Build the lyrics modal HTML and append to body
 */
export function buildLyricsModal() {
  if (document.getElementById('lyricsModal')) return; // already exists

  const html = `
    <div id="lyricsModal" class="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="modalSongName">
      <div class="modal-panel">
        <div class="modal-header">
          <div class="modal-track-info">
            <div id="modalSongName" class="modal-song-title">—</div>
            <div id="modalArtist" class="modal-artist-name">—</div>
          </div>
          <button id="modalClose" class="modal-close-btn" aria-label="Tutup">
            <i class="fas fa-xmark"></i>
          </button>
        </div>
        <div class="modal-actions">
          <button id="copyBtn" class="modal-btn copy-btn">
            <i class="fas fa-copy"></i> Salin Lirik
          </button>
          <button id="retryBtn" class="modal-btn retry-btn">
            <i class="fas fa-rotate-right"></i> Cari Lagi
          </button>
        </div>
        <div id="lyricsScroll" class="lyrics-scroll">
          <div class="loading-state">
            <div class="spin-ring"></div>
            <p class="loading-text">Putar lagu dulu...</p>
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', html);
}
