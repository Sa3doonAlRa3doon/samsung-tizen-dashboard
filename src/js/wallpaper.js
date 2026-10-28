/* Wallpaper display, collections and rotation, driven by Prefs.wallpaper. */
(function () {
    'use strict';

    var INTERVALS = [
        { key: 'open', label: 'Each time Home opens', ms: 0 },
        { key: '2.5s', label: '2.5 s', ms: 2500 },
        { key: '4s', label: '4 s', ms: 4000 },
        { key: '30s', label: '30 s', ms: 30 * 1000 },
        { key: '5m', label: '5 min', ms: 5 * 60 * 1000 },
        { key: '15m', label: '15 min', ms: 15 * 60 * 1000 },
        { key: '1h', label: '1 hour', ms: 60 * 60 * 1000 }
    ];

    var COLLECTIONS = [
        { key: 'sarajevo', label: 'Sarajevo' },
        { key: 'custom', label: 'My custom photos' },
        { key: 'all', label: 'All backgrounds' }
    ];

    var token = 0;
    var activeLayer = 0;

    function builtIns() { return window.WALLPAPERS || []; }

    function customList() {
        var urls = Prefs.get().wallpaper.custom || [];
        var legacy = urls.map(function (url, i) {
            return {
                key: 'custom-' + i,
                title: 'My photo ' + (i + 1),
                file: url,
                thumb: url,
                credit: 'Custom background',
                collection: 'custom'
            };
        });
        var uploaded = window.CustomPhotos ? CustomPhotos.list() : [];
        return legacy.concat(uploaded);
    }

    // Put the user's own pictures first so they are immediately visible in Settings.
    function list() { return customList().concat(builtIns()); }

    function find(key) {
        return list().find(function (w) { return w.key === key; }) || list()[0] || null;
    }

    function collection(key) {
        return COLLECTIONS.find(function (c) { return c.key === key; }) || COLLECTIONS[2];
    }

    function rotationList() {
        var key = collection(Prefs.get().wallpaper.collection).key;
        var all = list();
        var chosen = key === 'all' ? all : all.filter(function (w) { return w.collection === key; });
        // An empty custom collection should never leave the TV with a blank screen.
        return chosen.length ? chosen : builtIns().filter(function (w) { return w.collection === 'sarajevo'; });
    }

    function interval(key) {
        var found = INTERVALS.find(function (i) { return i.key === key; });
        return found || INTERVALS.find(function (i) { return i.key === '4s'; });
    }

    function layer(i) { return document.getElementById(i ? 'bg-b' : 'bg-a'); }

    // Decode the next image before fading it in, so a slow custom URL never flashes empty.
    function display(w) {
        var t = ++token;
        if (!w) {
            layer(0).classList.remove('visible');
            layer(1).classList.remove('visible');
            layer(0).style.backgroundImage = '';
            layer(1).style.backgroundImage = '';
            activeLayer = 0;
            return;
        }
        var img = new Image();
        img.onload = function () {
            if (t !== token) return;
            var nextLayer = activeLayer ? 0 : 1;
            layer(nextLayer).style.backgroundImage = 'url(' + JSON.stringify(w.file) + ')';
            layer(nextLayer).classList.add('visible');
            layer(activeLayer).classList.remove('visible');
            activeLayer = nextLayer;
        };
        img.onerror = function () { DevLog.log('Wallpaper failed to load: ' + w.file); };
        img.src = w.file;
    }

    function apply() {
        var p = Prefs.get().wallpaper;
        display(p.mode === 'off' ? null : find(p.photo));
    }

    function next() {
        var p = Prefs.get().wallpaper;
        var choices = p.mode === 'rotate' ? rotationList() : list();
        if (!choices.length) return null;
        var i = choices.findIndex(function (w) { return w.key === p.photo; });
        p.photo = choices[(i + 1) % choices.length].key;
        p.lastChange = Date.now();
        if (p.mode === 'off') p.mode = 'photo';
        Prefs.save();
        apply();
        return find(p.photo);
    }

    function selectCollection(key) {
        var p = Prefs.get().wallpaper;
        p.collection = collection(key).key;
        var choices = rotationList();
        if (choices.length && !choices.some(function (w) { return w.key === p.photo; })) {
            p.photo = choices[0].key;
        }
        p.lastChange = Date.now();
        Prefs.save();
        apply();
    }

    function due() {
        var p = Prefs.get().wallpaper;
        var ms = interval(p.interval).ms;
        return p.mode === 'rotate' && ms > 0 && Date.now() - p.lastChange >= ms;
    }

    function homeShown() {
        var p = Prefs.get().wallpaper;
        if (p.mode === 'rotate' && (p.interval === 'open' || due())) next();
    }

    function start() {
        apply();
        homeShown();
        setInterval(function () {
            if (window.Screensaver && Screensaver.isOpen()) return;
            if (!document.hidden && due()) next();
        }, 250);
    }

    window.Wallpaper = {
        INTERVALS: INTERVALS,
        COLLECTIONS: COLLECTIONS,
        list: list,
        find: find,
        collection: collection,
        rotationList: rotationList,
        interval: interval,
        apply: apply,
        next: next,
        selectCollection: selectCollection,
        homeShown: homeShown,
        start: start
    };
})();
