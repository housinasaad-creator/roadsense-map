'use strict';
// PRU / Sama Tadmor control panel: sign in, see every report on the map, follow volunteers, manage users and Telegram.
// Works on a phone browser too. Features that need the new database functions fail softly if the update was not applied yet.

const CFG = window.ROADSENSE || {};
const LOCAL = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
const DEMO = !CFG.url || !CFG.anonKey || (LOCAL && /[?&]demo\b/.test(location.search)); // sample data only on the developer's own computer, never on the published site
const VERSION = '2.0';
const BOT = CFG.tgBot || 'PRU_SamaTadmor_bot';

const TYPES = ['pothole', 'bump', 'crack_severe', 'crack', 'electric', 'water', 'sewer', 'telecom', 'explosive', 'remnant', 'garden', 'other'];
const COLORS = { pothole: '#FF8A4C', bump: '#FACC15', crack_severe: '#DC2626', crack: '#FB7185', electric: '#A78BFA', water: '#38BDF8', sewer: '#B08968', telecom: '#F472B6', explosive: '#E11D74', remnant: '#6366F1', garden: '#2DD4BF', other: '#94A3B8' };
const ICON = {
  pothole: '<path d="M3 15c0-3 4-5 9-5s9 2 9 5-4 5-9 5-9-2-9-5z"/><path d="M7 14c3-1.5 7-1.5 10 0"/>', bump: '<path d="M3 18h18M5 18c1-6 5-9 7-9s6 3 7 9"/>',
  crack: '<path d="M12 2l-2 7 4 3-3 4 2 6M10 9l-5 2M14 12l5-1"/>', crack_severe: '<path d="M12 2l-2 7 4 3-3 4 2 6M10 9l-5 2M14 12l5-1"/>',
  electric: '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>', water: '<path d="M12 3c4 5 6 8 6 11a6 6 0 0 1-12 0c0-3 2-6 6-11z"/>', sewer: '<path d="M3 9h6V6h6v3h6M3 17h18M7 9v8M17 9v8"/>',
  telecom: '<path d="M12 20v-8M8 8a6 6 0 0 1 8 0M5 5a10 10 0 0 1 14 0"/>', explosive: '<path d="M12 3l10 18H2zM12 10v5M12 18v.5"/>', remnant: '<path d="M3 20l4-8 4 4 3-9 7 13z"/>',
  garden: '<path d="M5 19c0-9 6-14 15-14 0 9-5 15-14 15zM5 19L14 10"/>', other: '<circle cx="6" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="18" cy="12" r="1.6"/>',
};
const STATUSES = ['new', 'in_progress', 'fixed', 'rejected'];
const STATUS_COLOR = { new: '#5CB8F2', in_progress: '#E5CB65', fixed: '#22C55E', rejected: '#64748B' };
const PERIODS = [['today', 1], ['d7', 7], ['d30', 30], ['all', 0]];

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const state = {
  rows: new Map(), types: new Set(TYPES), statuses: new Set(['new', 'in_progress', 'fixed']), period: 0, vol: '', selected: null, fitted: false,
  feed: [], users: [], presence: [], admin: false, tg: null, ruler: { on: false, box: null }, layer: null, layerId: mapChoice(), side: 'feed',
};
let sb = null, map = null, cluster = null, volLayer = null, rulerRect = null;
const markers = new Map();

// ------------------------------------------------------------------ helpers
const tt = (k, v) => t(k, v);
function applyLang() {
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  document.querySelectorAll('[data-i]').forEach((e) => { e.textContent = tt(e.dataset.i); });
  document.querySelectorAll('[data-i-title]').forEach((e) => { e.title = tt(e.dataset.iTitle); });
  document.title = tt('appTitle');
  document.querySelectorAll('[data-lang]').forEach((b) => b.classList.toggle('on', b.dataset.lang === lang));
}
function fmtTime(iso) { try { return new Intl.DateTimeFormat(lang === 'ar' ? 'ar-SY-u-nu-latn' : lang, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso)); } catch (_) { return iso; } }
function agoText(iso) {
  if (!iso) return tt('neverSeen');
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 90) return tt('liveNow');
  const n = s < 3600 ? Math.round(s / 60) + ' ' + tt('min') : s < 86400 ? Math.round(s / 3600) + ' ' + tt('hour') : Math.round(s / 86400) + ' ' + tt('day');
  return tt('seenAgo', { n });
}
function toast(msg) { const e = $('toast'); e.textContent = msg; e.classList.remove('hidden'); clearTimeout(toast._t); toast._t = setTimeout(() => e.classList.add('hidden'), 3200); }
const ageDays = (r) => Math.max(0, Math.floor((Date.now() - new Date(r.detected_at).getTime()) / 86400000));
const ageText = (r) => { const n = ageDays(r); return n < 1 ? tt('ageToday') : tt('ageLine', { n }); };
const mapsLink = (r) => `https://www.google.com/maps?q=${r.lat},${r.lon}`;
const dirLink = (r) => `https://www.google.com/maps/dir/?api=1&destination=${r.lat},${r.lon}`;
const since = () => (state.period ? Date.now() - state.period * 86400000 : 0);
const sizeText = (r) => (r.width_cm && r.length_cm ? `${(r.width_cm / 100).toFixed(2)} × ${(r.length_cm / 100).toFixed(2)} ${tt('m')}` : '—');
function visibleRows() {
  const s = since();
  return [...state.rows.values()].filter((r) => state.types.has(r.type) && state.statuses.has(r.status) && (!state.vol || r.reported_by === state.vol) && (!s || new Date(r.detected_at).getTime() >= s))
    .sort((a, b) => new Date(b.detected_at) - new Date(a.detected_at));
}
const svg = (name, size = 20) => `<svg viewBox="0 0 24 24" width="${size}" height="${size}">${ICON[name] || ICON.other}</svg>`;

// ------------------------------------------------------------------ demo data
function seeded(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let x = Math.imul(a ^ a >>> 15, 1 | a); x = x + Math.imul(x ^ x >>> 7, 61 | x) ^ x; return ((x ^ x >>> 14) >>> 0) / 4294967296; }; }
function demoRows() {
  const rnd = seeded(20261031), pts = window.TADMUR_POINTS || [], now = Date.now();
  const plan = { pothole: 8, bump: 5, crack_severe: 3, crack: 3, electric: 6, water: 4, sewer: 4, telecom: 3, explosive: 2, remnant: 3, garden: 2, other: 2 };
  const notes = { electric: ['سلك كهرباء واقع على الأرض', 'باب المحوّلة مخلوع'], water: ['تسرّب مياه من الأنبوب'], sewer: ['غطاء المنهل مفقود'], explosive: ['جسم مشبوه قرب الجدار'], remnant: ['ركام وذخيرة قديمة'], garden: ['حديقة عامة متضررة'] };
  const types = []; for (const [k, n] of Object.entries(plan)) for (let i = 0; i < n; i++) types.push(k);
  for (let i = types.length - 1; i > 0; i--) { const k = Math.floor(rnd() * (i + 1)); [types[i], types[k]] = [types[k], types[i]]; }
  const stat = ['new', 'new', 'in_progress', 'fixed', 'new', 'fixed', 'in_progress', 'fixed', 'rejected', 'new', 'fixed'];
  const who = ['Ahmad', 'Rana', 'Omar'];
  return types.map((type, i) => {
    const p = pts[i % Math.max(1, pts.length)] || [34.5603 + (rnd() - .5) * .02, 38.2701 + (rnd() - .5) * .03];
    const age = rnd() * 20 * 86400000, l = notes[type];
    return { id: 'demo-' + i, created_at: new Date(now - age).toISOString(), detected_at: new Date(now - age).toISOString(), type, lat: p[0], lon: p[1], accuracy_m: Math.round(4 + rnd() * 10),
      reported_by: who[Math.floor(rnd() * 3)], manual: true, photo_path: null, note: l ? l[Math.floor(rnd() * l.length)] : null, confirmations: 1 + Math.floor(rnd() * rnd() * 5),
      status: stat[i % stat.length], status_note: null, status_at: null, width_cm: (type === 'pothole' || type === 'bump') ? 40 + Math.floor(rnd() * 60) : null, length_cm: (type === 'pothole' || type === 'bump') ? 30 + Math.floor(rnd() * 50) : null, ai_verdict: null,
      last_seen_at: new Date(now - age * (0.3 + rnd() * 0.5)).toISOString(), app_version: '2.0.0', clean_photo_path: i % 2 === 0 ? 'demo' : null };
  });
}
function demoUsers() {
  const n = Date.now();
  return [
    { id: 'u1', username: 'Ahmad', status: 'active', created_at: new Date(n - 9 * 864e5).toISOString(), activated_at: new Date(n - 8 * 864e5).toISOString(), last_seen_at: new Date(n - 20e3).toISOString(), reports: 14, app_version: '2.0.0', abi: 'arm64', sharing: true, shared_at: new Date(n - 20e3).toISOString() },
    { id: 'u2', username: 'Rana', status: 'active', created_at: new Date(n - 7 * 864e5).toISOString(), activated_at: new Date(n - 6 * 864e5).toISOString(), last_seen_at: new Date(n - 40e3).toISOString(), reports: 9, app_version: '2.0.0', abi: 'arm64', sharing: true, shared_at: new Date(n - 40e3).toISOString() },
    { id: 'u3', username: 'Omar', status: 'active', created_at: new Date(n - 5 * 864e5).toISOString(), activated_at: new Date(n - 4 * 864e5).toISOString(), last_seen_at: new Date(n - 12 * 60e3).toISOString(), reports: 6, app_version: '2.0.0', abi: 'arm32', sharing: true, shared_at: new Date(n - 12 * 60e3).toISOString() },
    { id: 'u4', username: 'Noor', status: 'waiting', created_at: new Date(n - 864e5).toISOString(), activated_at: null, last_seen_at: null, reports: 0, app_version: null, abi: null, sharing: false, shared_at: null },
    { id: 'u5', username: 'Hala', status: 'revoked', created_at: new Date(n - 20 * 864e5).toISOString(), activated_at: new Date(n - 19 * 864e5).toISOString(), last_seen_at: new Date(n - 3 * 864e5).toISOString(), reports: 3, app_version: '1.8.2', abi: 'arm64', sharing: false, shared_at: null },
  ];
}
function demoPresence() {
  const c = CFG.center || [34.5603, 38.2701], n = Date.now();
  return [
    { username: 'Ahmad', lat: c[0] + 0.004, lon: c[1] - 0.006, accuracy_m: 6, sharing: true, app_open: true, updated_at: new Date(n - 20e3).toISOString() },
    { username: 'Rana', lat: c[0] - 0.003, lon: c[1] + 0.004, accuracy_m: 9, sharing: true, app_open: true, updated_at: new Date(n - 40e3).toISOString() },
    { username: 'Omar', lat: c[0] + 0.007, lon: c[1] + 0.009, accuracy_m: 14, sharing: true, app_open: false, updated_at: new Date(n - 12 * 60e3).toISOString() },
  ];
}
let demoTg = [{ chat_id: 1, name: 'Samer', username: 'samer_adm', active: true, joined_at: new Date(Date.now() - 3 * 864e5).toISOString() }, { chat_id: 2, name: 'Laila', username: 'laila_pru', active: true, joined_at: new Date(Date.now() - 2 * 864e5).toISOString() }];

