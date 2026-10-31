'use strict';
// Base maps the dashboard can show. Each user picks one (saved in this browser) and can switch with one button any time.
//   OpenStreetMap (volunteer-built map, no key)    Esri (satellite, no key)
//   CARTO Voyager (free key by e-mail, no account; appears only when cartoKey is set in config.js)
// Google was dropped: its tiles need a billing account with a large prepayment.
// `max` = the deepest zoom where the company really has tiles (Esri imagery stops at 18 around Palmyra; beyond it Esri sends a grey "Map data not yet available" tile).
// Zooming past it makes the last real tiles bigger instead of asking for tiles that do not exist.
// A layer that needs a key which is not in config.js is not offered and never loaded (CARTO without a key draws an "API KEY REQUIRED" watermark).
const PRU_MAPS = [
  { id: 'streets', key: 'lStreets', url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png', max: 19, attr: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' },
  { id: 'sat', key: 'lSat', url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', max: 18, attr: 'Tiles &copy; Esri' },
  { id: 'carto', key: 'lCarto', needsKey: 'cartoKey', url: 'https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png?key={KEY}', max: 20, attr: '&copy; OpenStreetMap contributors, &copy; <a href="https://carto.com/attributions">CARTO</a>' },
];

// the maps that can be used now: a map whose key is not in config.js is not offered at all (it appears by itself once the key is added)
function visibleMaps(cfg) { return PRU_MAPS.filter((m) => layerAvailable(m, cfg)); }
function mapChoice() {
  try { const id = localStorage.getItem('pru_map'); return visibleMaps(window.ROADSENSE).some((m) => m.id === id) ? id : 'streets'; } catch (_) { return 'streets'; } // an old saved choice that is gone falls back to streets
}
function saveMapChoice(id) { try { localStorage.setItem('pru_map', id); } catch (_) { /* private mode */ } }
function layerAvailable(def, cfg) { return !def.needsKey || !!(cfg && cfg[def.needsKey]); }

// builds the Leaflet layer for a definition
async function buildLayer(def, cfg) {
  if (!layerAvailable(def, cfg)) throw new Error('key missing');
  const url = def.needsKey ? def.url.replace('{KEY}', encodeURIComponent(cfg[def.needsKey])) : def.url;
  return L.tileLayer(url, { maxZoom: 21, maxNativeZoom: def.max, attribution: def.attr });
}
