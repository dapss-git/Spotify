// ═══════════════════════════════════════
//  components/music-card.js
// ═══════════════════════════════════════

/**
 * Build a single music card HTML string
 * @param {Object} track
 * @param {number} index
 * @returns {string} HTML string
 */
export function buildMusicCard(track, index) {
  const title  = escHtml(track.name   || track.title   || 'Unknown');
  const artist = escHtml(track.artists || track.artist  || 'Unknown');
  const cover  = track.cover || 'https://placehold.co/300x300/131525/00e5a0?text=♪';

  return `
    <div class="music-card" id="card-${index}" onclick="window.__playCard(${index})">
      <div class="card-thumb-wrap">
        <img
          src="${cover}"
          alt="${title}"
          loading="lazy"
          onerror="this.src='https://placehold.co/300x300/131525/00e5a0?text=♪'"
        >
        <div class="card-play-overlay">
          <div class="play-circle">
            <i class="fas fa-play" style="margin-left:2px"></i>
          </div>
        </div>
      </div>
      <div class="card-info">
        <div class="card-title">${title}</div>
        <div class="card-artist">${artist}</div>
      </div>
    </div>
  `;
}

function escHtml(s) {
  if (!s) return '';
  return String(s).replace(/[&<>'"]/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  })[c]);
}
