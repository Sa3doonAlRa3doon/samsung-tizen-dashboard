/* Lightweight interface translations. The selected locale also drives date formatting. */
(function () {
    'use strict';

    var STRINGS = {
        'en-GB': {
            source: 'Source', wifi: 'Wi-Fi', bluetooth: 'Bluetooth', share: 'Share', settings: 'Settings',
            myDock: 'My dock · select + to add or reorder', consoles: 'Consoles', allApps: 'All apps',
            background: 'Background', wallpaper: 'Wallpaper', changeEvery: 'Change every',
            slideshowCollection: 'Slideshow collection', customBackgrounds: 'My custom backgrounds', photo: 'Photo',
            appearance: 'Appearance', navigationSound: 'Navigation sound', advanced: 'Advanced', dockApps: 'Dock apps',
            screenSaver: 'Screen saver', lab: 'Lab', clockFace: 'Clock face', clock: 'Clock', date: 'Date',
            interfaceLanguage: 'Interface and date language', font: 'Font', appNames: 'App names',
            bottomTaskbar: 'Bottom taskbar', off: 'Off', stillPhoto: 'Still photo', slideshow: 'Slideshow',
            addUrl: '+ Add image URL', syncPhotos: 'Sync phone / laptop photos', clearPhotos: 'Clear custom photos',
            uploadTitle: 'Phone and laptop photos', installApps: 'Install new apps', samsungHome: 'Samsung Home',
            permanent: 'Saved permanently on this TV', open: 'Open', hide: 'Hide', show: 'Show', always: 'Always',
            selected: 'When selected', never: 'Never', oneRow: '1 row', twoRows: '2 rows',
            twentyFour: '24-hour', twelve: '12-hour', select: 'Select', back: 'Back', change: 'Change', home: 'Home',
            returnFromApps: 'Return from apps', quickSettings: 'Quick settings',
            nextPrayer: 'Next prayer', prayerTimes: 'Prayer times', prayerUpdating: 'Updating prayer times…',
            prayerUnavailable: 'Waiting for schedule', prayerFajr: 'Fajr', prayerDhuhr: 'Dhuhr', prayerAsr: 'Asr',
            prayerMaghrib: 'Maghrib', prayerIsha: 'Isha'
        },
        'ar-AE': {
            source: 'المصدر', wifi: 'واي فاي', bluetooth: 'بلوتوث', share: 'مشاركة الشاشة', settings: 'الإعدادات',
            myDock: 'تطبيقاتي · اختر + للإضافة أو الترتيب', consoles: 'الأجهزة', allApps: 'كل التطبيقات',
            background: 'الخلفية', wallpaper: 'صورة الخلفية', changeEvery: 'التغيير كل',
            slideshowCollection: 'مجموعة العرض', customBackgrounds: 'صوري الخاصة', photo: 'الصورة',
            appearance: 'المظهر', navigationSound: 'صوت التنقل', advanced: 'متقدم', dockApps: 'تطبيقات الشريط',
            screenSaver: 'شاشة التوقف', lab: 'الاختبارات', clockFace: 'شكل الساعة', clock: 'الساعة', date: 'التاريخ',
            interfaceLanguage: 'لغة الواجهة والتاريخ', font: 'الخط', appNames: 'أسماء التطبيقات',
            bottomTaskbar: 'شريط التطبيقات السفلي', off: 'إيقاف', stillPhoto: 'صورة ثابتة', slideshow: 'عرض شرائح',
            addUrl: '+ إضافة رابط صورة', syncPhotos: 'مزامنة صور الهاتف / الكمبيوتر', clearPhotos: 'حذف الصور الخاصة',
            uploadTitle: 'صور الهاتف والكمبيوتر', installApps: 'تثبيت تطبيقات جديدة', samsungHome: 'واجهة سامسونج',
            permanent: 'محفوظة بشكل دائم على هذا التلفزيون', open: 'فتح', hide: 'إخفاء', show: 'إظهار', always: 'دائماً',
            selected: 'عند التحديد', never: 'أبداً', oneRow: 'صف واحد', twoRows: 'صفان',
            twentyFour: '24 ساعة', twelve: '12 ساعة', select: 'اختيار', back: 'رجوع', change: 'تغيير', home: 'الرئيسية',
            returnFromApps: 'العودة من التطبيقات', quickSettings: 'إعدادات سريعة',
            nextPrayer: 'الصلاة القادمة', prayerTimes: 'مواقيت الصلاة', prayerUpdating: 'جارٍ تحديث مواقيت الصلاة…',
            prayerUnavailable: 'في انتظار المواقيت', prayerFajr: 'الفجر', prayerDhuhr: 'الظهر', prayerAsr: 'العصر',
            prayerMaghrib: 'المغرب', prayerIsha: 'العشاء'
        },
        'bs-BA': {
            source: 'Izvor', wifi: 'Wi-Fi', bluetooth: 'Bluetooth', share: 'Dijeljenje', settings: 'Postavke',
            myDock: 'Moje aplikacije · odaberi + za dodavanje ili redoslijed', consoles: 'Konzole', allApps: 'Sve aplikacije',
            background: 'Pozadina', wallpaper: 'Slika pozadine', changeEvery: 'Promijeni svakih',
            slideshowCollection: 'Kolekcija slajdova', customBackgrounds: 'Moje slike', photo: 'Slika',
            appearance: 'Izgled', navigationSound: 'Zvuk navigacije', advanced: 'Napredno', dockApps: 'Aplikacije u traci',
            screenSaver: 'Čuvar ekrana', lab: 'Testovi', clockFace: 'Izgled sata', clock: 'Sat', date: 'Datum',
            interfaceLanguage: 'Jezik interfejsa i datuma', font: 'Font', appNames: 'Nazivi aplikacija',
            bottomTaskbar: 'Donja traka', off: 'Isključeno', stillPhoto: 'Jedna slika', slideshow: 'Slajdovi',
            addUrl: '+ Dodaj URL slike', syncPhotos: 'Sinhronizuj slike s telefona / laptopa', clearPhotos: 'Obriši moje slike',
            uploadTitle: 'Slike s telefona i laptopa', installApps: 'Instaliraj nove aplikacije', samsungHome: 'Samsung početna',
            permanent: 'Trajno spremljeno na ovom TV-u', open: 'Otvori', hide: 'Sakrij', show: 'Prikaži', always: 'Uvijek',
            selected: 'Kada je odabrano', never: 'Nikada', oneRow: '1 red', twoRows: '2 reda',
            twentyFour: '24 sata', twelve: '12 sati', select: 'Odaberi', back: 'Nazad', change: 'Promijeni', home: 'Početna',
            returnFromApps: 'Povratak iz aplikacija', quickSettings: 'Brze postavke',
            nextPrayer: 'Sljedeći namaz', prayerTimes: 'Vremena namaza', prayerUpdating: 'Ažuriranje vremena namaza…',
            prayerUnavailable: 'Čekanje rasporeda', prayerFajr: 'Sabah', prayerDhuhr: 'Podne', prayerAsr: 'Ikindija',
            prayerMaghrib: 'Akšam', prayerIsha: 'Jacija'
        },
        'es-ES': {
            source: 'Fuente', wifi: 'Wi-Fi', bluetooth: 'Bluetooth', share: 'Compartir', settings: 'Ajustes',
            myDock: 'Mi barra · selecciona + para añadir u ordenar', consoles: 'Consolas', allApps: 'Todas las apps',
            background: 'Fondo', wallpaper: 'Fondo de pantalla', changeEvery: 'Cambiar cada',
            slideshowCollection: 'Colección', customBackgrounds: 'Mis fondos', photo: 'Foto', appearance: 'Apariencia',
            navigationSound: 'Sonido de navegación', advanced: 'Avanzado', dockApps: 'Apps de la barra', screenSaver: 'Salvapantallas',
            lab: 'Pruebas', clockFace: 'Estilo de reloj', clock: 'Reloj', date: 'Fecha', interfaceLanguage: 'Idioma de interfaz y fecha',
            font: 'Fuente', appNames: 'Nombres de apps', bottomTaskbar: 'Barra inferior', off: 'Apagado',
            stillPhoto: 'Foto fija', slideshow: 'Presentación', addUrl: '+ Añadir URL',
            syncPhotos: 'Sincronizar fotos del móvil / portátil', clearPhotos: 'Borrar fotos propias',
            uploadTitle: 'Fotos del móvil y portátil', installApps: 'Instalar nuevas apps', samsungHome: 'Inicio Samsung',
            permanent: 'Guardado permanentemente en este TV', open: 'Abrir', hide: 'Ocultar', show: 'Mostrar', always: 'Siempre',
            selected: 'Al seleccionar', never: 'Nunca', oneRow: '1 fila', twoRows: '2 filas',
            twentyFour: '24 horas', twelve: '12 horas', select: 'Seleccionar', back: 'Atrás', change: 'Cambiar', home: 'Inicio',
            returnFromApps: 'Volver desde las apps', quickSettings: 'Ajustes rápidos',
            nextPrayer: 'Próxima oración', prayerTimes: 'Horarios de oración', prayerUpdating: 'Actualizando horarios…',
            prayerUnavailable: 'Esperando horarios', prayerFajr: 'Fajr', prayerDhuhr: 'Dhuhr', prayerAsr: 'Asr',
            prayerMaghrib: 'Maghrib', prayerIsha: 'Isha'
        },
        'fr-FR': {
            source: 'Source', wifi: 'Wi-Fi', bluetooth: 'Bluetooth', share: 'Partager', settings: 'Paramètres',
            myDock: 'Mon dock · sélectionnez + pour ajouter ou trier', consoles: 'Consoles', allApps: 'Toutes les applications',
            background: 'Arrière-plan', wallpaper: 'Fond d’écran', changeEvery: 'Changer toutes les',
            slideshowCollection: 'Collection', customBackgrounds: 'Mes arrière-plans', photo: 'Photo', appearance: 'Apparence',
            navigationSound: 'Son de navigation', advanced: 'Avancé', dockApps: 'Applications du dock', screenSaver: 'Économiseur d’écran',
            lab: 'Tests', clockFace: 'Style d’horloge', clock: 'Horloge', date: 'Date', interfaceLanguage: 'Langue de l’interface et de la date',
            font: 'Police', appNames: 'Noms des applications', bottomTaskbar: 'Barre inférieure', off: 'Désactivé',
            stillPhoto: 'Photo fixe', slideshow: 'Diaporama', addUrl: '+ Ajouter une URL',
            syncPhotos: 'Synchroniser les photos téléphone / PC', clearPhotos: 'Effacer mes photos',
            uploadTitle: 'Photos téléphone et PC', installApps: 'Installer des applications', samsungHome: 'Accueil Samsung',
            permanent: 'Enregistré définitivement sur ce téléviseur', open: 'Ouvrir', hide: 'Masquer', show: 'Afficher', always: 'Toujours',
            selected: 'Quand sélectionné', never: 'Jamais', oneRow: '1 ligne', twoRows: '2 lignes',
            twentyFour: '24 heures', twelve: '12 heures', select: 'Sélectionner', back: 'Retour', change: 'Modifier', home: 'Accueil',
            returnFromApps: 'Retour depuis les apps', quickSettings: 'Réglages rapides',
            nextPrayer: 'Prochaine prière', prayerTimes: 'Heures de prière', prayerUpdating: 'Mise à jour des horaires…',
            prayerUnavailable: 'En attente des horaires', prayerFajr: 'Fajr', prayerDhuhr: 'Dhuhr', prayerAsr: 'Asr',
            prayerMaghrib: 'Maghrib', prayerIsha: 'Isha'
        },
        'de-DE': {
            source: 'Quelle', wifi: 'WLAN', bluetooth: 'Bluetooth', share: 'Teilen', settings: 'Einstellungen',
            myDock: 'Meine Leiste · + zum Hinzufügen oder Sortieren', consoles: 'Konsolen', allApps: 'Alle Apps',
            background: 'Hintergrund', wallpaper: 'Hintergrundbild', changeEvery: 'Wechseln alle',
            slideshowCollection: 'Diashow-Sammlung', customBackgrounds: 'Meine Bilder', photo: 'Foto', appearance: 'Aussehen',
            navigationSound: 'Navigationston', advanced: 'Erweitert', dockApps: 'Apps in der Leiste', screenSaver: 'Bildschirmschoner',
            lab: 'Tests', clockFace: 'Uhrstil', clock: 'Uhr', date: 'Datum', interfaceLanguage: 'Sprache für Oberfläche und Datum',
            font: 'Schrift', appNames: 'App-Namen', bottomTaskbar: 'Untere Leiste', off: 'Aus', stillPhoto: 'Standbild',
            slideshow: 'Diashow', addUrl: '+ Bild-URL hinzufügen', syncPhotos: 'Fotos vom Handy / Laptop synchronisieren',
            clearPhotos: 'Eigene Fotos löschen', uploadTitle: 'Fotos vom Handy und Laptop', installApps: 'Neue Apps installieren',
            samsungHome: 'Samsung Home', permanent: 'Dauerhaft auf diesem Fernseher gespeichert', open: 'Öffnen', hide: 'Ausblenden',
            show: 'Anzeigen', always: 'Immer', selected: 'Bei Auswahl', never: 'Nie', oneRow: '1 Reihe', twoRows: '2 Reihen',
            twentyFour: '24 Stunden', twelve: '12 Stunden', select: 'Auswählen', back: 'Zurück', change: 'Ändern', home: 'Start',
            returnFromApps: 'Aus Apps zurückkehren', quickSettings: 'Schnelleinstellungen',
            nextPrayer: 'Nächstes Gebet', prayerTimes: 'Gebetszeiten', prayerUpdating: 'Gebetszeiten werden aktualisiert…',
            prayerUnavailable: 'Warte auf Zeitplan', prayerFajr: 'Fajr', prayerDhuhr: 'Dhuhr', prayerAsr: 'Asr',
            prayerMaghrib: 'Maghrib', prayerIsha: 'Isha'
        },
        'tr-TR': {
            source: 'Kaynak', wifi: 'Wi-Fi', bluetooth: 'Bluetooth', share: 'Paylaş', settings: 'Ayarlar',
            myDock: 'Uygulamalarım · eklemek veya sıralamak için + seçin', consoles: 'Konsollar', allApps: 'Tüm uygulamalar',
            background: 'Arka plan', wallpaper: 'Duvar kâğıdı', changeEvery: 'Değiştirme süresi',
            slideshowCollection: 'Slayt koleksiyonu', customBackgrounds: 'Kendi resimlerim', photo: 'Fotoğraf', appearance: 'Görünüm',
            navigationSound: 'Gezinme sesi', advanced: 'Gelişmiş', dockApps: 'Alt çubuk uygulamaları', screenSaver: 'Ekran koruyucu',
            lab: 'Testler', clockFace: 'Saat görünümü', clock: 'Saat', date: 'Tarih', interfaceLanguage: 'Arayüz ve tarih dili',
            font: 'Yazı tipi', appNames: 'Uygulama adları', bottomTaskbar: 'Alt çubuk', off: 'Kapalı', stillPhoto: 'Sabit fotoğraf',
            slideshow: 'Slayt gösterisi', addUrl: '+ Resim URL’si ekle', syncPhotos: 'Telefon / laptop fotoğraflarını eşitle',
            clearPhotos: 'Kendi fotoğraflarımı sil', uploadTitle: 'Telefon ve laptop fotoğrafları', installApps: 'Yeni uygulama yükle',
            samsungHome: 'Samsung Ana Sayfa', permanent: 'Bu TV’ye kalıcı olarak kaydedildi', open: 'Aç', hide: 'Gizle',
            show: 'Göster', always: 'Her zaman', selected: 'Seçilince', never: 'Asla', oneRow: '1 sıra', twoRows: '2 sıra',
            twentyFour: '24 saat', twelve: '12 saat', select: 'Seç', back: 'Geri', change: 'Değiştir', home: 'Ana sayfa',
            returnFromApps: 'Uygulamalardan dön', quickSettings: 'Hızlı ayarlar',
            nextPrayer: 'Sonraki namaz', prayerTimes: 'Namaz vakitleri', prayerUpdating: 'Namaz vakitleri güncelleniyor…',
            prayerUnavailable: 'Vakitler bekleniyor', prayerFajr: 'İmsak', prayerDhuhr: 'Öğle', prayerAsr: 'İkindi',
            prayerMaghrib: 'Akşam', prayerIsha: 'Yatsı'
        }
    };

    function locale() {
        try { return Prefs.get().appearance.locale || 'en-GB'; }
        catch (e) { return 'en-GB'; }
    }

    function t(key) {
        var chosen = STRINGS[locale()] || STRINGS['en-GB'];
        return chosen[key] || STRINGS['en-GB'][key] || key;
    }

    function apply() {
        var chosen = locale();
        document.documentElement.lang = chosen.split('-')[0];
        document.documentElement.dir = chosen === 'ar-AE' ? 'rtl' : 'ltr';
        Array.prototype.forEach.call(document.querySelectorAll('[data-i18n]'), function (node) {
            node.textContent = t(node.getAttribute('data-i18n'));
        });
        Array.prototype.forEach.call(document.querySelectorAll('[data-i18n-aria]'), function (node) {
            node.setAttribute('aria-label', t(node.getAttribute('data-i18n-aria')));
        });
    }

    window.I18n = { t: t, apply: apply, strings: STRINGS };
})();

