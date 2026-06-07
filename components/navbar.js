// ═══════════════════════════════════════
//  components/navbar.js
// ═══════════════════════════════════════

/**
 * Inject the navbar into a target element.
 * @param {string|HTMLElement} target - CSS selector or element
 * @param {Object} opts
 * @param {string} opts.activeLink - 'home' | 'lyrics'
 */
export function renderNavbar(target, opts = {}) {
  const el = typeof target === 'string' ? document.querySelector(target) : target;
  if (!el) return;

  const rootPath = el.dataset.root || '';

  el.innerHTML = `
    <nav class="navbar">
      <a class="nav-logo" href="${rootPath}index.html">
        <div class="logo-icon"><i class="fas fa-waveform-lines"></i></div>
        <span class="logo-text">MusixLyric</span>
      </a>
      <div class="nav-right">
        <div class="nav-badge">
          <span class="live-dot"></span>
          LIVE
        </div>
      </div>
    </nav>
  `;
}

// Auto-init if the element exists on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  const slot = document.getElementById('navbarSlot');
  if (slot) renderNavbar(slot);
});