// ------------------------------------------------------------------ data
async function load() {
  if (DEMO) { demoRows().forEach((r) => state.rows.set(r.id, r)); state.feed = [...state.rows.values()].sort((a, b) => new Date(b.detected_at) - new Date(a.detected_at)).slice(0, 12).map((r) => ({ kind: 'new', id: r.id, at: r.detected_at, fresh: false })); return; }
  const { data, error } = await sb.from('reports').select('*').order('detected_at', { ascending: false }).limit(5000);
  if (error) { toast(tt('loadErr')); console.error(error); return; }
  data.forEach((r) => state.rows.set(r.id, r));
  state.feed = data.slice(0, 15).map((r) => ({ kind: 'new', id: r.id, at: r.created_at || r.detected_at, fresh: false }));
}
function subscribe() {
  if (DEMO) return;
  sb.channel('reports-live').on('postgres_changes', { event: '*', schema: 'public', table: 'reports' }, (p) => {
    if (p.eventType === 'DELETE') { const id = p.old && p.old.id; if (id && state.rows.delete(id)) { if (state.selected === id) closeDetail(); render(); } return; }
    const r = p.new && p.new.id ? p.new : null; if (!r) return;
    const prev = state.rows.get(r.id), isNew = p.eventType === 'INSERT';
    state.rows.set(r.id, r);
    if (isNew) { state.feed.unshift({ kind: 'new', id: r.id, at: r.created_at, fresh: true }); toast(`${tt('newReport')}: ${tt(r.type)}`); pulse(r.id); }
    else if (prev && prev.status !== r.status) state.feed.unshift({ kind: 'status', id: r.id, at: new Date().toISOString(), fresh: true });
    state.feed = state.feed.slice(0, 40);
    render(); if (state.selected === r.id) openDetail(r.id, true);
  }).subscribe();
}
async function loadUsers() {
  if (DEMO) { state.users = state.users.length ? state.users : demoUsers(); return; }
  try { const { data, error } = await sb.rpc('admin_list_app_users'); if (error) throw error; state.users = data || []; } catch (e) { console.error(e); }
}
async function loadPresence() {
  if (DEMO) { state.presence = demoPresence(); drawVolunteers(); return; }
  try { const { data, error } = await sb.rpc('admin_list_presence'); if (error) throw error; state.presence = data || []; } catch (_) { state.presence = []; }
  drawVolunteers();
}

// ------------------------------------------------------------------ map
async function setLayer(id) {
  const def = visibleMaps(CFG).find((m) => m.id === id) || PRU_MAPS[0];
  if (!layerAvailable(def, CFG)) { toast(tt('needsKey')); return; }
  let layer;
  try { layer = await buildLayer(def, CFG); } catch (e) { console.error(e); toast(tt('loadErr')); return; }
  if (state.layer) map.removeLayer(state.layer);
  state.layer = layer.addTo(map); layer.setZIndex(1);
  state.layerId = def.id; saveMapChoice(def.id);
  $('layerName').textContent = tt(def.key);
  renderLayerPop();
}
function renderLayerPop() {
  const pop = $('layerPop'); pop.innerHTML = '';
  visibleMaps(CFG).forEach((m) => {
    const b = document.createElement('button'); b.type = 'button';
    b.className = m.id === state.layerId ? 'on' : '';
    b.innerHTML = `<span>${m.id === state.layerId ? '●' : '○'}</span><span>${esc(tt(m.key))}</span>`;
    b.onclick = async () => { pop.classList.add('hidden'); await setLayer(m.id); };
    pop.appendChild(b);
  });
}
function initMap() {
  map = L.map('map', { zoomControl: false, attributionControl: true, maxZoom: 21 }).setView(CFG.center || [34.56, 38.27], CFG.zoom || 12);
  L.control.zoom({ position: lang === 'ar' ? 'bottomleft' : 'bottomright' }).addTo(map);
  cluster = L.markerClusterGroup({ maxClusterRadius: 42, showCoverageOnHover: false });
  map.addLayer(cluster);
  volLayer = L.layerGroup().addTo(map);
  map.on('click', () => { if (!state.ruler.on) closeDetail(); $('layerPop').classList.add('hidden'); });
  setLayer(state.layerId);
}
function pulse(id) {
  const m = markers.get(id); if (!m) return;
  map.setView(m.getLatLng(), Math.max(map.getZoom(), 15));
  setTimeout(() => { const e = m.getElement && m.getElement(); const d = e && e.querySelector('.pt'); if (d) { d.classList.add('pulse'); setTimeout(() => d.classList.remove('pulse'), 5200); } }, 400);
}
function pointIcon(r) {
  const n = r.confirmations || 1, sz = n >= 4 ? 's3' : n >= 2 ? 's2' : '', wh = sz === 's3' ? 34 : sz === 's2' ? 30 : 26;
  return L.divIcon({ className: '', iconSize: [wh, wh], iconAnchor: [wh / 2, wh / 2], html: `<div class="pt ${sz} st-${r.status}${state.selected === r.id ? ' sel' : ''}" style="--c:${COLORS[r.type] || '#888'}">${n > 1 && r.status !== 'fixed' ? `<b>×${n}</b>` : ''}</div>` });
}
function fitVisible() { const rows = visibleRows(); if (rows.length) map.fitBounds(L.latLngBounds(rows.map((r) => [r.lat, r.lon])).pad(.2), { maxZoom: 16 }); }
function drawVolunteers() {
  if (!volLayer) return;
  volLayer.clearLayers();
  if (!$('liveToggle').checked) return;
  const byName = new Map(state.users.map((u) => [String(u.username).toLowerCase(), u]));
  state.presence.filter((p) => p.sharing && p.lat != null && p.lon != null).forEach((p) => {
    const live = (Date.now() - new Date(p.updated_at).getTime()) < 3 * 60e3, name = p.username, u = byName.get(String(name).toLowerCase());
    const html = `<div class="vol${live ? '' : ' stale'}"><div class="ring"></div><div class="dot">${esc(name[0] || '?')}</div><div class="lbl"><b>${esc(name)}</b><small>${esc(agoText(p.updated_at))}</small></div></div>`;
    const m = L.marker([p.lat, p.lon], { icon: L.divIcon({ className: '', html, iconSize: [0, 0] }), zIndexOffset: 800 });
    m.bindTooltip(`${esc(name)}${p.accuracy_m ? ' · ±' + Math.round(p.accuracy_m) + ' ' + tt('m') : ''}${u && u.app_version ? ' · v' + esc(u.app_version) : ''}`, { className: 'pruTip', direction: 'top', offset: [0, -22] });
    m.on('click', (e) => { L.DomEvent.stopPropagation(e); volPopup(m, name, p); });
    volLayer.addLayer(m);
  });
}
function volPopup(m, name, p) {
  const d = document.createElement('div'); d.className = 'volpop';
  d.innerHTML = `<b>${esc(name)}</b><small>${esc(agoText(p.updated_at))}</small>`;
  const mk = (label, cls, fn) => { const b = document.createElement('button'); b.type = 'button'; b.className = cls; b.textContent = label; b.onclick = () => { map.closePopup(); fn(); }; d.appendChild(b); };
  mk(tt('noteBtn'), 'g', () => openNote(name));
  mk(tt('noteFilter'), '', () => { state.vol = name; renderFilters(); render(); });
  L.popup({ offset: [0, -22], closeButton: false }).setLatLng(m.getLatLng()).setContent(d).openOn(map);
}

