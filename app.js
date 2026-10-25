'use strict';
// RoadSense live map for the officials: sign in, see every report on the map, open its photo, set its status.

const CFG = window.ROADSENSE || {};
const DEMO = !CFG.url || !CFG.anonKey || /[?&]demo\b/.test(location.search);

// ------------------------------------------------------------------ texts
const T = {
  ar: {
    appTitle: 'خريطة الطرق', loginSub: 'لوحة متابعة بلاغات الطرق والخدمات', email: 'البريد الإلكتروني', password: 'كلمة المرور', signIn: 'دخول', signOut: 'خروج', export: 'تصدير جدول',
    demo: 'تجريبي', fType: 'النوع', fStatus: 'الحالة', fPeriod: 'الفترة', latest: 'أحدث البلاغات', errLogin: 'تعذّر الدخول: تحقق من البريد وكلمة المرور.',
    pothole: 'حفرة', bump: 'مطب', crack: 'شق', crack_severe: 'شق خطير', electric: 'كهرباء', water: 'مياه', sewer: 'تمديدات صحية', telecom: 'اتصالات', other: 'أخرى', vnote: 'ملاحظة المتطوع',
    new: 'جديد', in_progress: 'قيد الإصلاح', fixed: 'تم الإصلاح', rejected: 'مرفوض',
    today: 'اليوم', d7: '٧ أيام', d30: '٣٠ يوماً', all: 'الكل',
    time: 'الوقت', location: 'الإحداثيات', accuracy: 'دقة الموقع', confidence: 'ثقة الكاشف', source: 'المصدر', auto: 'كشف تلقائي', manual: 'يدوي (زر التقاط)', m: 'م',
    photo: 'الصورة', noPhoto: 'لا توجد صورة', loadingPhoto: 'جارٍ تحميل الصورة…', openMap: 'فتح في خرائط جوجل', directions: 'الاتجاهات', status: 'الحالة', note: 'ملاحظة للمتابعة (اختياري)', save: 'حفظ', saved: 'تم الحفظ', back: 'رجوع',
    by: 'آخر تغيير', confirmations: 'عدد التأكيدات', ageLine: 'مضى عليه {n} يوماً دون إصلاح', ageToday: 'بلاغ اليوم', age: 'عمر البلاغ', share: 'مشاركة الإحداثيات', whatsapp: 'واتساب', copied: 'نُسخت الإحداثيات', fixedTotal: 'أُصلح حتى الآن', undo: 'تراجع', fixedDone: 'سيُحذف البلاغ وصورته بعد', secs: 'ث', deleted: 'حُذف البلاغ وصورته', archiveHint: 'المُصلَح مخفي — فعّل «تم الإصلاح» لرؤية الأرشيف', newReport: 'بلاغ جديد', empty: 'لا توجد بلاغات بهذه الفلاتر', total: 'الإجمالي', shown: 'المعروض', loadErr: 'تعذّر تحميل البلاغات', saveErr: 'تعذّر الحفظ',
    csvHead: ['المعرّف', 'الوقت', 'النوع', 'الحالة', 'خط العرض', 'خط الطول', 'الدقة (م)', 'الثقة', 'يدوي', 'رابط الخريطة', 'ملاحظة المتطوع', 'ملاحظة'],
  },
  tr: {
    appTitle: 'Yol Haritası', loginSub: 'Yol ve hizmet bildirimleri takip paneli', email: 'E-posta', password: 'Parola', signIn: 'Giriş', signOut: 'Çıkış', export: 'Tabloyu indir',
    demo: 'DEMO', fType: 'Tür', fStatus: 'Durum', fPeriod: 'Dönem', latest: 'Son bildirimler', errLogin: 'Giriş yapılamadı: e-posta ve parolayı kontrol edin.',
    pothole: 'Çukur', bump: 'Kasis', crack: 'Çatlak', crack_severe: 'Ciddi çatlak', electric: 'Elektrik', water: 'Su', sewer: 'Sıhhi tesisat', telecom: 'Telekom', other: 'Diğer', vnote: 'Gönüllü notu',
    new: 'Yeni', in_progress: 'Onarımda', fixed: 'Onarıldı', rejected: 'Reddedildi',
    today: 'Bugün', d7: '7 gün', d30: '30 gün', all: 'Tümü',
    time: 'Zaman', location: 'Koordinat', accuracy: 'Konum doğruluğu', confidence: 'Dedektör güveni', source: 'Kaynak', auto: 'Otomatik tespit', manual: 'Elle (Yakala düğmesi)', m: 'm',
    photo: 'Fotoğraf', noPhoto: 'Fotoğraf yok', loadingPhoto: 'Fotoğraf yükleniyor…', openMap: 'Google Haritalar\'da aç', directions: 'Yol tarifi', status: 'Durum', note: 'Takip notu (isteğe bağlı)', save: 'Kaydet', saved: 'Kaydedildi', back: 'Geri',
    by: 'Son değişiklik', confirmations: 'Onay sayısı', ageLine: '{n} gündür onarılmadı', ageToday: 'Bugünün bildirimi', age: 'Bildirim yaşı', share: 'Koordinatları paylaş', whatsapp: 'WhatsApp', copied: 'Koordinatlar kopyalandı', fixedTotal: 'Şimdiye kadar onarılan', undo: 'Geri al', fixedDone: 'Bildirim ve fotoğrafı silinecek:', secs: 'sn', deleted: 'Bildirim ve fotoğrafı silindi', archiveHint: 'Onarılanlar gizli — arşiv için «Onarıldı»yı açın', newReport: 'Yeni bildirim', empty: 'Bu filtrelerle bildirim yok', total: 'Toplam', shown: 'Gösterilen', loadErr: 'Bildirimler yüklenemedi', saveErr: 'Kaydedilemedi',
    csvHead: ['Kimlik', 'Zaman', 'Tür', 'Durum', 'Enlem', 'Boylam', 'Doğruluk (m)', 'Güven', 'Elle', 'Harita bağlantısı', 'Gönüllü notu', 'Not'],
  },
  en: {
    appTitle: 'Road Map', loginSub: 'Roads and city services reports dashboard', email: 'Email', password: 'Password', signIn: 'Sign in', signOut: 'Sign out', export: 'Export table',
    demo: 'DEMO', fType: 'Type', fStatus: 'Status', fPeriod: 'Period', latest: 'Latest reports', errLogin: 'Could not sign in: check the email and password.',
    pothole: 'Pothole', bump: 'Speed bump', crack: 'Crack', crack_severe: 'Severe crack', electric: 'Electricity', water: 'Water', sewer: 'Plumbing / sewage', telecom: 'Telecom', other: 'Other', vnote: 'Volunteer note',
    new: 'New', in_progress: 'In progress', fixed: 'Fixed', rejected: 'Rejected',
    today: 'Today', d7: '7 days', d30: '30 days', all: 'All',
    time: 'Time', location: 'Coordinates', accuracy: 'GPS accuracy', confidence: 'Detector confidence', source: 'Source', auto: 'Automatic detection', manual: 'By hand (Capture button)', m: 'm',
    photo: 'Photo', noPhoto: 'No photo', loadingPhoto: 'Loading photo…', openMap: 'Open in Google Maps', directions: 'Directions', status: 'Status', note: 'Follow-up note (optional)', save: 'Save', saved: 'Saved', back: 'Back',
    by: 'Last change', confirmations: 'Confirmations', ageLine: 'Unrepaired for {n} days', ageToday: 'Reported today', age: 'Report age', share: 'Share coordinates', whatsapp: 'WhatsApp', copied: 'Coordinates copied', fixedTotal: 'Fixed so far', undo: 'Undo', fixedDone: 'The report and its photo will be deleted in', secs: 's', deleted: 'Report and photo deleted', archiveHint: 'Fixed reports are hidden — switch on "Fixed" to see the archive', newReport: 'New report', empty: 'No reports with these filters', total: 'Total', shown: 'Shown', loadErr: 'Could not load the reports', saveErr: 'Could not save',
    csvHead: ['ID', 'Time', 'Type', 'Status', 'Latitude', 'Longitude', 'Accuracy (m)', 'Confidence', 'Manual', 'Map link', 'Volunteer note', 'Note'],
  },
};
let lang = (() => { try { return localStorage.getItem('rs_lang') || 'ar'; } catch (_) { return 'ar'; } })();
if (!T[lang]) lang = 'ar';
const t = (k) => T[lang][k] ?? k;

