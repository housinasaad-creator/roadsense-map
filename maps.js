'use strict';
// Base maps the dashboard can show. Each user picks one (saved in this browser) and can switch with one button at any time.
// Google tiles are only used through the official Map Tiles API with a key in config.js (googleKey); there is no unofficial Google tile URL here.
const PRU_MAPS = [
  { id: 'streets', key: 'lStreets', url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png', max: 19, attr: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' },
  { id: 'sat', key: 'lSat', url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', max: 19, attr: 'Tiles &copy; Esri' },
  { id: 'topo', key: 'lTopo', url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', sub: 'abc', max: 17, attr: '&copy; OpenStreetMap, SRTM | &copy; <a href="https://opentopomap.org">OpenTopoMap</a>' },
  { id: 'dark', key: 'lDark', url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', sub: 'abcd', max: 20, attr: '&copy; OpenStreetMap, &copy; <a href="https://carto.com/attributions">CARTO</a>' },
  { id: 'light', key: 'lLight', url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', sub: 'abcd', max: 20, attr: '&copy; OpenStreetMap, &copy; <a href="https://carto.com/attributions">CARTO</a>' },
  { id: 'google', key: 'lGoogle', google: true },
];

function mapChoice() { try { return localStorage.getItem('pru_map') || 'streets'; } catch (_) { return 'streets'; } }
function saveMapChoice(id) { try { localStorage.setItem('pru_map', id); } catch (_) { /* private mode */ } }
function googleAvailable(cfg) { return !!(cfg && cfg.googleKey); }

// builds the Leaflet layer for a definition; for Google it opens a Map Tiles API session first (needs the official key)
async function buildLayer(def, cfg) {
  if (def.google) {
    const r = await fetch('https://tile.googleapis.com/v1/createSession?key=' + encodeURIComponent(cfg.googleKey), {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mapType: 'roadmap', language: 'ar', region: 'SY' }),
    });
    if (!r.ok) throw new Error('google session ' + r.status);
    const { session } = await r.json();
    return L.tileLayer('https://tile.googleapis.com/v1/2dtiles/{z}/{x}/{y}?session=' + session + '&key=' + encodeURIComponent(cfg.googleKey), { maxZoom: 21, attribution: 'Map data &copy; Google' });
  }
  return L.tileLayer(def.url, { maxZoom: def.max, subdomains: def.sub || 'abc', attribution: def.attr });
}