// ------------------------------------------------------------------ render
function render() {
  const rows = visibleRows();
  cluster.clearLayers(); markers.clear();
  for (const r of rows) {
    const m = L.marker([r.lat, r.lon], { icon: pointIcon(r), riseOnHover: true });
    m.on('click', (e) => { L.DomEvent.stopPropagation(e); if (!state.ruler.on) openDetail(r.id); });
    markers.set(r.id, m); cluster.addLayer(m);
  }
  if (!state.fitted && rows.length) { state.fitted = true; fitVisible(); }
  renderKpis(); renderList(rows); renderFeed(); renderFilters();
}
function renderKpis() {
  const all = [...state.rows.values()]; const by = (f) => all.filter(f).length;
  const k = [[tt('kTotal'), by((r) => r.status !== 'rejected'), '#E5CB65'], [tt('new'), by((r) => r.status === 'new'), STATUS_COLOR.new], [tt('in_progress'), by((r) => r.status === 'in_progress'), STATUS_COLOR.in_progress], [tt('kFixed'), by((r) => r.status === 'fixed'), STATUS_COLOR.fixed]];
  $('kpis').innerHTML = k.map(([l, n, c]) => `<div class="kpi"><i style="background:${c}"></i>${esc(l)} <b style="color:${c}">${n}</b></div>`).join('');
}
// a report counts as sent to Telegram only if somebody had already joined the bot when it arrived (never claimed otherwise)
function tgSent(r) {
  const act = (state.tg || []).filter((a) => a.active !== false && a.joined_at);
  if (!act.length) return false;
  return new Date(r.created_at || r.detected_at).getTime() >= Math.min(...act.map((a) => new Date(a.joined_at).getTime()));
}
function feedItem(r, kind, at, fresh) {
  const c = COLORS[r.type] || '#888', urgent = r.type === 'explosive';
  const b = document.createElement('button'); b.type = 'button'; b.className = 'fi' + (fresh ? ' new' : '') + (urgent && kind === 'new' ? ' urgent' : '') + (state.selected === r.id ? ' sel' : '');
  const title = kind === 'status' ? `${tt(r.status)} · ${tt(r.type)}` : `${tt('newReport')} · ${tt(r.type)}`;
  const sub = kind === 'status' ? (r.status_note || '') : `${r.reported_by || '—'}${r.accuracy_m != null ? ' · ±' + Math.round(r.accuracy_m) + ' ' + tt('m') : ''}${r.width_cm && r.length_cm ? ' · ' + sizeText(r) : ''}`;
  const sc = kind === 'status' ? STATUS_COLOR[r.status] : c;
  b.innerHTML = `<span class="ico" style="background:${sc}22;border-color:${sc};color:${sc}">${kind === 'status' && r.status === 'fixed' ? svg('other', 0).replace('<circle', '<circle') && '<svg viewBox="0 0 24 24" width="21" height="21"><path d="M4 12.5l5 5L20 6.5" stroke-width="3"/></svg>' : svg(r.type, 21)}</span>
    <span class="sp"><div class="t">${esc(title)} ${urgent && kind === 'new' ? `<span class="badge" style="background:rgba(225,29,116,.25);color:#ffc2da">${esc(tt('urgent'))}</span>` : ''}</div><div class="m">${esc(sub)}</div>${kind === 'new' && tgSent(r) ? `<div class="tg">✓ ${esc(tt('toTg'))}</div>` : ''}</span><span class="ago">${esc(agoText(at))}</span>`;
  b.onclick = () => { openDetail(r.id); const m = markers.get(r.id); if (m && map) map.setView(m.getLatLng(), Math.max(map.getZoom(), 16)); };
  return b;
}
function renderFeed() {
  const el = $('feed'); el.innerHTML = '';
  const items = state.feed.map((f) => ({ f, r: state.rows.get(f.id) })).filter((x) => x.r);
  if (!items.length) { el.innerHTML = `<div class="empty">${esc(tt('noFeed'))}</div>`; return; }
  items.forEach(({ f, r }) => el.appendChild(feedItem(r, f.kind, f.at, f.fresh)));
}
function renderList(rows) {
  $('listCount').textContent = `${rows.length} / ${state.rows.size}`; $('listCount').dir = 'ltr';
  const el = $('list'); el.innerHTML = '';
  if (!rows.length) { el.innerHTML = `<div class="empty">${esc(tt('empty'))}</div>`; return; }
  for (const r of rows.slice(0, 300)) {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'fi' + (state.selected === r.id ? ' sel' : '');
    const c = COLORS[r.type] || '#888';
    b.innerHTML = `<span class="ico" style="background:${c}22;border-color:${c};color:${c}">${svg(r.type, 21)}</span><span class="sp"><div class="t">${esc(tt(r.type))}${(r.confirmations || 1) > 1 ? ' ×' + r.confirmations : ''}</div><div class="m">${esc(fmtTime(r.detected_at))}${r.reported_by ? ' · ' + esc(r.reported_by) : ''}</div></span><span class="badge ${r.status}">${esc(tt(r.status))}</span>`;
    b.onclick = () => { openDetail(r.id); const m = markers.get(r.id); if (m) map.setView(m.getLatLng(), Math.max(map.getZoom(), 16)); };
    el.appendChild(b);
  }
}
function chip(label, on, color, fn) {
  const b = document.createElement('button'); b.type = 'button'; b.className = 'chip f' + (on ? ' on' : ' off');
  b.innerHTML = (color ? `<i style="background:${color}"></i>` : '') + `<span>${esc(label)}</span>`; b.onclick = fn; return b;
}
function renderFilters() {
  const fill = (id, nodes) => { const e = $(id); e.innerHTML = ''; nodes.forEach((n) => e.appendChild(n)); };
  const cnt = (type) => [...state.rows.values()].filter((r) => r.type === type && r.status !== 'rejected').length;
  const allOn = TYPES.every((k) => state.types.has(k));
  const typeChips = [chip(`${tt('all')}`, allOn, '#E5CB65', () => { TYPES.forEach((k) => (allOn ? state.types.delete(k) : state.types.add(k))); if (allOn) state.types = new Set(TYPES); render(); fitVisible(); })];
  TYPES.forEach((k) => typeChips.push(chip(`${tt(k)} ${cnt(k)}`, state.types.has(k), COLORS[k], () => {
    if (state.types.size === TYPES.length) state.types = new Set([k]); else state.types.has(k) ? state.types.delete(k) : state.types.add(k);
    if (!state.types.size) state.types = new Set(TYPES);
    render(); fitVisible();
  })));
  fill('chipType', typeChips);
  fill('chipStatus', STATUSES.map((k) => chip(tt(k), state.statuses.has(k), STATUS_COLOR[k], () => { state.statuses.has(k) ? state.statuses.delete(k) : state.statuses.add(k); render(); })));
  fill('chipPeriod', PERIODS.map(([k, d]) => chip(tt(k), state.period === d, null, () => { state.period = d; render(); })));
  const sel = $('selVol'), names = new Set([...state.rows.values()].map((r) => r.reported_by).filter(Boolean)); state.users.forEach((u) => names.add(u.username));
  const cur = state.vol, uNote = state.users.find((u) => String(u.username).toLowerCase() === String(cur).toLowerCase() && u.status === 'active');
  $('btnVolNote').classList.toggle('hidden', !(state.admin && uNote)); if (uNote) $('btnVolNote').textContent = tt('noteBtn');
  sel.innerHTML = `<option value="">${esc(tt('allVolunteers'))}</option>` + [...names].sort().map((n) => `<option value="${esc(n)}"${n === cur ? ' selected' : ''}>${esc(n)} (${[...state.rows.values()].filter((r) => r.reported_by === n).length})</option>`).join('');
}