const COLORS = { pothole: '#FF4B3E', bump: '#FFC21A', crack: '#4DA3FF', crack_severe: '#B36BFF', electric: '#FF8A1F', water: '#19C3C3', sewer: '#A9714B', telecom: '#3CCB7F', other: '#9AA0A6' };
const RING = { new: '#FFFFFF', in_progress: '#FF9F1C', fixed: '#25D366', rejected: '#8A8F98' };
const TYPES = ['pothole', 'bump', 'crack_severe', 'crack', 'electric', 'water', 'sewer', 'telecom', 'other'];
const STATUSES = ['new', 'in_progress', 'fixed', 'rejected'];
const PERIODS = [['today', 1], ['d7', 7], ['d30', 30], ['all', 0]];

// ------------------------------------------------------------------ state
const $ = (id) => document.getElementById(id);
const state = { fixedTotal: 0, rows: new Map(), type: 'all', statuses: new Set(['new', 'in_progress']), period: 30, selected: null, user: null, fitted: false };
let sb = null, map = null, cluster = null;
const markers = new Map();

// ------------------------------------------------------------------ helpers
function applyLang() {
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  document.querySelectorAll('[data-i]').forEach((e) => { e.textContent = t(e.dataset.i); });
  document.querySelectorAll('[data-i-title]').forEach((e) => { e.title = t(e.dataset.iTitle); });
  document.title = t('appTitle');
  document.querySelectorAll('[data-lang]').forEach((b) => b.classList.toggle('on', b.dataset.lang === lang));
}
function fmtTime(iso) {
  try { return new Intl.DateTimeFormat(lang === 'ar' ? 'ar-SY-u-nu-latn' : lang, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso)); } catch (_) { return iso; }
}
function toast(msg) {
  const e = $('toast'); e.textContent = msg; e.classList.remove('hidden');
  clearTimeout(toast._t); toast._t = setTimeout(() => e.classList.add('hidden'), 3500);
}
const ageDays = (r) => Math.max(0, Math.floor((Date.now() - new Date(r.detected_at).getTime()) / 86400000));
const ageText = (r) => { const n = ageDays(r); return n < 1 ? t('ageToday') : t('ageLine').replace('{n}', n); };
const mapsLink = (r) => `https://www.google.com/maps?q=${r.lat},${r.lon}`;
const dirLink = (r) => `https://www.google.com/maps/dir/?api=1&destination=${r.lat},${r.lon}`;
const since = () => (state.period ? Date.now() - state.period * 86400000 : 0);
function visibleRows() {
  const s = since();
  return [...state.rows.values()].filter((r) => (state.type === 'all' || r.type === state.type) && state.statuses.has(r.status) && (!s || new Date(r.detected_at).getTime() >= s))
    .sort((a, b) => new Date(b.detected_at) - new Date(a.detected_at));
}

