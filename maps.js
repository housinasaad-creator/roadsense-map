'use strict';
// Base maps the dashboard can show: four different companies. Each user picks one (saved in this browser) and can switch with one button any time.
//   OpenStreetMap (volunteer-built map, no key)    Esri (satellite, no key)
//   CARTO Voyager (free key, no account)           Google (official Map Tiles API key; billing must be enabled on the Google account)
// `max` = the deepest zoom where the company really has tiles (Esri imagery stops at 18 around Palmyra; beyond it Esri sends a grey "Map data not yet available" tile).
// Zooming past it makes the last real tiles bigger instead of asking for tiles that do not exist.
// A layer that needs a key which is not in config.js is shown greyed out ("works once the key is added") and is never loaded:
// loading it without a key would put a "KEY REQUIRED" watermark on the map. There is no unofficial Google tile address here.
const PRU_MAPS = [
  { id: 'streets', key: 'lStreets', url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png', max: 19, attr: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' },
  { id: 'sat', key: 'lSat', url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', max: 18, attr: 'Tiles &copy; Esri' },
  { id: 'carto', key: 'lCarto', needsKey: 'cartoKey', url: 'https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png?key={KEY}', max: 20, attr: '&copy; OpenStreetMap contributors, &copy; <a href="https://carto.com/attributions">CARTO</a>' },
  { id: 'google', key: 'lGoogle', needsKey: 'googleKey', google: 'roadmap' },
  { id: 'google_sat', key: 'lGoogleSat', needsKey: 'googleKey', google: 'satellite' },
];

function mapChoice() {
  try { const id = localStorage.getItem('pru_map'); return PRU_MAPS.some((m) => m.id === id) ? id : 'streets'; } catch (_) { return 'streets'; } // an old saved choice that no longer exists falls back to streets
}
function saveMapChoice(id) { try { localStorage.setItem('pru_map', id); } catch (_) { /* private mode */ } }
function layerAvailable(def, cfg) { return !def.needsKey || !!(cfg && cfg[def.needsKey]); }

// builds the Leaflet layer for a definition; Google opens a Map Tiles API session first (needs the official key)
async function buildLayer(def, cfg) {
  if (!layerAvailable(def, cfg)) throw new Error('key missing');
  if (def.google) {
    const body = def.google === 'satellite' ? { mapType: 'satellite', language: 'ar', region: 'SY', layerTypes: ['layerRoadmap'] } : { mapType: 'roadmap', language: 'ar', region: 'SY' };
    const r = await fetch('https://tile.googleapis.com/v1/createSession?key=' + encodeURIComponent(cfg.googleKey), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (!r.ok) throw new Error('google session ' + r.status);
    const { session } = await r.json();
    return L.tileLayer('https://tile.googleapis.com/v1/2dtiles/{z}/{x}/{y}?session=' + session + '&key=' + encodeURIComponent(cfg.googleKey), { maxZoom: 21, maxNativeZoom: 20, attribution: 'Map data &copy; Google' });
  }
  const url = def.needsKey ? def.url.replace('{KEY}', encodeURIComponent(cfg[def.needsKey])) : def.url;
  return L.tileLayer(url, { maxZoom: 21, maxNativeZoom: def.max, attribution: def.attr });
}