// ------------------------------------------------------------------ detail
function closeDetail() { state.selected = null; $('detail').classList.add('hidden'); document.querySelectorAll('.fi.sel').forEach((e) => e.classList.remove('sel')); markers.forEach((m, id) => m.setIcon(pointIcon(state.rows.get(id)))); }
function demoPhoto(r, clean) {
  const c = COLORS[r.type] || '#888';
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><rect width="400" height="300" fill="#2c4b78"/><rect y="130" width="400" height="170" fill="#4a5568"/><polygon points="200,130 30,300 370,300" fill="#5b6577"/><ellipse cx="190" cy="235" rx="62" ry="20" fill="#0c0f14"/>${clean ? '' : `<rect x="105" y="195" width="170" height="66" rx="8" fill="none" stroke="${c}" stroke-width="5"/>`}<text x="12" y="288" font-size="15" fill="#fff" opacity=".85" font-family="sans-serif">DEMO</text></svg>`);
}
const distM = (a, b) => { const R = 6371000, p = Math.PI / 180, dl = (b.lat - a.lat) * p, dn = (b.lon - a.lon) * p, h = Math.sin(dl / 2) ** 2 + Math.cos(a.lat * p) * Math.cos(b.lat * p) * Math.sin(dn / 2) ** 2; return 2 * R * Math.asin(Math.min(1, Math.sqrt(h))); };
const rpcMissing = (e) => /could not find the function|PGRST202|does not exist/i.test(String((e && (e.message || e.code)) || e));
async function openDetail(id, silent) {
  const r = state.rows.get(id); if (!r) return;
  state.selected = id;
  const d = $('detail'); d.classList.remove('hidden'); $('exportPanel').classList.add('hidden');
  document.getElementById('side').classList.add('full');
  const c = COLORS[r.type] || '#888';
  d.innerHTML = `<button class="back" id="dBack" type="button">${lang === 'ar' ? '→' : '←'} ${esc(tt('back'))}</button>
    <h2><span class="ico" style="width:38px;height:38px;border-radius:12px;border:1.5px solid ${c};background:${c}22;color:${c};display:inline-flex;align-items:center;justify-content:center">${svg(r.type, 22)}</span>${esc(tt(r.type))}<span class="badge ${r.status}" style="margin-inline-start:auto">${esc(tt(r.status))}</span></h2>
    <div class="photo" id="dPhoto">${esc(tt('loadingPhoto'))}</div>
    <dl class="kv"><dt>${esc(tt('reporter'))}</dt><dd>${esc(r.reported_by || '—')}</dd><dt>${esc(tt('time'))}</dt><dd>${esc(fmtTime(r.detected_at))}</dd>
      <dt>${esc(tt('location'))}</dt><dd dir="ltr">${r.lat.toFixed(6)}, ${r.lon.toFixed(6)}</dd><dt>${esc(tt('accuracy'))}</dt><dd>${r.accuracy_m == null ? '—' : '±' + Math.round(r.accuracy_m) + ' ' + esc(tt('m'))}</dd>
      <dt>${esc(tt('size'))}</dt><dd>${esc(sizeText(r))}</dd><dt>${esc(tt('confirmations'))}</dt><dd>${r.confirmations || 1}</dd><dt>${esc(tt('age'))}</dt><dd>${esc(ageText(r))}</dd>
      <dt>${esc(tt('source'))}</dt><dd>${esc(r.manual ? tt('manual') : tt('auto'))}</dd>${r.note ? `<dt>${esc(tt('vnote'))}</dt><dd>${esc(r.note)}</dd>` : ''}</dl>
    <div class="links"><a class="lnk" target="_blank" rel="noopener" href="${mapsLink(r)}">${esc(tt('openMap'))}</a><a class="lnk" target="_blank" rel="noopener" href="${dirLink(r)}">${esc(tt('directions'))}</a><a class="lnk" target="_blank" rel="noopener" href="https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${r.lat},${r.lon}">${esc(tt('streetView'))}</a><button class="lnk" id="dCopy" type="button">${esc(tt('copyCoords'))}</button><button class="lnk" id="dShare" type="button">${esc(tt('share'))}</button></div>
    <div class="det-h">${esc(tt('moreDet'))}</div><dl class="kv" id="dMore"></dl>
    <div class="det-h">${esc(tt('dNearby', { n: 60 }))}</div><div class="near" id="dNear"></div>
    <div class="card ai"><div class="q">${esc(tt('aiQ'))}<small>${esc(tt('aiHint'))}</small></div>
      <button class="chip f ${r.ai_verdict === 'correct' ? 'on' : 'off'}" id="aiOk" type="button">✓ ${esc(tt('aiOk'))}</button><button class="chip f ${r.ai_verdict === 'wrong' ? 'on' : 'off'}" id="aiBad" type="button">✕ ${esc(tt('aiBad'))}</button></div>
    <div class="gt">${esc(tt('status'))}</div><div class="stbtns" id="dBtns"></div>
    <textarea id="dNote" maxlength="480" placeholder="${esc(tt('note'))}"></textarea>
    <p class="note">${esc(tt('fixedNote'))}</p>
    <button class="btn gold" id="dSave" type="button" style="margin:6px 0 10px">${esc(tt('save'))}</button>
    <button class="btn danger" id="dDel" type="button">🗑 ${esc(tt('del'))}</button>`;
  $('dBack').onclick = closeDetail;
  $('dNote').value = r.status_note || '';
  const shareText = `${tt(r.type)} - ${fmtTime(r.detected_at)}\n${r.note ? r.note + '\n' : ''}${r.lat.toFixed(6)}, ${r.lon.toFixed(6)}\n${mapsLink(r)}`;
  $('dCopy').onclick = async () => { const txt = `${r.lat.toFixed(6)}, ${r.lon.toFixed(6)}`; try { await navigator.clipboard.writeText(txt); toast(tt('copied')); } catch (_) { window.prompt(tt('copyCoords'), txt); } };
  const more = [];
  more.push([tt('dId'), `<span dir="ltr">${esc(String(r.id).slice(0, 8))}</span>`]);
  if (r.created_at) more.push([tt('dReceived'), esc(fmtTime(r.created_at))]);
  if ((r.confirmations || 1) > 1 && r.last_seen_at) more.push([tt('dLastConf'), esc(fmtTime(r.last_seen_at))]);
  if (r.status_at) more.push([tt('dStatusAt'), esc(fmtTime(r.status_at))]);
  if (r.status_note) more.push([tt('by'), esc(r.status_note)]);
  more.push([tt('dApp'), r.app_version ? `<span dir="ltr">v${esc(r.app_version)}</span>` : esc(tt('unknown'))]);
  if (r.reported_by) more.push([tt('dSame'), String([...state.rows.values()].filter((x) => x.reported_by === r.reported_by).length)]);
  more.push([tt('dAiVerdict'), esc(r.ai_verdict === 'correct' ? tt('aiOk') : r.ai_verdict === 'wrong' ? tt('aiBad') : tt('verdictNone'))]);
  $('dMore').innerHTML = more.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${v}</dd>`).join('');
  const nearEl = $('dNear'), near = [...state.rows.values()].filter((x) => x.id !== r.id).map((x) => ({ x, d: distM(r, x) })).filter((o) => o.d <= 60).sort((a, b) => a.d - b.d).slice(0, 6);
  if (!near.length) nearEl.innerHTML = `<small class="note">${esc(tt('dNoNearby'))}</small>`;
  near.forEach(({ x, d }) => {
    const b = document.createElement('button'); b.type = 'button';
    b.innerHTML = `<i style="background:${COLORS[x.type] || '#888'}"></i><span>${esc(tt(x.type))} · ${esc(tt(x.status))}</span><em>${Math.round(d)} ${esc(tt('m'))}</em>`;
    b.onclick = () => { openDetail(x.id); if (map) map.setView([x.lat, x.lon], Math.max(map.getZoom(), 17)); };
    nearEl.appendChild(b);
  });
  $('dShare').onclick = async () => {
    if (navigator.share) { try { await navigator.share({ title: tt('appTitle'), text: shareText }); return; } catch (e) { if (e && e.name === 'AbortError') return; } }
    try { await navigator.clipboard.writeText(shareText); toast(tt('copied')); } catch (_) { window.prompt(tt('share'), shareText); }
  };
  let chosen = r.status;
  const btns = $('dBtns');
  ['in_progress', 'fixed', 'rejected'].forEach((s) => { const b = document.createElement('button'); b.type = 'button'; b.textContent = tt(s); b.className = (s === chosen ? 'on ' : '') + s; b.onclick = () => { chosen = s; [...btns.children].forEach((x) => x.classList.remove('on')); b.classList.add('on'); }; btns.appendChild(b); });
  $('dSave').onclick = async () => {
    const note = $('dNote').value.trim() || null; $('dSave').disabled = true;
    if (!DEMO) {
      const { error } = await sb.from('reports').update({ status: chosen, status_note: note }).eq('id', r.id);
      if (error) { console.error(error); toast(tt('saveErr')); $('dSave').disabled = false; return; }
    }
    r.status = chosen; r.status_note = note; r.status_at = new Date().toISOString();
    toast(tt('saved')); render(); openDetail(r.id, true);
  };
  const verdict = async (v) => {
    if (!DEMO) {
      const { data: u } = await sb.auth.getUser();
      const { error } = await sb.from('reports').update({ ai_verdict: v, ai_verdict_by: u && u.user ? u.user.id : null, ai_verdict_at: new Date().toISOString() }).eq('id', r.id);
      if (error) { console.error(error); toast(tt('saveErr')); return; }
    }
    r.ai_verdict = v; toast(tt('saved')); openDetail(r.id, true);
  };
  $('aiOk').onclick = () => verdict('correct'); $('aiBad').onclick = () => verdict('wrong');
  $('dDel').onclick = async () => {
    if (!window.confirm(tt('delConfirm'))) return;
    if (!DEMO) {
      const paths = [r.photo_path, r.clean_photo_path].filter(Boolean);
      if (paths.length) await sb.storage.from('report-photos').remove(paths);
      const { error } = await sb.from('reports').delete().eq('id', r.id);
      if (error) { console.error(error); toast(tt('actionErr')); return; }
    }
    state.rows.delete(r.id); closeDetail(); render(); toast(tt('deleted'));
  };
  // photo
  const ph = $('dPhoto');
  const hasMain = DEMO || !!r.photo_path, hasClean = !!r.clean_photo_path;
  if (!hasMain && !hasClean) ph.textContent = tt('noPhoto');
  else {
    const signed = async (path) => { const { data, error } = await sb.storage.from('report-photos').createSignedUrl(path, 900); return error ? null : data.signedUrl; };
    const urls = [];
    if (hasMain) { const u = DEMO ? demoPhoto(r, false) : await signed(r.photo_path); if (u) urls.push({ label: tt('photoAnn'), url: u }); }
    if (hasClean) { const u = DEMO ? demoPhoto(r, true) : await signed(r.clean_photo_path); if (u) urls.push({ label: tt('photoClean'), url: u }); }
    if (state.selected !== id) return;
    if (urls.length) showPhoto(ph, urls, r); else ph.textContent = tt('noPhoto');
  }
  if (!silent) markers.forEach((m, mid) => m.setIcon(pointIcon(state.rows.get(mid))));
}
// the photo in the report panel: tabs when there is also a clean copy, an "Enlarge" button, and a tap opens the full-screen viewer
function showPhoto(ph, urls, r) {
  let cur = 0;
  ph.textContent = '';
  const img = new Image(); img.alt = ''; img.onerror = () => { ph.textContent = tt('noPhoto'); };
  const cap = { title: `${tt(r.type)} · ${r.reported_by || '—'}`, sub: fmtTime(r.detected_at) };
  img.onclick = () => viewer(urls, cur, cap);
  ph.appendChild(img);
  const bn = document.createElement('span'); bn.className = 'blur'; bn.textContent = tt('blurNote'); ph.appendChild(bn);
  const en = document.createElement('button'); en.type = 'button'; en.className = 'enl'; en.textContent = tt('enlarge'); en.onclick = () => viewer(urls, cur, cap); ph.appendChild(en);
  if (urls.length > 1) {
    const tabs = document.createElement('div'); tabs.className = 'ptabs'; ph.appendChild(tabs);
    urls.forEach((u, i) => { const b = document.createElement('button'); b.type = 'button'; b.textContent = u.label; b.onclick = () => { cur = i; img.src = u.url; [...tabs.children].forEach((x, k) => x.classList.toggle('on', k === i)); }; tabs.appendChild(b); });
    tabs.firstChild.classList.add('on');
  }
  img.src = urls[0].url;
}
// full-screen photo viewer: zoom with the buttons, the mouse wheel, a double click or two fingers; drag to move; Esc or ✕ to close
function viewer(items, start, cap) {
  let s = 1, x = 0, y = 0;
  const d = document.createElement('div'); d.className = 'lightbox';
  d.innerHTML = `<div class="lbtop"><div class="lbcap">${esc(cap.title)}<small>${esc(cap.sub)}</small></div><div class="lbbtns"><button type="button" data-a="in" title="${esc(tt('zoomIn'))}">＋</button><button type="button" data-a="out" title="${esc(tt('zoomOut'))}">－</button><button type="button" data-a="reset" title="${esc(tt('zoomReset'))}">1:1</button><a data-a="dl" target="_blank" rel="noopener" title="${esc(tt('download'))}">⬇</a><button type="button" class="x" data-a="x" title="${esc(tt('close'))}">✕</button></div></div><div class="lbstage"><img alt="" draggable="false"></div><div class="lbtabs"></div>`;
  const stage = d.querySelector('.lbstage'), img = stage.firstChild, dl = d.querySelector('[data-a=dl]'), tabs = d.querySelector('.lbtabs');
  const apply = () => { img.style.transform = `translate(${x}px,${y}px) scale(${s})`; };
  const reset = () => { s = 1; x = 0; y = 0; apply(); };
  const centre = () => { const r = stage.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; };
  const zoomAt = (f, px, py) => {
    const r = stage.getBoundingClientRect(), u = px - (r.left + r.width / 2), v = py - (r.top + r.height / 2);
    const ns = Math.min(8, Math.max(1, s * f)), k = ns / s;
    x = u - k * (u - x); y = v - k * (v - y); s = ns; if (s === 1) { x = 0; y = 0; }
    apply();
  };
  const show = (i) => { img.src = items[i].url; dl.href = items[i].url; dl.download = 'pru-report.jpg'; reset(); [...tabs.children].forEach((b, k) => b.classList.toggle('on', k === i)); };
  if (items.length > 1) items.forEach((it, i) => { const b = document.createElement('button'); b.type = 'button'; b.textContent = it.label; b.onclick = () => show(i); tabs.appendChild(b); });
  const key = (e) => { if (e.key === 'Escape') close(); else if (e.key === '+' || e.key === '=') zoomAt(1.4, ...centre()); else if (e.key === '-') zoomAt(1 / 1.4, ...centre()); else if (e.key === '0') reset(); };
  const close = () => { d.remove(); document.removeEventListener('keydown', key); };
  document.addEventListener('keydown', key);
  d.addEventListener('click', (e) => {
    const a = e.target.closest('[data-a]'); if (!a) return;
    const k = a.dataset.a;
    if (k === 'x') close(); else if (k === 'in') zoomAt(1.5, ...centre()); else if (k === 'out') zoomAt(1 / 1.5, ...centre()); else if (k === 'reset') reset();
  });
  stage.addEventListener('wheel', (e) => { e.preventDefault(); zoomAt(e.deltaY < 0 ? 1.2 : 1 / 1.2, e.clientX, e.clientY); }, { passive: false });
  stage.addEventListener('dblclick', (e) => { if (s > 1) reset(); else zoomAt(3, e.clientX, e.clientY); });
  const ptr = new Map(); let pinch = 0, moved = false;
  stage.addEventListener('pointerdown', (e) => {
    stage.setPointerCapture(e.pointerId); ptr.set(e.pointerId, [e.clientX, e.clientY]); stage.classList.add('drag'); moved = false;
    if (ptr.size === 2) { const [a, b] = [...ptr.values()]; pinch = Math.hypot(a[0] - b[0], a[1] - b[1]); }
  });
  stage.addEventListener('pointermove', (e) => {
    if (!ptr.has(e.pointerId)) return;
    const prev = ptr.get(e.pointerId); ptr.set(e.pointerId, [e.clientX, e.clientY]);
    if (ptr.size === 2) { const [a, b] = [...ptr.values()], dist = Math.hypot(a[0] - b[0], a[1] - b[1]); if (pinch) zoomAt(dist / pinch, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2); pinch = dist; moved = true; }
    else if (s > 1) { x += e.clientX - prev[0]; y += e.clientY - prev[1]; moved = true; apply(); }
  });
  const up = (e) => { ptr.delete(e.pointerId); pinch = 0; if (!ptr.size) stage.classList.remove('drag'); };
  stage.addEventListener('pointerup', (e) => {
    up(e); const r = img.getBoundingClientRect();
    if (!moved && (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom)) close(); // a tap beside the picture closes
  });
  stage.addEventListener('pointercancel', up);
  document.body.appendChild(d); show(start || 0);
}