// ------------------------------------------------------------------ data
function seeded(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function demoRows() {
  const rnd = seeded(20261025), pts = window.TADMUR_POINTS || [], now = Date.now();
  const plan = { pothole: 9, bump: 6, crack_severe: 4, crack: 3, electric: 7, water: 5, sewer: 5, telecom: 4, other: 2 };
  const notes = {
    electric: ['سلك كهرباء واقع على الأرض قرب المدرسة', 'باب المحوّلة مخلوع ومفتوح', 'عمود كهرباء مائل ويحتاج تثبيت', 'أسلاك مكشوفة على الجدار'],
    water: ['صنبور مكسور والماء يسيل منذ الصباح', 'تسرّب مياه من الأنبوب على الرصيف', 'فتحة مياه بدون غطاء'],
    sewer: ['غطاء المنهل مفقود، خطر على السيارات', 'انسداد في الصرف والمياه تطفح', 'تمديد صرف مكسور'],
    telecom: ['خط هاتف مكشوف على الأرض', 'خزانة الاتصالات مفتوحة', 'كابل متدلٍّ فوق الطريق'],
    other: ['إنارة الشارع معطّلة', 'ركام يسدّ نصف الشارع'],
  };
  const types = []; for (const [k, n] of Object.entries(plan)) for (let i = 0; i < n; i++) types.push(k);
  for (let i = types.length - 1; i > 0; i--) { const k = Math.floor(rnd() * (i + 1)); [types[i], types[k]] = [types[k], types[i]]; }
  const stat = ['new', 'new', 'new', 'new', 'in_progress', 'new', 'in_progress', 'fixed', 'new', 'new', 'rejected'];
  return types.map((type, i) => {
    const p = pts[i % Math.max(1, pts.length)] || [34.5603 + (rnd() - .5) * .02, 38.2701 + (rnd() - .5) * .03];
    const list = notes[type], svc = !!list, age = rnd() * 20 * 86400000;
    return { id: 'demo-' + i, created_at: new Date(now - age).toISOString(), detected_at: new Date(now - age).toISOString(), type, lat: p[0], lon: p[1], accuracy_m: Math.round(4 + rnd() * 10),
      confidence: svc || rnd() < .25 ? null : +(.3 + rnd() * .6).toFixed(2), manual: svc || rnd() < .25, photo_path: null,
      note: svc ? list[Math.floor(rnd() * list.length)] : null, confirmations: 1 + Math.floor(rnd() * rnd() * 5), status: stat[i % stat.length], status_note: null, status_at: null };
  });
}
async function load() {
  if (DEMO) { demoRows().filter((r) => r.status !== 'fixed').forEach((r) => state.rows.set(r.id, r)); state.fixedTotal = 17; return; }
  const { data, error } = await sb.from('reports').select('*').order('detected_at', { ascending: false }).limit(5000);
  if (error) { toast(t('loadErr')); console.error(error); return; }
  data.forEach((r) => state.rows.set(r.id, r));
  const { count } = await sb.from('fixed_log').select('id', { count: 'exact', head: true });
  state.fixedTotal = count || 0;
  // clean-up of reports marked fixed earlier whose deletion did not finish (the page was closed during the undo time)
  const old = data.filter((r) => r.status === 'fixed' && r.status_at && Date.now() - new Date(r.status_at).getTime() > 3600000);
  for (const r of old) await purge(r.id, r.photo_path, true);
}
function subscribe() {
  if (DEMO) return;
  sb.channel('reports-live').on('postgres_changes', { event: '*', schema: 'public', table: 'reports' }, (p) => {
    const r = p.new && p.new.id ? p.new : null;
    if (!r) return;
    const isNew = p.eventType === 'INSERT';
    state.rows.set(r.id, r);
    render(); if (isNew) { toast(`${t('newReport')}: ${t(r.type)}`); pulse(r.id); }
    if (state.selected === r.id) openDetail(r.id, true);
  }).subscribe();
}

// ------------------------------------------------------------------ map
function initMap() {
  map = L.map('map', { zoomControl: true, attributionControl: true }).setView(CFG.center || [34.56, 38.27], CFG.zoom || 12);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' }).addTo(map);
  cluster = L.markerClusterGroup({ maxClusterRadius: 42, showCoverageOnHover: false });
  map.addLayer(cluster);
  map.on('click', () => closeDetail());
}
function pulse(id) {
  const m = markers.get(id); if (!m) return;
  map.setView(m.getLatLng(), Math.max(map.getZoom(), 15));
  setTimeout(() => { const el = m.getElement && m.getElement(); if (el) { el.classList.add('pulse'); setTimeout(() => el.classList.remove('pulse'), 5200); } }, 400);
}
function styleFor(r) {
  return { radius: Math.min(15, 9 + Math.floor(Math.log2(r.confirmations || 1) * 2)), color: RING[r.status] || '#fff', weight: 3, fillColor: COLORS[r.type] || '#888', fillOpacity: r.status === 'fixed' ? .45 : .95, opacity: 1 };
}

function fitVisible() { const rows = visibleRows(); if (rows.length) map.fitBounds(L.latLngBounds(rows.map((r) => [r.lat, r.lon])).pad(.2), { maxZoom: 16 }); }

// ------------------------------------------------------------------ render
function render() {
  const rows = visibleRows();
  cluster.clearLayers(); markers.clear();
  for (const r of rows) {
    const m = L.circleMarker([r.lat, r.lon], styleFor(r));
    m.on('click', (e) => { L.DomEvent.stopPropagation(e); openDetail(r.id); });
    markers.set(r.id, m); cluster.addLayer(m);
  }
  if (!state.fitted && rows.length) { state.fitted = true; map.fitBounds(L.latLngBounds(rows.map((r) => [r.lat, r.lon])).pad(.2), { maxZoom: 16 }); }
  renderCounts(); renderList(rows); renderChips();
}
function renderCounts() {
  const all = [...state.rows.values()]; const by = (f) => all.filter(f).length; const live = (r) => r.status !== 'rejected';
  const bar = $('counts'); bar.innerHTML = '';
  // the categories: tap one to see only it, tap "All" to see everything (same filter as the chips in the side panel)
  const tap = (key, label, n, color) => {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'cnt tp' + (state.type === key ? ' on' : '');
    b.innerHTML = `<i style="background:${color}"></i><span></span> <b>${n}</b>`; b.querySelector('span').textContent = label;
    b.onclick = () => { state.type = key; render(); fitVisible(); };
    bar.appendChild(b);
  };
  const info = (label, n, color) => {
    const d = document.createElement('div'); d.className = 'cnt';
    d.innerHTML = `<i style="background:${color}"></i><span></span> <b>${n}</b>`; d.querySelector('span').textContent = label; bar.appendChild(d);
  };
  tap('all', t('all'), by(live), '#B9B2A6');
  TYPES.forEach((k) => tap(k, t(k), by((r) => r.type === k && live(r)), COLORS[k]));
  info(t('new'), by((r) => r.status === 'new'), '#FF6A3D');
  info(t('in_progress'), by((r) => r.status === 'in_progress'), '#FF9F1C');
  info(t('fixedTotal'), state.fixedTotal + by((r) => r.status === 'fixed'), '#25D366');
}
function renderList(rows) {
  $('listCount').textContent = `${rows.length} / ${state.rows.size}`;
  const el = $('list');
  if (!rows.length) { el.innerHTML = `<div class="empty">${t('empty')}${state.statuses.has('fixed') ? '' : `<br><small>${t('archiveHint')}</small>`}</div>`; return; }
  el.innerHTML = '';
  for (const r of rows.slice(0, 200)) {
    const b = document.createElement('button'); b.className = 'item' + (state.selected === r.id ? ' sel' : '');
    b.innerHTML = `<span class="dot" style="background:${COLORS[r.type]};box-shadow:0 0 0 2.5px ${RING[r.status] === '#FFFFFF' ? 'rgba(0,0,0,.25)' : RING[r.status]}"></span><span class="sp"><div class="t"></div><div class="m"></div></span><span class="badge ${r.status}"></span>`;
    b.querySelector('.t').textContent = t(r.type) + (r.manual ? ' ✋' : '') + ((r.confirmations || 1) > 1 ? ` ×${r.confirmations}` : '');
    b.querySelector('.m').textContent = fmtTime(r.detected_at) + (r.note ? ' · ' + (r.note.length > 38 ? r.note.slice(0, 38) + '…' : r.note) : '');
    b.querySelector('.badge').textContent = t(r.status);
    b.onclick = () => { openDetail(r.id); const m = markers.get(r.id); if (m) map.setView(m.getLatLng(), Math.max(map.getZoom(), 16)); };
    el.appendChild(b);
  }
}
function chip(group, key, label, on, color) {
  const b = document.createElement('button'); b.className = 'chip' + (on ? ' on' : '');
  b.innerHTML = (color ? `<i style="background:${color}"></i>` : '') + '<span></span>'; b.querySelector('span').textContent = label;
  b.onclick = () => {
    if (group === 'type') { state.type = key; render(); fitVisible(); return; }   // one category at a time, or 'all'
    if (group === 'status') state.statuses.has(key) ? state.statuses.delete(key) : state.statuses.add(key);
    else state.period = key;
    render();
  };
  return b;
}
function renderChips() {
  const fill = (id, nodes) => { const e = $(id); e.innerHTML = ''; nodes.forEach((n) => e.appendChild(n)); };
  fill('chipType', ['all', ...TYPES].map((k) => chip('type', k, t(k), state.type === k, k === 'all' ? null : COLORS[k])));
  fill('chipStatus', STATUSES.map((k) => chip('status', k, t(k), state.statuses.has(k), RING[k] === '#FFFFFF' ? '#B9B2A6' : RING[k])));
  fill('chipPeriod', PERIODS.map(([k, d]) => chip('period', d, t(k), state.period === d)));
}

// ------------------------------------------------------------------ detail
function closeDetail() { state.selected = null; $('detail').classList.add('hidden'); $('list').querySelectorAll('.item.sel').forEach((e) => e.classList.remove('sel')); }
function demoPhoto(r) {
  const c = COLORS[r.type] || '#888';
  const box = (x, y, w, h) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" fill="none" stroke="${c}" stroke-width="5"/>`;
  const base = '<rect width="400" height="300" fill="#8EB7D6"/><rect y="130" width="400" height="170" fill="#6F7378"/><polygon points="200,130 30,300 370,300" fill="#7E8389"/>';
  let body;
  switch (r.type) {
    case 'bump': body = '<polygon points="70,215 330,215 360,255 40,255" fill="#E9B923"/>' + [...Array(9)].map((_, i) => `<polygon points="${75 + i * 30},215 ${90 + i * 30},215 ${94 + i * 30},255 ${79 + i * 30},255" fill="#222"/>`).join('') + box(35, 195, 330, 70); break;
    case 'crack': body = '<polyline points="150,180 175,205 165,235 205,260 215,290" fill="none" stroke="#15171A" stroke-width="4"/>' + box(135, 170, 100, 130); break;
    case 'crack_severe': body = '<polyline points="150,175 178,205 160,238 208,262 214,292" fill="none" stroke="#15171A" stroke-width="9"/><polyline points="178,205 230,215 262,245" fill="none" stroke="#15171A" stroke-width="6"/>' + box(130, 165, 150, 135); break;
    case 'electric': body = '<rect x="70" y="30" width="14" height="190" fill="#6B4A2B"/><rect x="40" y="55" width="80" height="8" fill="#6B4A2B"/><path d="M120 59 Q 200 170 270 255 T 340 262" fill="none" stroke="#111" stroke-width="3"/><polygon points="300,225 285,258 300,256 292,285 322,245 305,247" fill="#FFD400"/>' + box(250, 215, 110, 80); break;
    case 'water': body = '<rect x="40" y="190" width="150" height="16" fill="#9AA0A6"/><rect x="215" y="190" width="150" height="16" fill="#9AA0A6"/><ellipse cx="205" cy="255" rx="100" ry="22" fill="#4FC3F7" opacity=".55"/><path d="M190 195 Q 200 120 215 195" fill="none" stroke="#4FC3F7" stroke-width="6"/><path d="M192 195 Q 165 140 140 225" fill="none" stroke="#4FC3F7" stroke-width="5"/><path d="M212 195 Q 250 140 275 225" fill="none" stroke="#4FC3F7" stroke-width="5"/>' + box(110, 110, 190, 170); break;
    case 'sewer': body = '<ellipse cx="200" cy="230" rx="70" ry="24" fill="#8A8F98"/><ellipse cx="200" cy="230" rx="52" ry="16" fill="#0b0c0e"/>' + box(120, 195, 160, 70); break;
    case 'telecom': body = '<rect x="140" y="70" width="90" height="150" rx="4" fill="#7F8790"/><polygon points="230,70 285,90 285,210 230,220" fill="#5E656D"/><path d="M180 150 Q 190 250 240 262" stroke="#E53935" stroke-width="4" fill="none"/><path d="M165 150 Q 150 240 120 258" stroke="#1E88E5" stroke-width="4" fill="none"/><path d="M200 150 Q 215 230 300 250" stroke="#43A047" stroke-width="4" fill="none"/>' + box(100, 60, 200, 215); break;
    case 'other': body = '<polygon points="200,170 255,260 145,260" fill="#FFC107" stroke="#222" stroke-width="5"/><text x="200" y="250" font-size="52" font-weight="700" text-anchor="middle" fill="#222" font-family="sans-serif">!</text>' + box(130, 155, 140, 120); break;
    default: body = '<ellipse cx="190" cy="235" rx="62" ry="20" fill="#1c1d20"/>' + box(105, 195, 170, 66);
  }
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">${base}${body}<text x="12" y="288" font-size="15" fill="#fff" opacity=".85" font-family="sans-serif">DEMO</text></svg>`);
}
async function openDetail(id, silent) {
  const r = state.rows.get(id); if (!r) return;
  state.selected = id;
  const d = $('detail'); d.classList.remove('hidden');
  d.innerHTML = `<button class="back" id="dBack">${lang === 'ar' ? '→' : '←'} ${t('back')}</button>
    <div class="photo" id="dPhoto">${t('loadingPhoto')}</div>
    <h2><span class="dot" style="background:${COLORS[r.type]}"></span><span id="dType"></span><span class="badge ${r.status}" id="dBadge"></span></h2>
    <dl class="kv"><dt>${t('time')}</dt><dd class="rtl" id="dTime"></dd><dt>${t('location')}</dt><dd id="dLoc"></dd><dt>${t('accuracy')}</dt><dd class="rtl" id="dAcc"></dd><dt>${t('confidence')}</dt><dd class="rtl" id="dConf"></dd><dt>${t('source')}</dt><dd class="rtl" id="dSrc"></dd><dt>${t('confirmations')}</dt><dd class="rtl" id="dConfirm"></dd><dt>${t('age')}</dt><dd class="rtl" id="dAge"></dd>${r.note ? `<dt>${t('vnote')}</dt><dd class="rtl" id="dVNote"></dd>` : ''}</dl>
    <div class="links"><a class="lnk" target="_blank" rel="noopener" id="dMap">${t('openMap')}</a><a class="lnk alt" target="_blank" rel="noopener" id="dDir">${t('directions')}</a><button class="lnk share" id="dShare">${t('share')}</button><a class="lnk wa" target="_blank" rel="noopener" id="dWa">${t('whatsapp')}</a></div>
    <div class="stbox"><div class="gt">${t('status')}</div><div class="stbtns" id="dBtns"></div><textarea id="dNote" placeholder="${t('note')}" maxlength="480"></textarea><button class="save" id="dSave">${t('save')}</button><div class="who" id="dWho"></div></div>`;
  $('dBack').onclick = closeDetail;
  $('dType').textContent = t(r.type); $('dBadge').textContent = t(r.status);
  $('dTime').textContent = fmtTime(r.detected_at); $('dLoc').textContent = `${r.lat.toFixed(6)}, ${r.lon.toFixed(6)}`;
  $('dAcc').textContent = r.accuracy_m == null ? '—' : `${Math.round(r.accuracy_m)} ${t('m')}`;
  $('dConf').textContent = r.confidence == null ? '—' : `${Math.round(r.confidence * 100)}%`;
  $('dSrc').textContent = r.manual ? t('manual') : t('auto');
  $('dConfirm').textContent = String(r.confirmations || 1);
  $('dAge').textContent = ageText(r);
  if (r.note) $('dVNote').textContent = r.note;
  $('dMap').href = mapsLink(r); $('dDir').href = dirLink(r);
  const shareText = `${t(r.type)} - ${fmtTime(r.detected_at)}\n${r.note ? r.note + '\n' : ''}${ageText(r)}\n${r.lat.toFixed(6)}, ${r.lon.toFixed(6)}\n${mapsLink(r)}`;
  let photoUrl = null;
  $('dWa').href = 'https://wa.me/?text=' + encodeURIComponent(shareText);
  $('dShare').onclick = async () => {
    if (navigator.share) {
      try {
        if (photoUrl && navigator.canShare) {   // the photo goes with the text where the phone allows it
          const blob = await (await fetch(photoUrl)).blob();
          const file = new File([blob], 'report.jpg', { type: 'image/jpeg' });
          if (navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: t('appTitle'), text: shareText }); return; }
        }
        await navigator.share({ title: t('appTitle'), text: shareText }); return;
      } catch (e) { if (e && e.name === 'AbortError') return; }
    }
    try { await navigator.clipboard.writeText(shareText); toast(t('copied')); } catch (_) { window.prompt(t('share'), shareText); }
  };
  $('dNote').value = r.status_note || '';
  $('dWho').textContent = r.status_at ? `${t('by')}: ${fmtTime(r.status_at)}` : '';
  let chosen = r.status;
  const btns = $('dBtns');
  STATUSES.forEach((s) => { const b = document.createElement('button'); b.textContent = t(s); b.className = s === chosen ? 'on' : ''; b.onclick = () => { chosen = s; [...btns.children].forEach((x) => x.classList.remove('on')); b.classList.add('on'); }; btns.appendChild(b); });
  $('dSave').onclick = async () => {
    const note = $('dNote').value.trim() || null; $('dSave').disabled = true; const prev = r.status;
    if (DEMO) { r.status = chosen; r.status_note = note; r.status_at = new Date().toISOString(); }
    else {
      const { error } = await sb.from('reports').update({ status: chosen, status_note: note }).eq('id', r.id);
      if (error) { console.error(error); toast(t('saveErr')); $('dSave').disabled = false; return; }
      r.status = chosen; r.status_note = note; r.status_at = new Date().toISOString();
    }
    if (chosen === 'fixed' && prev !== 'fixed') { closeDetail(); render(); scheduleDelete(r, prev); return; }
    toast(t('saved')); render(); openDetail(r.id, true);
  };
  // photo
  const ph = $('dPhoto');
  if (!r.photo_path && !DEMO) { ph.textContent = t('noPhoto'); }
  else {
    let url = null;
    if (DEMO) url = demoPhoto(r);
    else { const { data, error } = await sb.storage.from('report-photos').createSignedUrl(r.photo_path, 900); if (!error) url = data.signedUrl; }
    if (state.selected !== id) return;
    if (url) { photoUrl = DEMO ? null : url; const img = new Image(); img.alt = ''; img.onload = () => { ph.textContent = ''; ph.appendChild(img); }; img.onerror = () => { ph.textContent = t('noPhoto'); }; img.src = url; img.onclick = () => lightbox(url); }
    else ph.textContent = t('noPhoto');
  }
  if (!silent) { render(); }
}
function lightbox(url) { const d = document.createElement('div'); d.className = 'lightbox'; d.innerHTML = '<img alt="">'; d.firstChild.src = url; d.onclick = () => d.remove(); document.body.appendChild(d); }

