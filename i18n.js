'use strict';
// PRU dashboard texts: every key is [Arabic, Turkish, English]. t(key) picks by the current language.
const LANGS = ['ar', 'tr', 'en'];
const S = {
  // general
  appTitle: ['PRU · سما تدمر', 'PRU · Sama Tadmor', 'PRU · Sama Tadmor'],
  brandSub: ['سما تدمر · لوحة التحكم', 'Sama Tadmor · Panel', 'Sama Tadmor · Control panel'],
  loginSub: ['لوحة متابعة بلاغات الطرق والخدمات', 'Yol ve hizmet bildirimleri paneli', 'Roads and city services reports panel'],
  email: ['البريد الإلكتروني', 'E-posta', 'Email'], password: ['كلمة المرور', 'Parola', 'Password'], signIn: ['دخول', 'Giriş', 'Sign in'], signOut: ['خروج', 'Çıkış', 'Sign out'],
  errLogin: ['تعذّر الدخول: تحقق من البريد وكلمة المرور.', 'Giriş yapılamadı: e-posta ve parolayı kontrol edin.', 'Could not sign in: check the email and password.'],
  demo: ['تجريبي', 'DEMO', 'DEMO'], cancel: ['إلغاء', 'İptal', 'Cancel'], close: ['إغلاق', 'Kapat', 'Close'], save: ['حفظ', 'Kaydet', 'Save'], saved: ['تم الحفظ', 'Kaydedildi', 'Saved'], back: ['رجوع', 'Geri', 'Back'],
  loadErr: ['تعذّر تحميل البيانات', 'Veriler yüklenemedi', 'Could not load the data'], saveErr: ['تعذّر الحفظ', 'Kaydedilemedi', 'Could not save'], actionErr: ['تعذّر تنفيذ العملية', 'İşlem yapılamadı', 'The action failed'],
  navMap: ['الخريطة', 'Harita', 'Map'], navUsers: ['المتطوعون', 'Gönüllüler', 'Volunteers'], navSettings: ['الإعدادات وتيليغرام', 'Ayarlar ve Telegram', 'Settings & Telegram'],
  // map toolbar + filters
  refresh: ['تحديث', 'Yenile', 'Refresh'], refreshed: ['تم التحديث', 'Güncellendi', 'Updated'], ruler: ['مسطرة', 'Cetvel', 'Ruler'], filters: ['الفلاتر', 'Filtreler', 'Filters'],
  rulerHint: ['اسحب على الخريطة لرسم مستطيل', 'Dikdörtgen çizmek için haritada sürükleyin', 'Drag on the map to draw a rectangle'],
  fVolunteer: ['المتطوع', 'Gönüllü', 'Volunteer'], fType: ['النوع', 'Tür', 'Type'], fStatus: ['الحالة', 'Durum', 'Status'], fPeriod: ['الفترة', 'Dönem', 'Period'],
  allVolunteers: ['كل المتطوعين', 'Tüm gönüllüler', 'All volunteers'],
  today: ['اليوم', 'Bugün', 'Today'], d7: ['٧ أيام', '7 gün', '7 days'], d30: ['٣٠ يوماً', '30 gün', '30 days'], all: ['الكل', 'Tümü', 'All'],
  liveShow: ['إظهار المتطوعين المباشرين', 'Canlı gönüllüleri göster', 'Show live volunteers'], liveHint: ['دوائر ذهبية (من وافق على المشاركة وتطبيقه مفتوح)', 'Altın daireler (paylaşmayı kabul edip uygulaması açık olanlar)', 'Gold circles (agreed to share, app open)'],
  liveNow: ['الآن', 'Şimdi', 'Now'], seenAgo: ['آخر ظهور قبل {n}', 'Son görülme {n} önce', 'Last seen {n} ago'], neverSeen: ['لم يظهر بعد', 'Henüz görülmedi', 'Not seen yet'],
  min: ['د', 'dk', 'min'], hour: ['س', 'sa', 'h'], day: ['يوم', 'gün', 'd'],
  // types
  pothole: ['حفرة', 'Çukur', 'Pothole'], bump: ['مطب', 'Kasis', 'Speed bump'], crack: ['شق', 'Çatlak', 'Crack'], crack_severe: ['شق خطير', 'Ciddi çatlak', 'Severe crack'],
  electric: ['كهرباء', 'Elektrik', 'Electricity'], water: ['مياه', 'Su', 'Water'], sewer: ['صرف', 'Kanalizasyon', 'Sewage'], telecom: ['اتصالات', 'Telekom', 'Telecom'],
  explosive: ['متفجرات', 'Patlayıcı', 'Explosives'], remnant: ['مخلفات حرب', 'Savaş kalıntısı', 'War remnants'], garden: ['حدائق', 'Parklar', 'Gardens'], other: ['أخرى', 'Diğer', 'Other'],
  // status
  new: ['جديد', 'Yeni', 'New'], in_progress: ['قيد الإصلاح', 'Onarımda', 'In progress'], fixed: ['تم الإصلاح', 'Onarıldı', 'Fixed'], rejected: ['مرفوض', 'Reddedildi', 'Rejected'],
  // kpis
  kTotal: ['الكل', 'Tümü', 'Total'], kFixed: ['تم الإصلاح', 'Onarıldı', 'Fixed'],
  // feed / list
  feed: ['الإشعارات المباشرة', 'Canlı bildirimler', 'Live notifications'], reports: ['البلاغات', 'Bildirimler', 'Reports'], empty: ['لا توجد بلاغات بهذه الفلاتر', 'Bu filtrelerle bildirim yok', 'No reports with these filters'],
  newReport: ['بلاغ جديد', 'Yeni bildirim', 'New report'], urgent: ['عاجل', 'ACİL', 'URGENT'], toTg: ['أُرسل إلى تيليغرام', 'Telegram’a gönderildi', 'Sent to Telegram'], noFeed: ['ستظهر هنا البلاغات الجديدة فور وصولها', 'Yeni bildirimler burada görünür', 'New reports appear here as they arrive'],
  // detail
  photo: ['الصورة', 'Fotoğraf', 'Photo'], noPhoto: ['لا توجد صورة', 'Fotoğraf yok', 'No photo'], loadingPhoto: ['جارٍ تحميل الصورة…', 'Fotoğraf yükleniyor…', 'Loading photo…'], blurNote: ['الوجوه واللوحات مموّهة', 'Yüzler ve plakalar bulanık', 'Faces and plates are blurred'],
  time: ['الوقت', 'Zaman', 'Time'], location: ['الإحداثيات', 'Koordinat', 'Coordinates'], accuracy: ['دقة الموقع', 'Konum doğruluğu', 'GPS accuracy'], reporter: ['المبلّغ', 'Bildiren', 'Reported by'],
  size: ['الأبعاد التقريبية', 'Yaklaşık boyut', 'Approx. size'], confirmations: ['عدد التأكيدات', 'Onay sayısı', 'Confirmations'], age: ['عمر البلاغ', 'Bildirim yaşı', 'Report age'], vnote: ['ملاحظة المتطوع', 'Gönüllü notu', 'Volunteer note'],
  source: ['المصدر', 'Kaynak', 'Source'], auto: ['كشف تلقائي', 'Otomatik tespit', 'Automatic detection'], manual: ['يدوي (زر التقاط)', 'Elle (Yakala)', 'Manual (Capture)'], m: ['م', 'm', 'm'], cm: ['سم', 'cm', 'cm'],
  ageLine: ['مضى عليه {n} يوماً دون إصلاح', '{n} gündür onarılmadı', 'Unrepaired for {n} days'], ageToday: ['بلاغ اليوم', 'Bugünün bildirimi', 'Reported today'],
  openMap: ['فتح في خرائط جوجل', 'Google Haritalar’da aç', 'Open in Google Maps'], directions: ['الاتجاهات', 'Yol tarifi', 'Directions'], share: ['مشاركة الإحداثيات', 'Koordinatları paylaş', 'Share coordinates'], copied: ['نُسخت الإحداثيات', 'Koordinatlar kopyalandı', 'Coordinates copied'],
  status: ['الحالة', 'Durum', 'Status'], note: ['ملاحظة للمتابعة (اختياري)', 'Takip notu (isteğe bağlı)', 'Follow-up note (optional)'], by: ['آخر تغيير', 'Son değişiklik', 'Last change'],
  aiQ: ['هل الكشف الآلي صحيح؟', 'Otomatik tespit doğru mu?', 'Is the automatic detection right?'], aiHint: ['قرارك يُستخدم لتدريب الذكاء الاصطناعي', 'Kararınız yapay zekâyı eğitmek için kullanılır', 'Your answer is used to train the AI'],
  aiOk: ['صحيح', 'Doğru', 'Right'], aiBad: ['خطأ', 'Yanlış', 'Wrong'],
  del: ['حذف البلاغ نهائياً', 'Bildirimi kalıcı sil', 'Delete the report for good'], delConfirm: ['حذف هذا البلاغ وصورته نهائياً؟ لا يمكن التراجع.', 'Bu bildirim ve fotoğrafı kalıcı olarak silinsin mi? Geri alınamaz.', 'Delete this report and its photo for good? This cannot be undone.'],
  deleted: ['حُذف البلاغ وصورته', 'Bildirim ve fotoğrafı silindi', 'Report and photo deleted'], fixedNote: ['«تم الإصلاح» يلوّن النقطة بالأخضر وتبقى ظاهرة', '“Onarıldı” noktayı yeşile boyar ve haritada kalır', '“Fixed” turns the point green and keeps it on the map'],
  // ruler / PDF
  rulerFound: ['{n} بلاغ داخل المنطقة', 'Bölgede {n} bildirim', '{n} reports inside the area'], pdfTitle: ['تصدير تقرير PDF', 'PDF raporu', 'Export PDF report'],
  pdfFilters: ['الفلاتر المفعّلة (يتبعها التقرير)', 'Etkin filtreler (rapor bunları izler)', 'Active filters (the report follows them)'],
  pdfNames: ['أسماء المبلّغين', 'Bildiren adları', 'Reporter names'], pdfPhotos: ['صور البلاغات', 'Bildirim fotoğrafları', 'Report photos'], pdfCoords: ['الإحداثيات ودقتها', 'Koordinat ve doğruluk', 'Coordinates and accuracy'],
  pdfGo: ['تصدير PDF', 'PDF olarak dışa aktar', 'Export PDF'], pdfHow: ['يُنزَّل الملف مباشرة على جهازك كملف PDF بلغة الواجهة المختارة، بشعار سما تدمر وألوان PRU.', 'Dosya doğrudan cihazınıza PDF olarak iner; seçili dilde, Sama Tadmor logosu ve PRU renkleriyle.', 'The file downloads straight to your device as a PDF in the chosen language, with the Sama Tadmor logo and the PRU colours.'], pdfBusy: ['جارٍ إنشاء ملف PDF…', 'PDF dosyası hazırlanıyor…', 'Creating the PDF file…'], pdfDone: ['تم تنزيل الملف', 'Dosya indirildi', 'The file was downloaded'], pdfPage: ['صفحة {a} من {b}', 'Sayfa {a} / {b}', 'Page {a} of {b}'],
  pdfReport: ['تقرير البلاغات', 'Bildirim raporu', 'Reports report'], pdfArea: ['المنطقة', 'Bölge', 'Area'], pdfNone: ['لا توجد بلاغات داخل هذه المنطقة', 'Bu bölgede bildirim yok', 'No reports inside this area'],
  csv: ['تصدير جدول', 'Tabloyu indir', 'Export table'],
  csvHead: [['المعرّف', 'الوقت', 'النوع', 'الحالة', 'خط العرض', 'خط الطول', 'الدقة (م)', 'المبلّغ', 'العرض (سم)', 'الطول (سم)', 'رابط الخريطة', 'ملاحظة المتطوع', 'ملاحظة'], ['Kimlik', 'Zaman', 'Tür', 'Durum', 'Enlem', 'Boylam', 'Doğruluk (m)', 'Bildiren', 'Genişlik (cm)', 'Uzunluk (cm)', 'Harita', 'Gönüllü notu', 'Not'], ['ID', 'Time', 'Type', 'Status', 'Latitude', 'Longitude', 'Accuracy (m)', 'Reporter', 'Width (cm)', 'Length (cm)', 'Map link', 'Volunteer note', 'Note']],
  // map layers
  mapLayer: ['الخريطة', 'Harita', 'Map'], lStreets: ['OpenStreetMap · شوارع', 'OpenStreetMap · Sokak', 'OpenStreetMap · Streets'], lEsriStreets: ['Esri · شوارع', 'Esri · Sokak', 'Esri · Streets'], lSat: ['Esri · أقمار صناعية', 'Esri · Uydu', 'Esri · Satellite'], lCarto: ['CARTO · شوارع', 'CARTO · Sokak', 'CARTO · Streets'],
  needsKey: ['يعمل بعد إضافة المفتاح', 'Anahtar eklenince çalışır', 'Works once the key is added'],
  mapsTitle: ['الخرائط المتاحة', 'Kullanılabilir haritalar', 'Available maps'], mapsNote: ['كل مستخدم يختار الخريطة التي تناسبه ويبدّلها بزر واحد في أي وقت؛ يُحفظ اختياره. تظهر خريطة CARTO تلقائياً عند إضافة مفتاحها المجاني.', 'Herkes kendine uygun haritayı seçer ve tek düğmeyle istediği zaman değiştirir; seçim kaydedilir. CARTO haritası ücretsiz anahtarı eklenince kendiliğinden görünür.', 'Everyone picks the map that suits them and can switch with one button any time; the choice is remembered. The CARTO map appears by itself once its free key is added.'],
  // users page
  uTotal: ['المتطوعون', 'Gönüllüler', 'Volunteers'], uOnline: ['متصلون الآن', 'Şu an çevrimiçi', 'Online now'], uSharing: ['يشاركون موقعهم', 'Konum paylaşan', 'Sharing location'], uRevokedK: ['موقوفون', 'Durdurulan', 'Revoked'],
  newUser: ['مستخدم جديد', 'Yeni kullanıcı', 'New user'], uName: ['اسم المستخدم', 'Kullanıcı adı', 'Username'], uCode: ['رمز التفعيل', 'Etkinleştirme kodu', 'Activation code'], uGen: ['توليد', 'Üret', 'Generate'], uCreate: ['إنشاء', 'Oluştur', 'Create'],
  uHint: ['رمز يعمل مرة واحدة على هاتف واحد، ويمكنك كتابته أو توليده.', 'Tek telefonda bir kez çalışan kod; yazabilir veya üretebilirsiniz.', 'A code that works once on one phone; type it or generate it.'],
  uCodeShown: ['أعطِ المستخدم الاسم والرمز التاليين. يظهر الرمز هنا مرة واحدة فقط، ويُحرق عند أول تفعيل على هاتف.', 'Kullanıcıya şu adı ve kodu verin. Kod burada yalnızca bir kez görünür ve ilk etkinleştirmede yanar.', 'Give the user this name and code. The code is shown only once and is burnt at the first activation.'],
  uCopy: ['نسخ', 'Kopyala', 'Copy'], uCopied: ['تم النسخ', 'Kopyalandı', 'Copied'],
  uWaiting: ['بانتظار التفعيل', 'Etkinleştirme bekliyor', 'Waiting for activation'], uActive: ['مفعّل على هاتف', 'Bir telefonda etkin', 'Active on one phone'], uRevoked: ['موقوف', 'Durduruldu', 'Revoked'],
  uReports: ['بلاغات', 'bildirim', 'reports'], uLast: ['آخر ظهور', 'Son görülme', 'Last seen'], uDevice: ['الجهاز', 'Cihaz', 'Device'], uShare: ['مشاركة الموقع', 'Konum paylaşımı', 'Location sharing'], uAgreed: ['موافق', 'Kabul', 'Agreed'], uNotShared: ['غير مفعّل', 'Kapalı', 'Off'],
  uReset: ['رمز جديد', 'Yeni kod', 'New code'], uRevoke: ['إيقاف', 'Durdur', 'Revoke'], uDelete: ['حذف', 'Sil', 'Delete'], uOnMap: ['على الخريطة', 'Haritada', 'On map'],
  uConfirmDelete: ['حذف هذا المستخدم؟ تبقى بلاغاته على الخريطة.', 'Bu kullanıcı silinsin mi? Bildirimleri haritada kalır.', 'Delete this user? Their reports stay on the map.'],
  uConfirmReset: ['إصدار رمز جديد؟ سينفصل الهاتف الحالي ولن يستطيع الإرسال.', 'Yeni kod verilsin mi? Mevcut telefonun bağlantısı kesilir.', 'Issue a new code? The current phone will be unbound.'],
  uConfirmRevoke: ['إيقاف هذا المستخدم؟ لن يستطيع هاتفه الإرسال.', 'Bu kullanıcı durdurulsun mu? Telefonu gönderemez.', 'Revoke this user? Their phone will not be able to send.'],
  uTaken: ['هذا الاسم مستعمل', 'Bu ad kullanılıyor', 'This name is taken'], uBad: ['اسم أو رمز غير صالح (الاسم ٢–٣٠ حرفاً، الرمز ٦ أحرف على الأقل)', 'Geçersiz ad veya kod (ad 2–30, kod en az 6 karakter)', 'Invalid name or code (name 2-30, code at least 6 characters)'],
  uNone: ['لا يوجد مستخدمون بعد', 'Henüz kullanıcı yok', 'No users yet'],
  usersNote: ['آخر ظهور = آخر نشاط للتطبيق. موقع المتطوع لا يُحفظ إلا بموافقته وأثناء فتح التطبيق، ويُحذف تلقائياً بعد مدة، ولا يراه إلا الإداريون.', 'Son görülme = uygulamanın son etkinliği. Konum yalnızca onayla ve uygulama açıkken kaydedilir, bir süre sonra otomatik silinir, yalnızca yöneticiler görür.', 'Last seen = last app activity. A position is stored only with consent and while the app is open, it is deleted automatically after a while, and only administrators see it.'],
  // settings + telegram
  tgConnected: ['البوت متصل', 'Bot bağlı', 'Bot connected'], tgBot: ['البوت', 'Bot', 'Bot'], tgDesc: ['قاعدة البيانات ترسل إشعارات البلاغات إلى البوت مباشرة، ولا يُستعمل واتساب.', 'Veritabanı bildirimleri doğrudan bota gönderir; WhatsApp kullanılmaz.', 'The database sends report notifications straight to the bot; WhatsApp is not used.'],
  tgAdmins: ['المشتركون في البوت', 'Bot aboneleri', 'Bot subscribers'], tgNone: ['لا أحد بعد. أنشئ رابط دعوة.', 'Henüz kimse yok. Davet bağlantısı oluşturun.', 'Nobody yet. Create an invite link.'],
  tgInvite: ['إنشاء رابط دعوة (لمرة واحدة)', 'Davet bağlantısı oluştur (tek kullanımlık)', 'Create an invite link (one use)'], tgInviteHint: ['صالح 48 ساعة ويعمل مرة واحدة. أرسله لمن تريد أن تصله الإشعارات.', '48 saat geçerli, tek kullanımlık. Bildirim almasını istediğiniz kişiye gönderin.', 'Valid 48 hours, one use. Send it to whoever should receive the notifications.'],
  tgRemove: ['إزالة', 'Kaldır', 'Remove'], tgRemoveConfirm: ['إزالة هذا المشترك؟ لن تصله إشعارات.', 'Bu abone kaldırılsın mı? Bildirim almaz.', 'Remove this subscriber? They will stop receiving notifications.'],
  tgWhat: ['ماذا يصل داخل البوت؟', 'Botta ne gelir?', 'What arrives in the bot?'],
  tgW1: ['كل بلاغ جديد فور وصوله: الصورة، النوع، المبلّغ، الموقع ودقته، الأبعاد التقريبية، الملاحظة', 'Her yeni bildirim hemen: fotoğraf, tür, bildiren, konum ve doğruluk, yaklaşık boyut, not', 'Every new report at once: photo, type, reporter, location and accuracy, approximate size, note'],
  tgW2: ['إشعار عاجل مميّز لبلاغات «متفجرات» مع تحذير', '“Patlayıcı” bildirimleri için uyarılı acil bildirim', 'A special urgent message for “Explosives” with a warning'],
  tgW3: ['زرّان: الموقع على الخريطة، ولوحة التحكم', 'İki düğme: haritada konum, kontrol paneli', 'Two buttons: location on the map, and the control panel'],
  tgOpen: ['انضمام مفتوح', 'Açık katılım', 'Open join'], tgOpenHint: ['عند التفعيل: كل من يضغط «ابدأ» في البوت تصله الإشعارات مباشرة. الافتراضي مغلق لأن أي شخص يجد اسم البوت سيرى أسماء المتطوعين وأماكن البلاغات.', 'Açıkken botta “Başlat”a basan herkes bildirim alır. Varsayılan kapalı: botu bulan herkes gönüllü adlarını ve yerleri görürdü.', 'When on, anyone who presses Start in the bot gets the notifications. Off by default: anyone finding the bot would see volunteers’ names and places.'],
  tgInviteLink: ['رابط الدعوة', 'Davet bağlantısı', 'Invite link'], tgNoRpc: ['ميزة تيليغرام تحتاج تحديث قاعدة البيانات أولاً.', 'Telegram özelliği önce veritabanı güncellemesi gerektirir.', 'The Telegram feature needs the database update first.'],
  // merge two volunteer accounts
  uMerge: ['دمج', 'Birleştir', 'Merge'], mergeTitle: ['دمج «{n}» في حساب آخر', '«{n}» hesabını başkasıyla birleştir', 'Merge “{n}” into another account'],
  mergeInto: ['ادمجه في الحساب (يبقى هذا الحساب)', 'Şu hesapla birleştir (bu hesap kalır)', 'Merge into this account (this one stays)'],
  mergeInfo: ['كل بلاغات «{n}» تنتقل إلى الحساب المختار ثم يُحذف «{n}» (لا يُحذف أي بلاغ). إن كان لـ«{n}» هاتف مفعّل فسيُسجَّل خروجه؛ اضغط «رمز جديد» على الحساب المختار ليدخل به.', '«{n}» hesabının tüm bildirimleri seçilen hesaba geçer, sonra «{n}» silinir (hiçbir bildirim silinmez). «{n}» için etkin bir telefon varsa oturumu kapanır; seçilen hesapta «Yeni kod» verin.', 'All of “{n}”’s reports move to the chosen account, then “{n}” is deleted (no report is deleted). If “{n}” has an active phone it is signed out; press “New code” on the chosen account to sign it in.'],
  mergeDo: ['دمج الآن', 'Şimdi birleştir', 'Merge now'], mergeReports: ['{n} بلاغ', '{n} bildirim', '{n} reports'],
  mergeConfirm: ['دمج «{a}» في «{k}»؟ لا يمكن التراجع.', '«{a}» hesabı «{k}» ile birleştirilsin mi? Geri alınamaz.', 'Merge “{a}” into “{k}”? This cannot be undone.'],
  mergeDone: ['تم الدمج: انتقل {n} بلاغ إلى «{k}»', 'Birleştirildi: {n} bildirim «{k}» hesabına geçti', 'Merged: {n} reports moved to “{k}”'],
  mergeNoRpc: ['ميزة الدمج تحتاج تحديث قاعدة البيانات (ملف الدمج).', 'Birleştirme için veritabanı güncellemesi gerekir (birleştirme dosyası).', 'Merging needs the database update (the merge file).'],
  mergeNone: ['لا يوجد حساب آخر للدمج معه', 'Birleştirilecek başka hesap yok', 'There is no other account to merge with'],
  // notes to volunteers
  noteBtn: ['✉ ملاحظة', '✉ Not', '✉ Note'], noteAll: ['📣 ملاحظة للجميع', '📣 Herkese not', '📣 Note to everyone'],
  noteToOne: ['ملاحظة إلى {n}', '{n} için not', 'Note to {n}'], noteToAll: ['ملاحظة لجميع المتطوعين', 'Tüm gönüllülere not', 'Note to all volunteers'],
  noteHintOne: ['تظهر لهذا المتطوع مرة واحدة فقط، عند أول فتح للتطبيق بعد الإرسال، ثم لا تظهر ثانية.', 'Bu gönüllüye yalnızca bir kez, gönderimden sonra uygulamayı ilk açtığında görünür; sonra bir daha görünmez.', 'Shown to this volunteer once only, the first time the app is opened after sending, and never again.'],
  noteHintAll: ['تظهر لكل متطوع مفعّل مرة واحدة فقط عند أول فتح للتطبيق، ثم لا تظهر ثانية.', 'Her etkin gönüllüye uygulamayı ilk açtığında yalnızca bir kez görünür.', 'Shown to every active volunteer once only, the first time they open the app.'],
  notePh: ['اكتب الملاحظة، مثلاً: اليوم أنت في شارع … قرب …', 'Notu yazın, örn. Bugün … sokağındasınız', 'Write the note, e.g. Today you are on … street'],
  noteSend: ['إرسال', 'Gönder', 'Send'], noteSent: ['أُرسلت الملاحظة', 'Not gönderildi', 'Note sent'], noteEmpty: ['اكتب نصاً أولاً', 'Önce bir metin yazın', 'Write some text first'], noteLeft: ['{n} حرفاً متبقياً', '{n} karakter kaldı', '{n} characters left'],
  notesSent: ['الملاحظات المرسلة', 'Gönderilen notlar', 'Sent notes'], noteNone: ['لم تُرسَل ملاحظات بعد', 'Henüz not gönderilmedi', 'No notes sent yet'], noteEveryone: ['الجميع', 'Herkes', 'Everyone'],
  noteRead: ['✓ قرأها', '✓ Okudu', '✓ Read'], noteWaiting: ['⏳ بانتظار فتح التطبيق', '⏳ Uygulamanın açılması bekleniyor', '⏳ Waiting for the app to open'], noteReadN: ['قرأها {a} من {b}', '{b} kişiden {a} okudu', 'Read by {a} of {b}'],
  noteDelete: ['حذف', 'Sil', 'Delete'], noteDeleteConfirm: ['حذف هذه الملاحظة؟ إن لم تُفتح بعد فلن تظهر لأحد.', 'Bu not silinsin mi? Henüz açılmadıysa kimseye gösterilmez.', 'Delete this note? If it has not been opened yet nobody will see it.'],
  noteNoRpc: ['ميزة الملاحظات تحتاج تحديث قاعدة البيانات أولاً.', 'Not özelliği önce veritabanı güncellemesi gerektirir.', 'The notes feature needs the database update first.'], noteCancel: ['إلغاء', 'Vazgeç', 'Cancel'],
  noteOnlyActive: ['الملاحظة تصل للمتطوعين المفعّلين على هاتف فقط', 'Not yalnızca bir telefonda etkin gönüllülere ulaşır', 'A note reaches only volunteers who are active on a phone'], noteMap: ['ملاحظة', 'Not', 'Note'], noteFilter: ['بلاغاته', 'Bildirimleri', 'His reports'],
  // report detail: enlarge + more
  enlarge: ['⤢ تكبير الصورة', '⤢ Fotoğrafı büyüt', '⤢ Enlarge photo'], photoAnn: ['الصورة مع الإطار', 'Çerçeveli fotoğraf', 'Photo with box'], photoClean: ['نسخة بدون إطار', 'Çerçevesiz kopya', 'Clean copy'],
  zoomIn: ['تكبير', 'Yakınlaştır', 'Zoom in'], zoomOut: ['تصغير', 'Uzaklaştır', 'Zoom out'], zoomReset: ['الحجم الأصلي', 'Orijinal boyut', 'Reset'], download: ['حفظ الصورة', 'Fotoğrafı kaydet', 'Save photo'], close: ['إغلاق', 'Kapat', 'Close'],
  moreDet: ['تفاصيل إضافية', 'Ek ayrıntılar', 'More details'], dReceived: ['وصل إلى الخادم', 'Sunucuya ulaştı', 'Reached the server'], dLastConf: ['آخر تأكيد', 'Son onay', 'Last confirmation'], dStatusAt: ['آخر تغيير للحالة', 'Son durum değişikliği', 'Status last changed'],
  dApp: ['نسخة التطبيق', 'Uygulama sürümü', 'App version'], dId: ['رقم البلاغ', 'Bildirim no', 'Report ID'], dSame: ['بلاغات هذا المتطوع', 'Bu gönüllünün bildirimleri', 'Reports by this volunteer'], dAiVerdict: ['تقييم الكشف الآلي', 'Otomatik tespit değerlendirmesi', 'AI verdict'],
  dNearby: ['بلاغات قريبة (ضمن {n} م)', 'Yakındaki bildirimler ({n} m içinde)', 'Nearby reports (within {n} m)'], dNoNearby: ['لا بلاغات أخرى قريبة', 'Yakında başka bildirim yok', 'No other reports nearby'],
  copyCoords: ['نسخ الإحداثيات', 'Koordinatları kopyala', 'Copy coordinates'], streetView: ['ستريت فيو', 'Sokak görünümü', 'Street View'], verdictNone: ['لم يُقيَّم بعد', 'Henüz değerlendirilmedi', 'Not rated yet'], unknown: ['غير معروف', 'Bilinmiyor', 'Unknown'],
  // misc
  versionLine: ['لوحة تحكم PRU · نسخة {v}', 'PRU kontrol paneli · sürüm {v}', 'PRU control panel · version {v}'],
};
let lang = (() => { try { return localStorage.getItem('pru_lang') || 'ar'; } catch (_) { return 'ar'; } })();
if (!LANGS.includes(lang)) lang = 'ar';
const t = (k, vars) => {
  const e = S[k];
  let s = e ? e[LANGS.indexOf(lang)] : k;
  if (Array.isArray(s)) return s;
  if (vars) for (const [a, b] of Object.entries(vars)) s = s.replace('{' + a + '}', b);
  return s;
};
