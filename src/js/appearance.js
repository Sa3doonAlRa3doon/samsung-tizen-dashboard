/* Clock, date and font settings (Prefs.appearance). */
(function () {
    'use strict';

    var FONTS = [
        { key: 'manrope', label: 'Manrope', family: '"Manrope"' },
        { key: 'inter', label: 'Inter', family: '"Inter"' },
        { key: 'outfit', label: 'Outfit', family: '"Outfit"' },
        { key: 'dm-sans', label: 'DM Sans', family: '"DM Sans"' }
    ];

    var LOCALES = [
        { key: 'en-GB', label: 'English' },
        { key: 'ar-AE', label: 'العربية' },
        { key: 'bs-BA', label: 'Bosanski' },
        { key: 'es-ES', label: 'Español' },
        { key: 'fr-FR', label: 'Français' },
        { key: 'de-DE', label: 'Deutsch' },
        { key: 'tr-TR', label: 'Türkçe' }
    ];

    var CLOCK_STYLES = [
        { key: 'digital-latin', label: 'Digital · English 123' },
        { key: 'digital-arabic', label: 'Digital · Arabic ١٢٣' },
        { key: 'analog', label: 'Analog' }
    ];

    var FALLBACK = ', "SamsungOne", "Helvetica Neue", Arial, sans-serif';

    function prefs() { return Prefs.get().appearance; }

    function font(key) {
        return FONTS.find(function (f) { return f.key === key; }) || FONTS[0];
    }

    function pad(n) { return String(n).padStart(2, '0'); }

    function arabicDigits(text) {
        return String(text).replace(/[0-9]/g, function (n) { return '٠١٢٣٤٥٦٧٨٩'[Number(n)]; });
    }

    // Returns { time: '16:05', suffix: '' } or { time: '4:05', suffix: 'PM' }.
    function time(d) {
        var result;
        if (prefs().clock === '12h') {
            var h = d.getHours() % 12 || 12;
            result = { time: h + ':' + pad(d.getMinutes()), suffix: d.getHours() < 12 ? 'AM' : 'PM' };
        } else {
            result = { time: pad(d.getHours()) + ':' + pad(d.getMinutes()), suffix: '' };
        }
        if (prefs().clockStyle === 'digital-arabic') {
            result.time = arabicDigits(result.time);
            if (result.suffix) result.suffix = d.getHours() < 12 ? 'ص' : 'م';
        }
        return result;
    }

    function date(d) {
        try {
            var text = d.toLocaleDateString(prefs().locale, { weekday: 'long', day: 'numeric', month: 'long' });
            return text.charAt(0).toUpperCase() + text.slice(1);
        } catch (e) {
            return d.toDateString();
        }
    }

    function apply() {
        var p = prefs();
        document.documentElement.style.setProperty('--font', font(p.font).family + FALLBACK);
        var home = document.getElementById('home');
        home.classList.toggle('names-focused', p.names === 'focused');
        home.classList.toggle('names-never', p.names === 'never');
        home.classList.toggle('no-date', !p.showDate);
        home.classList.toggle('clock-analog', p.clockStyle === 'analog');
        home.classList.toggle('clock-arabic', p.clockStyle === 'digital-arabic');
        home.classList.toggle('dock-two-rows', Number(p.dockRows) === 2);
        if (window.I18n) I18n.apply();
        var dock = document.getElementById('apps-row');
        if (dock) {
            dock._pos = 0;
            dock.style.transform = '';
        }
    }

    window.Appearance = {
        FONTS: FONTS,
        LOCALES: LOCALES,
        CLOCK_STYLES: CLOCK_STYLES,
        font: font,
        time: time,
        date: date,
        apply: apply
    };
})();