// ------------------------------------------------------------------ fixed reports leave the system (photo + row) so nothing piles up
async function purge(id, photoPath, quiet) {
  if (DEMO) { state.rows.delete(id); state.fixedTotal++; render(); if (!quiet) toast(t('deleted')); return; }
  if (photoPath) await sb.storage.from('report-photos').remove([photoPath]);
  const { error } = await sb.from('reports').delete().eq('id', id).eq('status', 'fixed');
  if (error) { console.error(error); return; }
  if (state.rows.delete(id)) state.fixedTotal++;
  if (state.selected === id) closeDetail();
  render(); if (!quiet) toast(t('deleted'));
}
function scheduleDelete(r, prev) {
  let left = 10;
  const bar = $('toast'); bar.classList.remove('hidden'); clearTimeout(toast._t);
  const draw = () => {
    bar.innerHTML = '';
    const s = document.createElement('span'); s.textContent = `${t('fixedDone')} ${left} ${t('secs')}`;
    const b = document.createElement('button'); b.textContent = t('undo'); b.style.cssText = 'margin-inline-start:12px;padding:2px 12px;border-radius:9px;background:#FF6A3D;color:#fff;font-weight:700';
    b.onclick = async () => { clearInterval(timer); bar.classList.add('hidden'); r.status = prev; if (!DEMO) await sb.from('reports').update({ status: prev }).eq('id', r.id); render(); };
    bar.append(s, b);
  };
  draw();
  const timer = setInterval(async () => {
    left--; if (left > 0) { draw(); return; }
    clearInterval(timer); bar.classList.add('hidden');
    await purge(r.id, r.photo_path, false);
  }, 1000);
}

