const CARD_VERSION = '1.2.0-dev';
// eslint-disable-next-line no-console
console.info(`%c SAUGROBOTER-CARD %c v${CARD_VERSION} `, 'color: white; background: #00bfa5; font-weight: 700;', 'color: #00bfa5; background: white; font-weight: 700;');

class SaugroboterCard extends HTMLElement {
  setConfig(config) {
    if (!config.entities || !Array.isArray(config.entities)) {
      throw new Error('saugroboter-card-dev: "entities" list is required');
    }
    this._config = config;
    // `look: solid|glass` in the config wins; otherwise the theme decides
    // via the CSS variable --lg-look (see _effectiveLook / _checkLook).
    this._solid = this._effectiveLook(config) === 'solid';
    this._expanded = this._expanded || new Set();
    // Shadow DOM keeps the card's generic class names (.card, .btn, .name,
    // .map ...) from leaking into or being styled by neighbouring cards.
    if (!this.shadowRoot) this.attachShadow({ mode: 'open' });
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    // Theme switches arrive via hass.themes - only then re-read --lg-look
    // (no getComputedStyle on every hass tick).
    const th = hass && hass.themes;
    const themeSig = th ? th.theme + '|' + th.darkMode : '';
    if (th !== this._themesRef || themeSig !== this._themeSig) {
      this._themesRef = th;
      this._themeSig = themeSig;
      this._scheduleLookCheck();
    }
    this._updateCards();
  }

  connectedCallback() {
    if (!this._onThemeChanged) this._onThemeChanged = () => this._scheduleLookCheck();
    window.addEventListener('lg-theme-changed', this._onThemeChanged);
    this._scheduleLookCheck();
  }

  disconnectedCallback() {
    if (this._onThemeChanged) window.removeEventListener('lg-theme-changed', this._onThemeChanged);
    cancelAnimationFrame(this._lookRaf);
  }