// ------------------------------------------------------------------ ruler -> PDF report
function rulerStart() {
  state.ruler.on = true; $('btnRuler').classList.add('on'); $('rulerBar').classList.remove('hidden'); map.dragging.disable(); map.getContainer().style.cursor = 'crosshair'; map.getContainer().style.touchAction = 'none';
  closeDetail();
}
function rulerStop(keepRect) {
  state.ruler.on = false; $('btnRuler').classList.remove('on'); $('rulerBar').classList.add('hidden'); map.dragging.enable(); map.getContainer().style.cursor = ''; map.getContainer().style.touchAction = '';
  if (!keepRect && rulerRect) { map.removeLayer(rulerRect); rulerRect = null; }
}
function initRuler() {
  const c = map.getContainer(); let a = null;
  const ll = (e) => map.mouseEventToLatLng(e);
  c.addEventListener('pointerdown', (e) => { if (!state.ruler.on || e.target.closest('.tools,.kpis,.rulerbar,.leaflet-control')) return; a = ll(e); if (rulerRect) map.removeLayer(rulerRect); rulerRect = L.rectangle([a, a], { color: '#E5CB65', weight: 3, dashArray: '8 6', fillOpacity: .12 }).addTo(map); c.setPointerCapture(e.pointerId); e.preventDefault(); });
  c.addEventListener('pointermove', (e) => { if (a && rulerRect) rulerRect.setBounds(L.latLngBounds(a, ll(e))); });
  c.addEventListener('pointerup', (e) => { if (!a) return; const b = L.latLngBounds(a, ll(e)); a = null; if (b.getNorthEast().distanceTo(b.getSouthWest()) < 20) { if (rulerRect) map.removeLayer(rulerRect); rulerRect = null; return; } rulerStop(true); openExport(b); });
}
function exportRows(bounds) { return visibleRows().filter((r) => bounds.contains([r.lat, r.lon])); }
function activeFilterText() {
  const parts = [];
  if (state.vol) parts.push(`${tt('fVolunteer')}: ${state.vol}`);
  parts.push(`${tt('fStatus')}: ${[...state.statuses].map((s) => tt(s)).join(' / ')}`);
  if (state.types.size < TYPES.length) parts.push(`${tt('fType')}: ${[...state.types].map((k) => tt(k)).join(' / ')}`);
  parts.push(`${tt('fPeriod')}: ${tt(PERIODS.find(([, d]) => d === state.period)[0])}`);
  return parts;
}
function openExport(bounds) {
  const rows = exportRows(bounds), p = $('exportPanel'); $('detail').classList.add('hidden'); p.classList.remove('hidden'); document.getElementById('side').classList.add('full');
  const km = (bounds.getNorthEast().distanceTo(L.latLng(bounds.getNorthEast().lat, bounds.getSouthWest().lng)) / 1000).toFixed(2), kn = (bounds.getNorthEast().distanceTo(L.latLng(bounds.getSouthWest().lat, bounds.getNorthEast().lng)) / 1000).toFixed(2);
  p.innerHTML = `<button class="back" id="xBack" type="button">${lang === 'ar' ? '→' : '←'} ${esc(tt('back'))}</button><h2>📄 ${esc(tt('pdfTitle'))}</h2>
    <div class="card"><div class="gt">${esc(tt('pdfFilters'))}</div><div class="chips">${activeFilterText().map((x) => `<span class="chip on">${esc(x)}</span>`).join('')}</div></div>
    <div class="chip on" style="margin-bottom:8px">${esc(tt('rulerFound', { n: rows.length }))} · ${km} × ${kn} km</div>
    <label class="ck"><input type="checkbox" id="xNames" checked>${esc(tt('pdfNames'))}</label><label class="ck"><input type="checkbox" id="xPhotos" checked>${esc(tt('pdfPhotos'))}</label><label class="ck"><input type="checkbox" id="xCoords" checked>${esc(tt('pdfCoords'))}</label>
    <button class="btn gold" id="xGo" type="button" style="margin:12px 0 6px">${esc(tt('pdfGo'))}</button><p class="note">${esc(tt('pdfHow'))}</p>`;
  $('xBack').onclick = () => { p.classList.add('hidden'); if (rulerRect) { map.removeLayer(rulerRect); rulerRect = null; } };
  $('xGo').onclick = () => makeReport(rows, bounds, { names: $('xNames').checked, photos: $('xPhotos').checked, coords: $('xCoords').checked });
}
// Builds the report as a real PDF file in the browser (no print window, no other page): every page is drawn as HTML (so Arabic, Turkish and English
// are shaped by the browser), turned into a picture with html2canvas and put into an A4 PDF with jsPDF, which the browser then downloads at once.
// The language of the file is the language chosen in the panel; the logo and the PRU colours are on every page.
async function makeReport(rows, bounds, opt) {
  if (!window.html2canvas || !window.jspdf) { toast(tt('actionErr')); return; }
  const go = $('xGo'); if (go) go.disabled = true;
  toast(tt('pdfBusy'));
  try {
    const urls = {};
    if (opt.photos) {
      if (DEMO) rows.forEach((r) => { urls[r.id] = demoPhoto(r); });
      else {
        const paths = rows.map((r) => r.photo_path).filter(Boolean);
        if (paths.length) { const { data } = await sb.storage.from('report-photos').createSignedUrls(paths, 900); (data || []).forEach((x) => { if (x.signedUrl) urls[x.path] = x.signedUrl; }); }
        rows.forEach((r) => { if (r.photo_path && urls[r.photo_path]) urls[r.id] = urls[r.photo_path]; });
      }
    }
    const ok = {}; // pictures that really load (a failing one is simply left out)
    await Promise.all(rows.map((r) => new Promise((res) => {
      const u = urls[r.id]; if (!u) return res();
      const im = new Image(); im.crossOrigin = 'anonymous'; im.onload = () => { ok[r.id] = u; res(); }; im.onerror = () => res(); im.src = u; setTimeout(res, 15000);
    })));
    const W = 794, H = 1123, PAD = 36, dir = lang === 'ar' ? 'rtl' : 'ltr', ar = (k, v) => esc(tt(k, v));
    const cardH = opt.photos ? 150 : 104, gap = 10;
    const perFirst = Math.max(1, Math.floor((H - PAD * 2 - 250 - 34) / (cardH + gap))), perNext = Math.max(1, Math.floor((H - PAD * 2 - 60 - 34) / (cardH + gap)));
    const pages = [rows.slice(0, perFirst)];
    for (let i = perFirst; i < rows.length; i += perNext) pages.push(rows.slice(i, i + perNext));
    const logo = new URL('assets/logo.png', location.href).href;
    const today = new Date().toLocaleDateString(lang === 'ar' ? 'ar-SY-u-nu-latn' : lang, { year: 'numeric', month: 'long', day: 'numeric' });
    const css = `<style>.pp,.pp *{box-sizing:border-box}.pp{font-family:'Segoe UI',Tahoma,Arial,sans-serif;color:#0A1A33;direction:${dir};text-align:start;position:relative}
      .band{background:#0A1A33;border-radius:16px;padding:14px 18px;display:flex;align-items:center;gap:16px;color:#fff}.band img{height:84px}.band h1{margin:0;font-size:25px;color:#E5CB65;flex:1}.band small{color:#8FA8C8;font-size:13px;display:block;margin-top:4px}
      .slim{background:#0A1A33;border-radius:12px;padding:8px 14px;display:flex;align-items:center;gap:12px;color:#E5CB65;font-weight:700;font-size:15px}.slim img{height:36px}.slim span{flex:1}
      .box{background:#EEF3F9;border-radius:12px;padding:9px 13px;margin-top:10px;font-size:13px;line-height:1.7}.chips{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px}
      .chip{padding:3px 11px;border-radius:99px;font-size:12.5px;font-weight:700;background:#E9F3FC;border:1px solid #9CCDF0;color:#14507C}.chip.g{background:#FBF4D5;border-color:#E5CB65;color:#6B5710}
      .r{border:1.5px solid #D5DEEA;border-radius:14px;padding:10px 12px;margin-top:10px;overflow:hidden;background:#fff}.rh{display:flex;align-items:center;gap:8px;font-size:15px;font-weight:800}.rh i{width:13px;height:13px;border-radius:50%}
      .rh .d{margin-inline-start:auto;color:#5a6b86;font-size:12px;font-weight:600}.st{font-size:11px;font-weight:800;padding:1px 9px;border-radius:99px;background:#E8EEF6}.st-fixed{background:#CFF5DD}.st-in_progress{background:#F7EBB8}.st-rejected{background:#E2E6EC}
      .rb{display:flex;gap:12px;margin-top:8px}.rb img,.rb .np{width:176px;height:104px;border-radius:10px;object-fit:cover;flex:none;background:#E8EEF6}.np{display:flex;align-items:center;justify-content:center;color:#7d8da6;font-size:12px}
      .kv{flex:1;font-size:12.5px;line-height:1.65;min-width:0}.kv u{text-decoration:none;color:#5a6b86;margin-inline-end:6px}.kv .n{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
      .ft{position:absolute;bottom:14px;inset-inline:${PAD}px;display:flex;justify-content:space-between;color:#7d8da6;font-size:11.5px;border-top:2px solid #E5CB65;padding-top:6px}</style>`;
    const card = (r) => `<div class="r" style="height:${cardH}px"><div class="rh"><i style="background:${COLORS[r.type] || '#888'}"></i>${ar(r.type)}<span class="st st-${r.status}">${ar(r.status)}</span><span class="d">${esc(fmtTime(r.detected_at))}</span></div>
      <div class="rb">${opt.photos ? (ok[r.id] ? `<img src="${ok[r.id]}" crossorigin="anonymous" alt="">` : `<div class="np">${ar('noPhoto')}</div>`) : ''}<div class="kv">${opt.names ? `<div><u>${ar('reporter')}</u>${esc(r.reported_by || '—')}</div>` : ''}${opt.coords ? `<div><u>${ar('location')}</u><span dir="ltr">${r.lat.toFixed(6)}, ${r.lon.toFixed(6)}</span></div><div><u>${ar('accuracy')}</u>${r.accuracy_m == null ? '—' : '±' + Math.round(r.accuracy_m) + ' ' + ar('m')}</div>` : ''}
      <div><u>${ar('size')}</u>${esc(sizeText(r))}</div><div><u>${ar('confirmations')}</u>${r.confirmations || 1}</div>${r.note ? `<div class="n"><u>${ar('vnote')}</u>${esc(r.note)}</div>` : ''}</div></div></div>`;
    const byType = {}, byStatus = {}; rows.forEach((r) => { byType[r.type] = (byType[r.type] || 0) + 1; byStatus[r.status] = (byStatus[r.status] || 0) + 1; });
    const chips = `<span class="chip g">${ar('rulerFound', { n: rows.length })}</span>` + STATUSES.filter((s) => byStatus[s]).map((s) => `<span class="chip">${ar(s)} ${byStatus[s]}</span>`).join('') + Object.entries(byType).sort((a, b) => b[1] - a[1]).map(([k, n]) => `<span class="chip">${ar(k)} ${n}</span>`).join('');
    const first = `<div class="band"><img src="${logo}" crossorigin="anonymous" alt=""><div style="flex:1"><h1>${ar('pdfReport')} · PRU</h1><small>${esc(today)} · ${ar('appTitle')}</small></div></div>
      <div class="box"><b>${ar('pdfArea')}:</b> <span dir="ltr">${bounds.getSouth().toFixed(4)}, ${bounds.getWest().toFixed(4)} → ${bounds.getNorth().toFixed(4)}, ${bounds.getEast().toFixed(4)}</span><br>${activeFilterText().map(esc).join(' · ')}</div><div class="chips">${chips}</div>`;
    const slim = `<div class="slim"><img src="${logo}" crossorigin="anonymous" alt=""><span>${ar('pdfReport')} · PRU</span><small style="color:#8FA8C8">${esc(today)}</small></div>`;
    const doc = new window.jspdf.jsPDF({ unit: 'mm', format: 'a4', compress: true });
    for (let p = 0; p < pages.length; p++) {
      const el = document.createElement('div'); el.className = 'pp';
      el.style.cssText = `position:fixed;left:-12000px;top:0;width:${W}px;height:${H}px;background:#fff;padding:${PAD}px;overflow:hidden`;
      el.innerHTML = css + (p === 0 ? first : slim) + (pages[p].length ? pages[p].map(card).join('') : `<p style="margin-top:20px;font-weight:700">${ar('pdfNone')}</p>`) +
        `<div class="ft"><span>PRU · Sama Tadmor</span><span>${ar('pdfPage', { a: p + 1, b: pages.length })}</span></div>`;
      document.body.appendChild(el);
      const canvas = await window.html2canvas(el, { scale: 2, useCORS: true, backgroundColor: '#ffffff', logging: false, width: W, height: H });
      el.remove();
      if (p > 0) doc.addPage();
      doc.addImage(canvas.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, 210, 297);
    }
    const day = new Date().toISOString().slice(0, 10);
    doc.save((lang === 'ar' ? 'تقرير-PRU-' : lang === 'tr' ? 'PRU-rapor-' : 'PRU-report-') + day + '.pdf');
    toast(tt('pdfDone'));
  } catch (e) {
    console.error(e); toast(tt('actionErr'));
  } finally {
    if (go) go.disabled = false;
  }
}
function exportCsv() {
  const rows = visibleRows(); const q = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const head = S.csvHead[LANGS.indexOf(lang)];
  const lines = [head.map(q).join(',')];
  for (const r of rows) lines.push([r.id, r.detected_at, tt(r.type), tt(r.status), r.lat, r.lon, r.accuracy_m ?? '', r.reported_by ?? '', r.width_cm ?? '', r.length_cm ?? '', mapsLink(r), r.note ?? '', r.status_note ?? ''].map(q).join(','));
  const blob = new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `reports-${new Date().toISOString().slice(0, 10)}.csv`; a.click(); URL.revokeObjectURL(a.href);
}

