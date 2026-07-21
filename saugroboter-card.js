class SaugroboterCard extends HTMLElement {
  setConfig(config) {
    if (!config.entities || !Array.isArray(config.entities)) {
      throw new Error('saugroboter-card: "entities" list is required');
    }
    this._config = config;
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    this._updateCards();
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
      disable: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="14" r="7.5" stroke="currentColor" stroke-width="1.6"/><circle cx="12" cy="14" r="2.2" fill="currentColor"/><path d="M9 6 H15" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><line x1="4" y1="4" x2="20" y2="22" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
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
          <div class="map${e.map_rotate ? ' rotated' : ''}${e.map_camera ? ' has-camera' : ''}" data-role="map">
            <img data-role="map-img" style="display:none" />
            <span class="map-placeholder" data-role="map-placeholder">Map</span>
          </div>
        </div>
      </div>
    `).join('');

    this.innerHTML = `
      <style>
        ha-card { background: transparent; box-shadow: none; border: none; }
        .cards { position:relative; display:flex; flex-direction:column; border-radius:24px; overflow:hidden;
          background: linear-gradient(155deg, rgba(255,255,255,0.09) 0%, rgba(255,255,255,0.025) 45%, rgba(255,255,255,0.05) 100%);
          backdrop-filter: blur(20px) saturate(180%);
          -webkit-backdrop-filter: blur(20px) saturate(180%);
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
        .name { color: rgba(255,255,255,0.95); font-size:16px; font-weight:600; }
        .name.clickable { cursor:pointer; }
        .name.clickable:hover { text-decoration: underline; text-decoration-color: rgba(255,255,255,0.35); }
        .status { color: rgba(255,255,255,0.5); font-size:13px; }
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
      </style>
      <ha-card>
        <div class="cards">
          <div class="glow-a"></div>
          <div class="glow-b"></div>
          ${rows}
        </div>
      </ha-card>
    `;

    this._config.entities.forEach((e, i) => {
      const card = this.querySelector(`.card[data-idx="${i}"]`);
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
      const card = this.querySelector(`.card[data-idx="${i}"]`);
      if (!card) return;
      const stateObj = this._hass.states[e.entity];
      const state = stateObj?.state || 'unknown';

      const statusMap = {
        docked: 'Docked',
        cleaning: 'Cleaning',
        paused: 'Paused',
        returning: 'Returning to Dock',
        idle: 'Idle',
        error: 'Error',
        unavailable: 'Unavailable'
      };
      card.querySelector('[data-role="status"]').textContent = statusMap[state] || state;
      card.querySelector('[data-role="playicon"]').innerHTML =
        state === 'cleaning' ? this._icon('pause') : this._icon('play');

      const running = state === 'cleaning' || state === 'returning';
      const avatarCircle = card.querySelector('[data-role="avatarcircle"]');
      const avatarGlow = card.querySelector('[data-role="avatarglow"]');
      if (avatarCircle) avatarCircle.classList.toggle('active', running);
      if (avatarGlow) avatarGlow.classList.toggle('active', running);

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

customElements.define('saugroboter-card', SaugroboterCard);

// Optional: card picker registration
window.customCards = window.customCards || [];
window.customCards.push({
  type: 'saugroboter-card',
  name: 'Vacuum Robot Card',
  description: 'Vacuum widgets styled to match the Thermostat Glass Card look.'
});