  // Effective look: `look: solid|glass` in the config, else the theme's
  // --lg-look variable on this element (quotes tolerated), else glass.
  _effectiveLook(config) {
    const own = config && config.look;
    if (own === 'solid' || own === 'glass') return own;
    let v = '';
    try { v = getComputedStyle(this).getPropertyValue('--lg-look'); } catch (e) { v = ''; }
    v = String(v || '').trim().replace(/^["']+|["']+$/g, '').trim().toLowerCase();
    return v === 'solid' ? 'solid' : 'glass';
  }

  // Re-read the theme now and once more on the next frame (the theme may
  // only apply its variables after this element got connected / hass).
  _scheduleLookCheck() {
    this._checkLook();
    cancelAnimationFrame(this._lookRaf);
    this._lookRaf = requestAnimationFrame(() => this._checkLook());
  }

  _checkLook() {
    const c = this._config;
    if (!c || c.look === 'solid' || c.look === 'glass' || !this.shadowRoot) return;
    const solid = this._effectiveLook(c) === 'solid';
    if (solid === this._solid) return;
    // Only the class depends on the look - no rebuild needed.
    this._solid = solid;
    const root = this.shadowRoot.querySelector('.cards');
    if (root) root.classList.toggle('solid', solid);
  }

  getCardSize() {
    return (this._config?.entities?.length || 1) * 2 + 1;
  }

  _callService(domain, service, entityId) {
    if (!this._hass) return;
    this._hass.callService(domain, service, { entity_id: entityId });
  }

  _icon(name) {
    const icons = {
      play: '<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M7 4 L20 12 L7 20 Z"/></svg>',
      pause: '<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>',
      stop: '<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><rect x="5" y="5" width="14" height="14" rx="2"/></svg>',
      locate: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M12 21s-7-6.2-7-11.3A7 7 0 0 1 12 3a7 7 0 0 1 7 6.7C19 14.8 12 21 12 21Z"/><circle cx="12" cy="9.5" r="2.3" fill="currentColor" stroke="none"/></svg>',
      dock: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M4 11 L12 4 L20 11" stroke-linecap="round" stroke-linejoin="round"/><path d="M6 10 V19 a1 1 0 0 0 1 1 H17 a1 1 0 0 0 1 -1 V10" stroke-linejoin="round"/></svg>',
      disable: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="7.5" stroke="currentColor" stroke-width="1.6"/><circle cx="12" cy="12" r="2.2" fill="currentColor"/><path d="M9 4 H15" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><line x1="4" y1="3" x2="20" y2="21" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
      robot: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="8.5" stroke="currentColor" stroke-width="1.6"/><circle cx="12" cy="12" r="2.6" fill="currentColor"/><circle cx="12" cy="6" r="1" fill="currentColor"/></svg>',
      charging: '<svg width="9" height="9" viewBox="0 0 24 24" fill="none"><path d="M13 2 L4 14 h6 l-1 8 l9 -12 h-6 Z" fill="rgba(255,255,255,0.6)"/></svg>'
    };
    return icons[name] || '';
  }

  _render() {
    const rows = this._config.entities.map((e, i) => `
      <div class="card" data-idx="${i}">
        <div class="card-inner">
          <div class="left-col">
            <div class="row">
              <div class="avatar">
                <div class="avatar-glow" data-role="avatarglow"></div>
                <div class="avatar-circle" data-role="avatarcircle">${this._icon('robot')}</div>
                <div class="badge">${this._icon('charging')}</div>
              </div>
              <div class="meta">
                <span class="name" data-role="name">${e.name || e.entity}</span>
                <span class="status" data-role="status">&#8211;</span>
              </div>
            </div>
            <div class="buttons">
              <div class="btn" data-action="playpause"><span data-role="playicon">${this._icon('play')}</span></div>
              <div class="btn" data-action="stop">${this._icon('stop')}</div>
              <div class="btn" data-action="locate">${this._icon('locate')}</div>
              <div class="btn" data-action="dock">${this._icon('dock')}</div>
              ${e.skip_boolean ? `<div class="btn" data-action="skip" data-role="skipbtn" title="Skip Next Run">${this._icon('disable')}</div>` : ''}
            </div>
          </div>
          ${e.map_camera ? `<div class="map${e.map_rotate ? ' rotated' : ''} has-camera" data-role="map">
            <img data-role="map-img" style="display:none" />
            <span class="map-placeholder" data-role="map-placeholder"></span>
          </div>` : ''}
        </div>
        ${e.status_entity ? `<div class="sline" data-role="sline" style="display:none"><span class="stxt" data-role="stxt"></span></div>` : ''}
      </div>
    `).join('');

    this.shadowRoot.innerHTML = `
      <style>
        ha-card { background: transparent; box-shadow: none; border: none; }
        .cards { position:relative; display:flex; flex-direction:column; border-radius:var(--lg-radius, 24px); overflow:hidden;
          background: linear-gradient(155deg, rgba(255,255,255,0.09) 0%, rgba(255,255,255,0.025) 45%, rgba(255,255,255,0.05) 100%);
          backdrop-filter: var(--lg-backdrop, blur(20px) saturate(180%));
          -webkit-backdrop-filter: var(--lg-backdrop, blur(20px) saturate(180%));
          border:1px solid rgba(255,255,255,0.14);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.16), inset 0 0 0 1px rgba(255,255,255,0.03), 0 8px 24px rgba(0,0,0,0.3);
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif; }
        .glow-a { position:absolute; top:-120px; left:-140px; width:340px; height:340px; border-radius:50%;
          background: radial-gradient(circle, rgba(190,210,80,0.5), rgba(190,210,80,0) 70%); filter: blur(10px); }
        .glow-b { position:absolute; bottom:-160px; right:-140px; width:380px; height:380px; border-radius:50%;
          background: radial-gradient(circle, rgba(210,70,110,0.45), rgba(210,70,110,0) 70%); filter: blur(10px); }
        .card { position:relative; padding:20px 18px; }
        .card + .card { border-top: 1px solid rgba(255,255,255,0.09); }
        .card-inner { position:relative; display:flex; align-items:flex-start; gap:14px; width:100%; min-width:0; }
        .left-col { flex-shrink:0; min-width:0; height:112px; display:flex; flex-direction:column; justify-content:space-between; }
        .row { display:flex; align-items:center; gap:12px; }
        .avatar { position:relative; width:44px; height:44px; flex-shrink:0; }
        .avatar-glow { position:absolute; inset:-8px; border-radius:50%;
          background:radial-gradient(circle, rgba(0,191,165,0.65), transparent 70%); filter:blur(7px);
          opacity:0; transition:opacity 0.3s ease; pointer-events:none; z-index:0; }
        .avatar-glow.active { opacity:1; }
        .avatar-circle { position:relative; z-index:1; width:44px; height:44px; border-radius:50%;
          background:linear-gradient(145deg, rgba(255,255,255,0.18), rgba(255,255,255,0.05));
          border:1px solid rgba(255,255,255,0.12); display:flex; align-items:center; justify-content:center;
          color: var(--primary-text-color, rgba(255,255,255,0.85));
          backdrop-filter: saturate(180%) brightness(1.15); -webkit-backdrop-filter: saturate(180%) brightness(1.15);
          box-shadow: inset 2px 0 4px rgba(80,200,255,0.26), inset -2px 0 4px rgba(255,90,190,0.24);
          transition: border-color 0.3s ease, box-shadow 0.3s ease; }
        .avatar-circle.active { border-color: rgba(0,191,165,0.7);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.08), 0 0 4px rgba(0,191,165,0.6), 0 0 18px rgba(0,191,165,0.5), inset 2px 0 4px rgba(80,200,255,0.24), inset -2px 0 4px rgba(255,90,190,0.22); }
        .badge { position:absolute; top:-2px; right:-2px; width:16px; height:16px; border-radius:50%;
          background:rgba(30,32,36,0.9); border:1px solid rgba(255,255,255,0.15); z-index:2;
          display:flex; align-items:center; justify-content:center; }
        .meta { display:flex; flex-direction:column; gap:2px; }
        .name { color: var(--primary-text-color, rgba(255,255,255,0.95)); font-size:16px; font-weight:600; }
        .name.clickable { cursor:pointer; }
        .name.clickable:hover { text-decoration: underline; text-decoration-color: rgba(255,255,255,0.35); }
        .status { color: var(--secondary-text-color, rgba(255,255,255,0.5)); font-size:13px; }
        .map { position:relative; flex:1 1 auto; min-width:0; height:112px; border-radius:14px; overflow:hidden;
          display:flex; align-items:center; justify-content:center; cursor:default; }
        .map.has-camera { cursor:pointer; }
        .map img { width:100%; height:100%; object-fit:contain; display:block; }
        .map-placeholder { color:rgba(255,255,255,0.4); font-size:10px; }
        .buttons { display:flex; align-items:center; gap:10px; }
        .btn { width:40px; height:40px; border-radius:50%; background:rgba(255,255,255,0.09);
          border:1px solid rgba(255,255,255,0.08); display:flex; align-items:center; justify-content:center;
          color: var(--primary-text-color, rgba(255,255,255,0.85));
          backdrop-filter: saturate(180%) brightness(1.1); -webkit-backdrop-filter: saturate(180%) brightness(1.1);
          box-shadow: inset 1px 0 3px rgba(80,200,255,0.24), inset -1px 0 3px rgba(255,90,190,0.22);
          cursor:pointer; }
        .btn:hover { background: rgba(255,255,255,0.15); }
        .btn.active { background: rgba(255,159,10,0.35); border-color: rgba(255,159,10,0.55); }
        .btn [data-role="playicon"] { display:flex; align-items:center; justify-content:center; }
        .sline { margin-top:12px; padding-top:9px; border-top:1px solid rgba(255,255,255,0.08);
          color: var(--secondary-text-color, rgba(255,255,255,0.6)); font-size:12.5px; line-height:1.35; }
        .sline .stxt { display:-webkit-box; -webkit-line-clamp:1; -webkit-box-orient:vertical; overflow:hidden;
          cursor:pointer; -webkit-tap-highlight-color:transparent; }
        .sline.expanded .stxt { display:block; -webkit-line-clamp:unset; overflow:visible; }
        .sline.active .stxt { color: rgb(0,191,165); font-weight:600; }
        .sline.problem .stxt { color: rgb(255,159,10); font-weight:600; }
        /* look: solid - calm solid surfaces instead of glass: no blur, no
           gradients, no cyan/pink inner edges, no glows. The robot icon
           circle fills with teal while the robot runs; the skip button
           fills orange while the next run is skipped. Only applies with
           .solid, the glass rules above stay untouched. */
        .cards.solid { --vc-ink: var(--primary-text-color, #fff); --c: rgb(0,191,165);
          background: var(--surface, color-mix(in srgb, var(--card-background-color, #1c1f28) 88%, transparent));
          backdrop-filter:none; -webkit-backdrop-filter:none;
          border:1px solid rgba(255,255,255,0.06); border-radius:var(--lg-radius, 20px); box-shadow:none; }
        .cards.solid .card { padding:16px; }
        .cards.solid .card + .card { border-top:1px solid rgba(255,255,255,0.06); }
        .cards.solid .card-inner { gap:12px; }
        .cards.solid .avatar { width:44px; height:44px; display:flex; align-items:center; justify-content:center; }
        .cards.solid .avatar-glow { display:none; }
        .cards.solid .avatar-circle { width:36px; height:36px; border:none; box-shadow:none;
          backdrop-filter:none; -webkit-backdrop-filter:none;
          background: color-mix(in srgb, var(--vc-ink) 10%, transparent);
          color: var(--secondary-text-color, rgba(255,255,255,0.6));
          transition: background .2s ease, color .2s ease; }
        .cards.solid .avatar-circle svg { width:20px; height:20px; }
        .cards.solid .avatar-circle.active { background: var(--c); color:#16181d; border:none; box-shadow:none; }
        .cards.solid .badge { top:0; right:0; background: var(--surface, #1c1f28); border:1px solid rgba(255,255,255,0.06); }
        .cards.solid .name { font-size:15px; font-weight:600; }
        .cards.solid .status { font-size:13px; }
        .cards.solid .buttons { gap:6px; }
        .cards.solid .btn { width:44px; height:44px; border-radius:999px; border:none; box-shadow:none;
          backdrop-filter:none; -webkit-backdrop-filter:none;
          background: color-mix(in srgb, var(--vc-ink) 14%, transparent);
          transition: background .15s ease, color .15s ease; }
        .cards.solid .btn:hover { background: color-mix(in srgb, var(--vc-ink) 20%, transparent); }
        .cards.solid .btn:active { background: color-mix(in srgb, var(--vc-ink) 26%, transparent); }
        .cards.solid .btn.active { background: rgb(255,159,10); color:#16181d; border:none; }
        .cards.solid .map { border-radius: calc(var(--lg-radius, 20px) - 4px);
          background: var(--lg-tile-bg, color-mix(in srgb, var(--vc-ink) 8%, transparent));
          border:var(--lg-tile-edge, 1px solid rgba(255,255,255,0.04)); box-shadow:var(--lg-tile-shadow, none); box-sizing:border-box; }
        .cards.solid .map-placeholder { font-size:12px; color: var(--secondary-text-color, rgba(255,255,255,0.6)); }
        .cards.solid .sline { margin-top:12px; padding-top:10px; border-top:1px solid rgba(255,255,255,0.06); font-size:13px; }
        .cards.solid .sline.active .stxt { color: color-mix(in srgb, var(--c) 70%, var(--vc-ink)); }
        @media (prefers-reduced-motion: reduce) {
          .cards.solid .avatar-circle, .cards.solid .btn { transition:none; }
        }
      </style>
      <ha-card>
        <div class="cards${this._solid ? ' solid' : ''}">
          ${rows}
        </div>
      </ha-card>
    `;

    this._config.entities.forEach((e, i) => {
      const card = this.shadowRoot.querySelector(`.card[data-idx="${i}"]`);
      card.querySelector('[data-action="playpause"]').addEventListener('click', () => {
        const state = this._hass?.states[e.entity]?.state;
        this._callService('vacuum', state === 'cleaning' ? 'pause' : 'start', e.entity);
      });
      card.querySelector('[data-action="stop"]').addEventListener('click', () => this._callService('vacuum', 'stop', e.entity));
      card.querySelector('[data-action="locate"]').addEventListener('click', () => this._callService('vacuum', 'locate', e.entity));
      card.querySelector('[data-action="dock"]').addEventListener('click', () => this._callService('vacuum', 'return_to_base', e.entity));
      const skipBtn = card.querySelector('[data-action="skip"]');
      if (skipBtn && e.skip_boolean) {
        skipBtn.addEventListener('click', () => this._callService('input_boolean', 'toggle', e.skip_boolean));
      }

      // Optional status line (status_entity): one line, tap to expand.
      const sline = card.querySelector('[data-role="sline"]');
      if (sline) {
        sline.querySelector('[data-role="stxt"]').addEventListener('click', (ev) => {
          ev.stopPropagation();
          if (this._expanded.has(e.entity)) this._expanded.delete(e.entity);
          else this._expanded.add(e.entity);
          sline.classList.toggle('expanded', this._expanded.has(e.entity));
        });
        sline.classList.toggle('expanded', this._expanded.has(e.entity));
      }

      const mapEl = card.querySelector('[data-role="map"]');
      if (mapEl && e.map_camera) {
        mapEl.addEventListener('click', () => this._moreInfo(e.map_camera));
      }
      const nameEl = card.querySelector('[data-role="name"]');
      if (nameEl) {
        nameEl.classList.add('clickable');
        nameEl.addEventListener('click', () => this._moreInfo(e.map_camera || e.entity));
      }
      if (mapEl && e.map_rotate) {
        this._layoutRotatedMap(mapEl);
        if (window.ResizeObserver) {
          const ro = new ResizeObserver(() => this._layoutRotatedMap(mapEl));
          ro.observe(mapEl);
        }
      }
    });
  }

  _moreInfo(entityId) {
    this.dispatchEvent(new CustomEvent('hass-more-info', {
      detail: { entityId },
      bubbles: true,
      composed: true,
    }));
  }

  _layoutRotatedMap(mapEl) {
    const img = mapEl.querySelector('img');
    if (!img) return;
    const w = mapEl.clientWidth;
    const h = mapEl.clientHeight;
    if (!w || !h) return;
    img.style.position = 'absolute';
    img.style.top = '50%';
    img.style.left = '50%';
    img.style.width = h + 'px';
    img.style.height = w + 'px';
    img.style.transform = 'translate(-50%, -50%) rotate(90deg)';
  }

  _updateCards() {
    if (!this._hass || !this._config) return;
    this._config.entities.forEach((e, i) => {
      const card = this.shadowRoot.querySelector(`.card[data-idx="${i}"]`);
      if (!card) return;
      const stateObj = this._hass.states[e.entity];
      const state = stateObj?.state || 'unknown';

      const de = String((this._hass.locale && this._hass.locale.language) || this._hass.language || 'en').startsWith('de');
      const statusMap = de
        ? { docked: 'In der Station', cleaning: 'Saugt', paused: 'Pausiert', returning: 'F\u00e4hrt zur\u00fcck', idle: 'Bereit', error: 'Fehler', unavailable: 'Nicht erreichbar' }
        : { docked: 'Docked', cleaning: 'Cleaning', paused: 'Paused', returning: 'Returning to Dock', idle: 'Idle', error: 'Error', unavailable: 'Unavailable' };
      card.querySelector('[data-role="status"]').textContent = statusMap[state] || state;
      card.querySelector('[data-role="playicon"]').innerHTML =
        state === 'cleaning' ? this._icon('pause') : this._icon('play');

      const running = state === 'cleaning' || state === 'returning';
      const avatarCircle = card.querySelector('[data-role="avatarcircle"]');
      const avatarGlow = card.querySelector('[data-role="avatarglow"]');
      if (avatarCircle) avatarCircle.classList.toggle('active', running);
      if (avatarGlow) avatarGlow.classList.toggle('active', running);

      if (e.status_entity) {
        const sline = card.querySelector('[data-role="sline"]');
        const st = this._hass.states[e.status_entity];
        if (sline) {
          const ok = st && !['unknown', 'unavailable', ''].includes(st.state);
          sline.style.display = ok ? '' : 'none';
          if (ok) {
            const txt = sline.querySelector('[data-role="stxt"]');
            if (txt.textContent !== st.state) { txt.textContent = st.state; txt.title = st.state; }
            const problem = st.state.startsWith('\u26a0');
            sline.classList.toggle('problem', problem);
            sline.classList.toggle('active', running && !problem);
          }
        }
      }

      if (e.map_camera) {
        const camState = this._hass.states[e.map_camera];
        const img = card.querySelector('[data-role="map-img"]');
        const placeholder = card.querySelector('[data-role="map-placeholder"]');
        if (camState?.attributes?.entity_picture) {
          img.src = camState.attributes.entity_picture;
          img.style.display = 'block';
          placeholder.style.display = 'none';
        }
      }

      if (e.skip_boolean) {
        const skipBtn = card.querySelector('[data-role="skipbtn"]');
        if (skipBtn) {
          const skipState = this._hass.states[e.skip_boolean]?.state;
          skipBtn.classList.toggle('active', skipState === 'on');
        }
      }
    });
  }
}

if (!customElements.get('saugroboter-card-dev')) customElements.define('saugroboter-card-dev', SaugroboterCard);

// Optional: card picker registration
window.customCards = window.customCards || [];
window.customCards.push({
  type: 'saugroboter-card-dev',
  name: 'Vacuum Robot Card',
  description: 'Vacuum widgets styled to match the Thermostat Glass Card look.'
});