// ------------------------------------------------------------------ volunteers page
const genCode = () => { const a = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; const r = new Uint32Array(8); crypto.getRandomValues(r); return [...r].map((x) => a[x % a.length]).join(''); };
async function usersCall(fn, args) {
  if (DEMO) {
    if (fn === 'admin_merge_app_users') { const a = state.users.find((x) => x.id === args.p_absorb), k = state.users.find((x) => x.id === args.p_keep); if (a && k) { let n = 0; for (const r of state.rows.values()) if (r.reported_by === a.username) { r.reported_by = k.username; n++; } k.reports = (k.reports || 0) + (a.reports || 0); state.users = state.users.filter((x) => x !== a); return { reports: n, kept: k.username, removed: a.username }; } return null; }
    if (fn === 'admin_create_app_user') state.users.unshift({ id: 'u' + Date.now(), username: args.p_username, status: 'waiting', created_at: new Date().toISOString(), reports: 0, sharing: false });
    else { const u = state.users.find((x) => x.id === args.p_id); if (u) { if (fn === 'admin_delete_app_user') state.users = state.users.filter((x) => x !== u); else if (fn === 'admin_revoke_app_user') u.status = 'revoked'; else if (fn === 'admin_reset_app_user') { u.status = 'waiting'; u.activated_at = null; } } }
    return;
  }
  const { data, error } = await sb.rpc(fn, args); if (error) throw error;
  return data;
}
function userError(e) { const m = String((e && e.message) || e); return m.includes('username taken') ? tt('uTaken') : m.includes('bad') ? tt('uBad') : tt('actionErr'); }
function renderUsersPage() {
  const us = state.users, online = us.filter((u) => u.last_seen_at && Date.now() - new Date(u.last_seen_at).getTime() < 3 * 60e3).length;
  const kp = [[tt('uTotal'), us.filter((u) => u.status !== 'revoked').length, '#F2F7FC'], [tt('uOnline'), online, '#22C55E'], [tt('uSharing'), us.filter((u) => u.sharing).length, '#E5CB65'], [tt('uRevokedK'), us.filter((u) => u.status === 'revoked').length, '#E5484D']];
  $('userKpis').innerHTML = kp.map(([l, n, c]) => `<div class="kcard"><b style="color:${c}">${n}</b><span>${esc(l)}</span></div>`).join('');
  const tbl = $('userTable');
  if (!us.length) { tbl.innerHTML = `<tr><td class="empty">${esc(tt('uNone'))}</td></tr>`; return; }
  tbl.innerHTML = `<thead><tr><th>${esc(tt('uTotal'))}</th><th>${esc(tt('status'))}</th><th>${esc(tt('uDevice'))}</th><th>${esc(tt('uLast'))}</th><th>${esc(tt('uShare'))}</th><th>${esc(tt('reports'))}</th><th></th></tr></thead><tbody></tbody>`;
  const body = tbl.querySelector('tbody');
  for (const u of us) {
    const live = u.last_seen_at && Date.now() - new Date(u.last_seen_at).getTime() < 3 * 60e3, dot = live ? '#22C55E' : u.status === 'revoked' ? '#E5484D' : '#7D93B3';
    const st = u.status === 'active' ? tt('uActive') : u.status === 'revoked' ? tt('uRevoked') : tt('uWaiting');
    const dev = u.abi ? `${u.abi === 'arm64' ? '64' : u.abi === 'arm32' ? '32' : u.abi} bit${u.app_version ? ' · v' + u.app_version : ''}` : '—';
    const tr = document.createElement('tr');
    tr.innerHTML = `<td><span class="av">${esc(u.username[0])}</span>${esc(u.username)}</td><td><span class="st"><i style="background:${dot}"></i>${esc(st)}</span></td><td><span dir="ltr">${esc(dev)}</span></td><td>${esc(u.last_seen_at ? agoText(u.last_seen_at) : tt('neverSeen'))}</td>
      <td>${u.sharing ? `<span style="color:#86efac">✓ ${esc(tt('uAgreed'))}</span>` : `<span class="mut" style="color:var(--mut)">${esc(tt('uNotShared'))}</span>`}</td><td>${u.reports || 0}</td><td><div class="acts"></div></td>`;
    const act = tr.querySelector('.acts');
    const btn = (label, fn, cls) => { const b = document.createElement('button'); b.type = 'button'; b.className = cls || ''; b.textContent = label; b.onclick = fn; act.appendChild(b); };
    if (u.status === 'active') btn(tt('noteBtn'), () => openNote(u.username), 'gld');
    if (us.length > 1) btn(tt('uMerge'), () => openMerge(u));
    if (u.sharing) btn(tt('uOnMap'), () => { location.hash = '#/map'; setTimeout(() => { const p = state.presence.find((x) => x.username === u.username); if (p && map) map.setView([p.lat, p.lon], 16); }, 300); });
    btn(tt('uReset'), async () => { if (!window.confirm(tt('uConfirmReset'))) return; const code = genCode(); try { await usersCall('admin_reset_app_user', { p_id: u.id, p_code: code }); showUserCode(u.username, code); await refreshUsers(); } catch (e) { toast(userError(e)); } });
    if (u.status !== 'revoked') btn(tt('uRevoke'), async () => { if (!window.confirm(tt('uConfirmRevoke'))) return; try { await usersCall('admin_revoke_app_user', { p_id: u.id }); await refreshUsers(); } catch (e) { toast(userError(e)); } });
    btn(tt('uDelete'), async () => { if (!window.confirm(tt('uConfirmDelete'))) return; try { await usersCall('admin_delete_app_user', { p_id: u.id }); await refreshUsers(); } catch (e) { toast(userError(e)); } }, 'warn');
    body.appendChild(tr);
  }
}
async function refreshUsers() { await loadUsers(); renderUsersPage(); renderFilters(); renderNotes(); }
function showUserCode(name, code) {
  const b = $('userCode'); b.classList.remove('hidden');
  b.innerHTML = `<p class="note">${esc(tt('uCodeShown'))}</p><div class="big">${esc(name)}   ·   ${esc(code)}</div><button class="btn sky sm" type="button" id="ucCopy">${esc(tt('uCopy'))}</button>`;
  $('ucCopy').onclick = async () => { try { await navigator.clipboard.writeText(`${name}\n${code}`); toast(tt('uCopied')); } catch (_) { window.prompt(tt('uCopy'), `${name} ${code}`); } };
}
function openUserForm() {
  const f = $('userForm'); f.classList.toggle('hidden'); if (f.classList.contains('hidden')) return;
  f.innerHTML = `<div class="urow"><input id="uName" maxlength="30" autocomplete="off" placeholder="${esc(tt('uName'))}"><input id="uCodeIn" maxlength="64" autocomplete="off" dir="ltr" placeholder="${esc(tt('uCode'))}"><button class="btn sky sm" id="uGen" type="button">${esc(tt('uGen'))}</button><button class="btn gold sm" id="uCreate" type="button">${esc(tt('uCreate'))}</button></div><p class="note">${esc(tt('uHint'))}</p>`;
  $('uCodeIn').value = genCode(); $('uGen').onclick = () => { $('uCodeIn').value = genCode(); };
  $('uCreate').onclick = async () => { const name = $('uName').value.trim(), code = $('uCodeIn').value.trim(); try { await usersCall('admin_create_app_user', { p_username: name, p_code: code }); f.classList.add('hidden'); showUserCode(name, code); await refreshUsers(); } catch (e) { toast(userError(e)); } };
}