// ------------------------------------------------------------------ export
function exportCsv() {
  const rows = visibleRows(); const q = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const lines = [T[lang].csvHead.map(q).join(',')];
  for (const r of rows) lines.push([r.id, r.detected_at, t(r.type), t(r.status), r.lat, r.lon, r.accuracy_m ?? '', r.confidence ?? '', r.manual ? 1 : 0, mapsLink(r), r.note ?? '', r.status_note ?? ''].map(q).join(','));
  const blob = new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `reports-${new Date().toISOString().slice(0, 10)}.csv`; a.click(); URL.revokeObjectURL(a.href);
}

// ------------------------------------------------------------------ boot
async function startApp() {
  $('login').classList.add('hidden'); $('app').classList.remove('hidden');
  $('demoTag').classList.toggle('hidden', !DEMO);
  if (!map) initMap();
  setTimeout(() => map.invalidateSize(), 50);
  state.rows.clear(); state.fitted = false;
  await load(); render(); subscribe();
}
function showLogin() { $('app').classList.add('hidden'); $('login').classList.remove('hidden'); }

async function main() {
  applyLang();
  document.querySelectorAll('[data-lang]').forEach((b) => b.addEventListener('click', () => { lang = b.dataset.lang; try { localStorage.setItem('rs_lang', lang); } catch (_) {} applyLang(); if (map) { render(); if (state.selected) openDetail(state.selected, true); } }));
  $('btnExport').onclick = exportCsv;
  $('btnFilters').onclick = () => $('panel').classList.toggle('showfilters');
  if (DEMO) { $('btnOut').classList.add('hidden'); await startApp(); return; }
  sb = window.supabase.createClient(CFG.url, CFG.anonKey, { auth: { persistSession: true, autoRefreshToken: true } });
  $('btnOut').onclick = async () => { await sb.auth.signOut(); location.reload(); };
  $('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault(); $('loginErr').textContent = ''; const btn = e.target.querySelector('button[type=submit]'); btn.disabled = true;
    const { error } = await sb.auth.signInWithPassword({ email: $('email').value.trim(), password: $('password').value });
    btn.disabled = false;
    if (error) { $('loginErr').textContent = t('errLogin'); return; }
    startApp();
  });
  const { data } = await sb.auth.getSession();
  if (data.session) startApp(); else showLogin();
}
main();