// ------------------------------------------------------------------ merge two accounts (the second one is absorbed into the first one you choose)
function closeMerge() { $('mergeModal').classList.add('hidden'); }
function openMerge(u) {
  const others = state.users.filter((x) => x.id !== u.id);
  if (!others.length) { toast(tt('mergeNone')); return; }
  const count = (name) => [...state.rows.values()].filter((r) => r.reported_by === name).length;
  $('mergeTitle').textContent = tt('mergeTitle', { n: u.username });
  $('mergeInfo').textContent = tt('mergeInfo', { n: u.username });
  const sel = $('mergeTarget');
  sel.innerHTML = others.map((x) => `<option value="${esc(x.id)}">${esc(x.username)} (${esc(tt('mergeReports', { n: count(x.username) }))})</option>`).join('');
  $('mergeCount').textContent = tt('mergeReports', { n: count(u.username) });
  $('mergeModal').classList.remove('hidden');
  $('mergeGo').disabled = false;
  $('mergeGo').onclick = async () => {
    const keep = others.find((x) => x.id === sel.value); if (!keep) return;
    if (!window.confirm(tt('mergeConfirm', { a: u.username, k: keep.username }))) return;
    $('mergeGo').disabled = true;
    try {
      const r = await usersCall('admin_merge_app_users', { p_keep: keep.id, p_absorb: u.id });
      closeMerge(); toast(tt('mergeDone', { n: (r && r.reports) != null ? r.reports : 0, k: keep.username }));
      if (!DEMO) await load(); else render();
      await refreshUsers();
    } catch (e) { console.error(e); toast(rpcMissing(e) ? tt('mergeNoRpc') : tt('actionErr')); $('mergeGo').disabled = false; }
  };
}

// ------------------------------------------------------------------ notes to volunteers (one person or everybody; each phone shows a note once)
let demoNotes = [
  { id: 'n1', target: 'Ahmad', body: 'اليوم أنت في شارع القوتلي، من الدوار حتى المدرسة.', created_at: new Date(Date.now() - 3 * 3600e3).toISOString(), expires_at: new Date(Date.now() + 14 * 864e5).toISOString(), read_count: 1, audience: 1 },
  { id: 'n2', target: null, body: 'انتبهوا: الشارع المقابل للسوق مغلق للصيانة اليوم.', created_at: new Date(Date.now() - 20 * 3600e3).toISOString(), expires_at: new Date(Date.now() + 14 * 864e5).toISOString(), read_count: 2, audience: 3 },
  { id: 'n3', target: 'Rana', body: 'ركّزي على الأعمدة الكهربائية قرب الحديقة.', created_at: new Date(Date.now() - 600e3).toISOString(), expires_at: new Date(Date.now() + 14 * 864e5).toISOString(), read_count: 0, audience: 1 },
];
async function notesCall(fn, args) {
  if (DEMO) {
    if (fn === 'admin_send_note') { demoNotes.unshift({ id: 'n' + Date.now(), target: args.p_target || null, body: args.p_body, created_at: new Date().toISOString(), expires_at: new Date(Date.now() + 14 * 864e5).toISOString(), read_count: 0, audience: args.p_target ? 1 : state.users.filter((u) => u.status === 'active').length }); return null; }
    if (fn === 'admin_list_notes') return demoNotes;
    if (fn === 'admin_delete_note') { demoNotes = demoNotes.filter((n) => n.id !== args.p_id); return null; }
  }
  const { data, error } = await sb.rpc(fn, args || {}); if (error) throw error; return data;
}
function closeNote() { $('noteModal').classList.add('hidden'); }
function openNote(target) {
  const m = $('noteModal'), ta = $('noteText');
  $('noteTitle').textContent = target ? tt('noteToOne', { n: target }) : tt('noteToAll');
  $('noteHint').textContent = (target ? tt('noteHintOne') : tt('noteHintAll')) + ' ' + tt('noteOnlyActive') + '.';
  ta.value = ''; ta.placeholder = tt('notePh');
  const left = () => { $('noteLeft').textContent = tt('noteLeft', { n: 600 - ta.value.length }); };
  ta.oninput = left; left();
  m.classList.remove('hidden'); setTimeout(() => ta.focus(), 50);
  $('noteSendBtn').disabled = false;
  $('noteSendBtn').onclick = async () => {
    const body = ta.value.trim(); if (!body) { toast(tt('noteEmpty')); return; }
    $('noteSendBtn').disabled = true;
    try { await notesCall('admin_send_note', { p_target: target || null, p_body: body }); closeNote(); toast(tt('noteSent')); renderNotes(); }
    catch (e) { console.error(e); toast(rpcMissing(e) ? tt('noteNoRpc') : tt('actionErr')); $('noteSendBtn').disabled = false; }
  };
}
async function renderNotes() {
  const el = $('noteList'); let list;
  try { list = await notesCall('admin_list_notes'); } catch (e) { console.error(e); el.className = ''; el.innerHTML = `<div class="empty">${esc(tt('noteNoRpc'))}</div>`; return; }
  if (!list || !list.length) { el.className = ''; el.innerHTML = `<div class="empty">${esc(tt('noteNone'))}</div>`; return; }
  el.className = 'notes'; el.innerHTML = '';
  list.forEach((n) => {
    const all = !n.target, read = Number(n.read_count) || 0, aud = Number(n.audience) || 0;
    const status = all ? tt('noteReadN', { a: read, b: aud }) : read ? tt('noteRead') : tt('noteWaiting'), ok = all ? read > 0 && read >= aud : read > 0;
    const row = document.createElement('div'); row.className = 'nrow';
    row.innerHTML = `<span class="who${all ? ' all' : ''}">${esc(all ? tt('noteEveryone') : n.target)}</span><div class="body">${esc(n.body)}<small>${esc(fmtTime(n.created_at))}</small></div><span class="ds${ok ? ' ok' : ''}">${esc(status)}</span>`;
    const b = document.createElement('button'); b.type = 'button'; b.textContent = tt('noteDelete');
    b.onclick = async () => { if (!window.confirm(tt('noteDeleteConfirm'))) return; try { await notesCall('admin_delete_note', { p_id: n.id }); renderNotes(); } catch (_) { toast(tt('actionErr')); } };
    row.appendChild(b); el.appendChild(row);
  });
}

// ------------------------------------------------------------------ settings + Telegram page
async function tgCall(fn, args) {
  if (DEMO) {
    if (fn === 'admin_tg_list') return demoTg;
    if (fn === 'admin_tg_invite') return 'demo' + genCode().toLowerCase();
    if (fn === 'admin_tg_remove') { demoTg = demoTg.filter((x) => x.chat_id !== args.p_chat_id); return null; }
    if (fn === 'admin_tg_open_join') return !!state.openJoin;
  }
  const { data, error } = await sb.rpc(fn, args || {}); if (error) throw error; return data;
}
async function renderSettings() {
  $('aboutVer').textContent = tt('versionLine', { v: VERSION });
  $('mapsList').innerHTML = visibleMaps(CFG).map((m) => `<span class="chip ${m.id === state.layerId ? 'on' : ''}">${esc(tt(m.key))}</span>`).join('');
  $('tgWhat').innerHTML = ['tgW1', 'tgW2', 'tgW3'].map((k) => `<li>${esc(tt(k))}</li>`).join('');
  let list = null;
  try { list = await tgCall('admin_tg_list'); state.tg = list; } catch (e) { console.error(e); state.tg = null; }
  renderFeed();
  $('tgCard').innerHTML = `<div class="tgico"><svg viewBox="0 0 24 24"><path d="M21 4L3 11l6 2 2 6 3-4 5 4z"/></svg></div><div style="flex:1;min-width:200px"><div style="font-weight:900;font-size:20px">PRU · <a style="color:var(--sky)" dir="ltr" target="_blank" rel="noopener" href="https://t.me/${esc(BOT)}">@${esc(BOT)}</a></div><div class="note" style="margin:2px 0 0">${esc(list ? tt('tgDesc') : tt('tgNoRpc'))}</div></div>${list ? `<span class="chip tg">${esc(tt('tgConnected'))}</span>` : ''}`;
  const el = $('tgList');
  if (!list) el.innerHTML = `<div class="empty">${esc(tt('tgNoRpc'))}</div>`;
  else if (!list.length) el.innerHTML = `<div class="empty">${esc(tt('tgNone'))}</div>`;
  else {
    el.innerHTML = '';
    list.forEach((a) => {
      const d = document.createElement('div'); d.className = 'arow';
      d.innerHTML = `<span class="av">${esc((a.name || '?')[0])}</span><span style="flex:1">${esc(a.name || '—')}<small>${a.username ? '@' + esc(a.username) : ''} · ${esc(fmtTime(a.joined_at))}</small></span><button class="chip f" type="button" style="border-color:var(--bad);color:#ff9a9d">${esc(tt('tgRemove'))}</button>`;
      d.querySelector('button').onclick = async () => { if (!window.confirm(tt('tgRemoveConfirm'))) return; try { await tgCall('admin_tg_remove', { p_chat_id: a.chat_id }); await renderSettings(); } catch (e) { toast(tt('actionErr')); } };
      el.appendChild(d);
    });
  }
  const chipEl = $('tgChip'); if (list) { chipEl.textContent = `✈ ${list.length}`; chipEl.classList.remove('hidden'); } else chipEl.classList.add('hidden');
  try { state.openJoin = await tgCall('admin_tg_open_join'); $('openToggle').checked = !!state.openJoin; } catch (_) { /* old database */ }
}
async function makeInvite() {
  try {
    const code = await tgCall('admin_tg_invite');
    const link = `https://t.me/${BOT}?start=${code}`, o = $('tgInviteOut'); o.classList.remove('hidden');
    o.innerHTML = `<b>${esc(tt('tgInviteLink'))}</b><code>${esc(link)}</code><p class="note">${esc(tt('tgInviteHint'))}</p><button class="btn sky sm" id="invCopy" type="button">${esc(tt('uCopy'))}</button>`;
    $('invCopy').onclick = async () => { try { await navigator.clipboard.writeText(link); toast(tt('uCopied')); } catch (_) { window.prompt(tt('uCopy'), link); } };
  } catch (e) { console.error(e); toast(tt('tgNoRpc')); }
}

// ------------------------------------------------------------------ router + boot
const VIEWS = ['map', 'users', 'settings'];
function route() {
  let v = (location.hash.match(/#\/(\w+)/) || [])[1]; if (!VIEWS.includes(v)) v = 'map';
  if ((v === 'users' || v === 'settings') && !state.admin) v = 'map';
  VIEWS.forEach((n) => $('view-' + n).classList.toggle('hidden', n !== v));
  document.querySelectorAll('.tabs a, .bar a').forEach((a) => a.classList.toggle('on', a.dataset.view === v));
  if (v === 'map' && map) setTimeout(() => map.invalidateSize(), 60);
  if (v === 'users') refreshUsers();
  if (v === 'settings') renderSettings();
}
function buildBar() {
  const items = [['map', 'M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2zM9 4v14M15 6v14', 'navMap'], ['users', 'M2 20c0-3.5 3-5.5 7-5.5s7 2 7 5.5M9 4.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7z', 'navUsers'], ['settings', 'M21 4L3 11l6 2 2 6 3-4 5 4z', 'navSettings']];
  $('bar').innerHTML = items.filter(([v]) => v === 'map' || state.admin).map(([v, p, k]) => `<a href="#/${v}" data-view="${v}"><svg viewBox="0 0 24 24"><path d="${p}"/></svg><span>${esc(tt(k).split(' ')[0])}</span></a>`).join('');
}
async function checkAdmin() {
  if (DEMO) state.admin = true;
  else { try { const { data } = await sb.rpc('is_admin'); state.admin = data === true; } catch (_) { state.admin = false; } }
  $('tabUsers').classList.toggle('hidden', !state.admin); $('tabSet').classList.toggle('hidden', !state.admin);
  buildBar();
}
async function startApp() {
  $('login').classList.add('hidden'); $('app').classList.remove('hidden');
  $('demoTag').classList.toggle('hidden', !DEMO);
  if (!map) { initMap(); initRuler(); }
  setTimeout(() => map.invalidateSize(), 60);
  state.rows.clear(); state.fitted = false;
  await checkAdmin(); await load(); await loadUsers(); render(); subscribe(); route();
  loadPresence(); setInterval(() => { if (!$('view-map').classList.contains('hidden')) loadPresence(); }, 20000);
  setInterval(() => { renderFeed(); }, 60000);
  if (state.admin) renderSettings();
}
function showLogin() { $('app').classList.add('hidden'); $('login').classList.remove('hidden'); }
async function refreshAll() {
  $('btnRefresh').disabled = true;
  try { state.rows.clear(); await load(); await loadUsers(); await loadPresence(); render(); toast(tt('refreshed')); } finally { $('btnRefresh').disabled = false; }
}
async function main() {
  applyLang(); renderLayerPop && 0;
  document.querySelectorAll('[data-lang]').forEach((b) => b.addEventListener('click', () => { lang = b.dataset.lang; try { localStorage.setItem('pru_lang', lang); } catch (_) {} applyLang(); if (map) { renderLayerPop(); $('layerName').textContent = tt((visibleMaps(CFG).find((m) => m.id === state.layerId) || PRU_MAPS[0]).key); render(); buildBar(); route(); if (state.selected) openDetail(state.selected, true); } }));
  $('btnRefresh').onclick = refreshAll;
  $('btnRuler').onclick = () => { state.ruler.on ? rulerStop(false) : rulerStart(); };
  $('rulerCancel').onclick = () => rulerStop(false);
  // wide screens: the filters column sits beside the map, the button hides / shows it; phones: it slides up as a sheet
  const wideScreen = () => window.matchMedia('(min-width: 901px)').matches;
  const syncFilterBtn = () => $('btnFilters').classList.toggle('on', wideScreen() ? !$('rail').classList.contains('collapsed') : $('rail').classList.contains('open'));
  try { if (localStorage.getItem('pru_rail') === '0') $('rail').classList.add('collapsed'); } catch (_) {}
  $('btnFilters').onclick = () => {
    const r = $('rail');
    if (wideScreen()) { r.classList.toggle('collapsed'); try { localStorage.setItem('pru_rail', r.classList.contains('collapsed') ? '0' : '1'); } catch (_) {} setTimeout(() => { if (map) map.invalidateSize(); }, 60); }
    else r.classList.toggle('open');
    syncFilterBtn();
  };
  $('railClose').onclick = () => { $('rail').classList.remove('open'); syncFilterBtn(); };
  window.addEventListener('resize', syncFilterBtn); syncFilterBtn();
  $('btnLayers').onclick = (e) => { e.stopPropagation(); $('layerPop').classList.toggle('hidden'); };
  document.addEventListener('click', (e) => { if (!e.target.closest('.mapsw')) $('layerPop').classList.add('hidden'); });
  $('selVol').onchange = (e) => { state.vol = e.target.value; render(); fitVisible(); };
  $('liveToggle').onchange = drawVolunteers;
  document.querySelectorAll('.stabs button').forEach((b) => b.onclick = () => { state.side = b.dataset.st; document.querySelectorAll('.stabs button').forEach((x) => x.classList.toggle('on', x === b)); $('feed').classList.toggle('hidden', b.dataset.st !== 'feed'); $('list').classList.toggle('hidden', b.dataset.st !== 'list'); });
  $('side').addEventListener('click', (e) => { if (e.target.id === 'dBack' || e.target.id === 'xBack') $('side').classList.remove('full'); });
  $('btnNewUser').onclick = openUserForm;
  $('btnNoteAll').onclick = () => openNote(null);
  $('btnVolNote').onclick = () => { const u = state.users.find((x) => String(x.username).toLowerCase() === String(state.vol).toLowerCase()); if (u) openNote(u.username); };
  $('noteCancel').onclick = closeNote;
  $('mergeCancel').onclick = closeMerge;
  $('mergeModal').addEventListener('click', (e) => { if (e.target.id === 'mergeModal') closeMerge(); });
  $('noteModal').addEventListener('click', (e) => { if (e.target.id === 'noteModal') closeNote(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { if (!$('noteModal').classList.contains('hidden')) closeNote(); if (!$('mergeModal').classList.contains('hidden')) closeMerge(); } });
  $('btnInvite').onclick = makeInvite;
  $('openToggle').onchange = async (e) => { try { state.openJoin = await tgCall('admin_tg_open_join', { p_open: e.target.checked }); e.target.checked = !!state.openJoin; if (DEMO) { state.openJoin = e.target.checked; } toast(tt('saved')); } catch (_) { e.target.checked = !e.target.checked; toast(tt('tgNoRpc')); } };
  window.addEventListener('hashchange', route);
  if (DEMO) { $('btnOut').classList.add('hidden'); await startApp(); return; }
  sb = window.supabase.createClient(CFG.url, CFG.anonKey, { auth: { persistSession: true, autoRefreshToken: true } });
  $('btnOut').onclick = async () => { await sb.auth.signOut(); location.reload(); };
  $('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault(); $('loginErr').textContent = ''; const btn = e.target.querySelector('button[type=submit]'); btn.disabled = true;
    const { error } = await sb.auth.signInWithPassword({ email: $('email').value.trim(), password: $('password').value });
    btn.disabled = false;
    if (error) { $('loginErr').textContent = tt('errLogin'); return; }
    startApp();
  });
  const { data } = await sb.auth.getSession();
  if (data.session) startApp(); else showLogin();
}
main();
