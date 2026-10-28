/* Home, All apps and Lab screens; app list loading, launching and HDMI inputs. */
(function () {
    'use strict';

    var CACHE_KEY = 'arn0.apps.v1';
    var REFRESH_AFTER_MS = 5 * 60 * 1000;
    var GRID_COLS = 5;

    var cfg = window.LAUNCHER_CONFIG;
    var log = DevLog.log;
    var $ = UI.$;
    var el = UI.el;
    var KEY = UI.KEY;
    function T(key) { return I18n.t(key); }

    var state = {
        apps: [],              // launchable apps from the TV (or the cache)
        appsSig: null,
        lastFetch: 0,
        showEverything: false, // All apps: bypass the consumer filter
        tvMode: false,         // HDMI shown inside the launcher
        hdmi: {}               // last known { port: connected }
    };
    var launchTimer = null;
    var systemOpening = false;
    var SAMSUNG_HOME = 'com.samsung.tv.csfs';
    var SMARTTHINGS = '3202311033054';
    var CAST_SETTINGS = 'ByJlgt0XeD.CastSettingsApp';

    // ---------- Tiles

    // Pre-coloured by scripts/build-marks.mjs
    function markEl(brand) {
        var m = new Image();
        m.className = 'mark';
        m.src = 'img/tiles/' + brand.key + '.svg';
        if (brand.pad) {
            m.style.top = brand.pad[0] + '%';
            m.style.height = (100 - 2 * brand.pad[0]) + '%';
            m.style.left = brand.pad[1] + '%';
            m.style.width = (100 - 2 * brand.pad[1]) + '%';
        }
        return m;
    }

    function initials(label) {
        var words = label.replace(/[^\w\s+]/g, ' ').trim().split(/\s+/);
        return (words[0] ? words[0][0] : '?') + (words[1] ? words[1][0] : '');
    }

    function hue(text) {
        var h = 0;
        for (var i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) % 360;
        return h;
    }

    // Installed apps report a native path; it may or may not be readable from a web app.
    function tryIcon(tile, mono, path) {
        var img = new Image();
        img.className = 'icon';
        img.onload = function () {
            mono.style.display = 'none';
            tile.appendChild(img);
        };
        img.src = path.charAt(0) === '/' ? 'file://' + path : path;
    }

    function tileFace(item) {
        var tile = el('div', 'tile');
        if (item.brand) {
            tile.style.background = item.brand.bg;
            if (item.brand.text) {
                var word = el('div', 'wordmark', item.brand.text);
                word.style.color = item.brand.fg;
                tile.appendChild(word);
            } else {
                tile.appendChild(markEl(item.brand));
            }
        } else {
            tile.style.background = 'hsl(' + hue(item.label) + ',32%,24%)';
            var mono = el('div', 'mono', initials(item.label).toUpperCase());
            tile.appendChild(mono);
            if (item.iconPath) tryIcon(tile, mono, item.iconPath);
        }
        return tile;
    }

    function appTile(item) {
        var wrap = el('div', 'app');
        wrap.appendChild(tileFace(item));
        wrap.appendChild(el('div', 'label', item.label));
        wrap._item = item;
        return wrap;
    }

    // Small tile used in Settings lists.
    function miniTile(item) {
        var wrap = el('div', 'mini');
        wrap.appendChild(tileFace(item));
        return wrap;
    }

    function allAppsTile() {
        var wrap = el('div', 'app');
        var tile = el('div', 'tile all-tile');
        tile.innerHTML = '<svg viewBox="0 0 24 24" fill="#fff"><rect x="3" y="3" width="7.5" height="7.5" rx="2"/>' +
            '<rect x="13.5" y="3" width="7.5" height="7.5" rx="2"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="2"/>' +
            '<rect x="13.5" y="13.5" width="7.5" height="7.5" rx="2"/></svg>';
        wrap.appendChild(tile);
        wrap.appendChild(el('div', 'label', T('allApps')));
        wrap._item = { kind: 'all' };
        return wrap;
    }

    function addAppTile() {
        var wrap = el('div', 'app');
        var tile = el('div', 'tile add-app-tile');
        tile.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.8" ' +
            'stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>';
        wrap.appendChild(tile);
        wrap.appendChild(el('div', 'label', '+ ' + T('dockApps')));
        wrap._item = { kind: 'edit-dock' };
        return wrap;
    }

    function inputTile(input) {
        var brand = findBrand(input.brand || '') || { bg: '#2a2f3a', fg: '#fff', mark: null };
        var wrap = el('div', 'input');
        var tile = el('div', 'tile');
        tile.style.background = brand.bg;
        if (brand.mark) tile.appendChild(markEl(brand));
        var meta = el('div', 'meta');
        meta.appendChild(el('div', 'name', input.label));
        var port = el('div', 'port');
        var dot = el('span', 'dot');
        port.appendChild(dot);
        port.appendChild(document.createTextNode('HDMI ' + input.hdmi));
        meta.appendChild(port);
        tile.appendChild(meta);
        wrap.appendChild(tile);
        wrap._item = { kind: 'input', hdmi: input.hdmi, label: input.label, method: input.method };
        wrap._dot = dot;
        return wrap;
    }

    // Console tile for Settings lists: brand colours and logo only.
    function miniInputTile(input) {
        var brand = findBrand(input.brand || '');
        return miniTile({ label: input.label, brand: brand && { key: brand.key, bg: brand.bg, fg: brand.fg, mark: brand.mark } });
    }

    // ---------- Home content

    // Consoles: edited list from Settings, else config.js.
    function inputs() {
        return Prefs.get().inputs || cfg.inputs || [];
    }

    function setInputs(list) {
        Prefs.get().inputs = list;
        Prefs.save();
        renderHome();
    }

    // Entries shown on Home: edited list from Settings, else config.js.
    function homeEntries() {
        return Prefs.get().home || cfg.apps || [];
    }

    function homeItems() {
        return Apps.curated(state.apps, { apps: homeEntries() });
    }

    function setHomeItems(items) {
        Prefs.get().home = items.map(function (i) {
            var entry = { id: i.id, label: i.label };
            if (i.brand) entry.brand = i.brand.key;
            return entry;
        });
        Prefs.save();
        renderHome();
    }

    function renderHome() {
        var row = $('apps-row');
        UI.resetScroll(row);
        row.innerHTML = '';
        var items = homeItems();
        if (!items.length) items = Apps.allSorted(state.apps, false).slice(0, 8);
        items.forEach(function (item) { row.appendChild(appTile(item)); });
        row.appendChild(addAppTile());

        var row2 = $('inputs-row');
        row2.innerHTML = '';
        inputs().forEach(function (input) {
            if (!input.hidden) row2.appendChild(inputTile(input));
        });
        $('inputs-section').classList.toggle('hidden', !row2.children.length);
        applyInputStatus();
        if (UI.isVisible('home')) UI.refresh();
    }

    function applyInputStatus() {
        UI.children($('inputs-row')).forEach(function (tile) {
            tile._dot.classList.toggle('on', state.hdmi[tile._item.hdmi] === true);
        });
    }

    function refreshInputStatus() {
        if (!inputs().length) return;
        Inputs.hdmiStatus().then(function (status) {
            state.hdmi = status;
            applyInputStatus();
        }).catch(function (err) {
            log('Input status unavailable: ' + DevLog.errorText(err));
        });
    }

    function renderAll() {
        var grid = $('all-grid');
        grid.innerHTML = '';
        UI.resetScroll(grid);
        var items = Apps.allSorted(state.apps, state.showEverything);
        items.forEach(function (item) { grid.appendChild(appTile(item)); });
        $('all-count').textContent = items.length + ' · ' + T('allApps');
    }

    function renderLab() {
        var actions = [
            { label: 'Send installed app list to log', run: labDumpApps },
            { label: 'Read inputs', run: labReadInputs },
            { label: 'Open Samsung TV viewer only', run: function () { runLogged('Open TV viewer', Inputs.openViewer()); } }
        ];
        if (window.Sound) actions = actions.concat(Sound.actions());
        if (window.Weather) actions = actions.concat(Weather.actions());
        if (window.RenderProbe) actions = actions.concat(RenderProbe.actions());
        if (window.PlatformProbe) actions = actions.concat(PlatformProbe.actions());
        inputs().forEach(function (input) {
            var item = { kind: 'input', hdmi: input.hdmi, label: input.label };
            var name = input.label + ' (HDMI ' + input.hdmi + ')';
            actions.push({ label: name + ': switch + viewer', run: function () { openInput(item, 'switch+viewer'); } });
            actions.push({ label: name + ': switch only', run: function () { openInput(item, 'switch'); } });
            actions.push({ label: name + ': inside launcher', run: function () { openInput(item, 'inapp'); } });
        });
        var list = $('lab-list');
        list.innerHTML = '';
        actions.forEach(function (a) {
            var li = el('li', '', a.label);
            li._item = { kind: 'lab', run: a.run };
            list.appendChild(li);
        });
        DevLog.onLine(function () {
            $('lab-log').textContent = DevLog.lines().slice(-26).join('\n');
        });
    }

    // ---------- Actions

    function runLogged(what, promise) {
        log(what + '…');
        return promise.then(function (v) {
            log(what + ': ok');
            return v;
        }, function (err) {
            log(what + ': FAILED ' + DevLog.errorText(err));
            throw err;
        });
    }

    function launchApp(item) {
        if (launchTimer) return;
        UI.toast('Opening ' + item.label + ' — press Home to return to Dashboard');
        launchTimer = setTimeout(function () {
            launchTimer = null;
            runLogged('Grouped launch ' + item.id, Apps.launchGrouped(item.id)).catch(function (err) {
                UI.toast('Could not open ' + item.label + ': ' + DevLog.errorText(err));
            });
        }, 1200);
    }

    function clearReturnAlarm() {
        try { tizen.alarm.removeAll(); }
        catch (e) { log('Return alarm clear failed: ' + DevLog.errorText(e)); }
    }

    function scheduleReturnAlarm(seconds) {
        try {
            clearReturnAlarm();
            var alarm = new tizen.AlarmRelative(seconds);
            var main = new tizen.ApplicationControl('http://tizen.org/appcontrol/operation/main');
            var appId = tizen.application.getCurrentApplication().appInfo.id;
            tizen.alarm.add(alarm, appId, main);
            return true;
        } catch (e) {
            log('Return alarm unavailable: ' + DevLog.errorText(e));
            return false;
        }
    }

    function openSettingPanel(label, operation) {
        if (systemOpening) return;
        systemOpening = true;
        var guarded = scheduleReturnAlarm(120);
        UI.toast('Opening ' + label + ' — ' + (guarded ? 'Dashboard returns automatically in 2 minutes' : 'press Back to return'));
        Apps.launchControl(operation, null, 'GROUP').catch(function (err) {
            log(label + ' panel unavailable: ' + DevLog.errorText(err));
            UI.toast(label + ' panel unavailable — opening Samsung Home');
            return Apps.launch(SAMSUNG_HOME);
        }).catch(function (err) {
            UI.toast('Could not open ' + label + ': ' + DevLog.errorText(err));
        }).then(function () { systemOpening = false; });
    }

    function wifiMenu() {
        tizen.systeminfo.getPropertyValue('WIFI_NETWORK', function (wifi) {
            var signal = typeof wifi.signalStrength === 'number' ? Math.round(wifi.signalStrength * 100) + '%' : 'unknown signal';
            var status = wifi.status === 'ON'
                ? 'Connected · ' + (wifi.ssid || 'Wi‑Fi') + ' · ' + signal
                : 'Wi‑Fi is off or disconnected';
            UI.menu('Wi‑Fi', [
                { label: status, run: function () { UI.toast((wifi.ipAddress || 'No IP address') + ' · ' + (wifi.securityMode || 'security unknown')); } },
                { label: 'Open Wi‑Fi network list · auto-return in 2 min', run: function () { openSettingPanel('Wi‑Fi', 'http://tizen.org/appcontrol/operation/setting/wifi'); } },
                { label: 'Refresh connection status', run: wifiMenu },
                { label: 'Open Samsung network settings', run: function () { Apps.launchGrouped(SAMSUNG_HOME); } }
            ]);
        }, function (err) {
            log('Wi‑Fi status unavailable: ' + DevLog.errorText(err));
            UI.menu('Wi‑Fi', [
                { label: 'Open Wi‑Fi network list · auto-return in 2 min', run: function () { openSettingPanel('Wi‑Fi', 'http://tizen.org/appcontrol/operation/setting/wifi'); } },
                { label: 'Open Samsung network settings', run: function () { Apps.launchGrouped(SAMSUNG_HOME); } }
            ]);
        });
    }

    function bluetoothMenu() {
        var supported = false;
        try { supported = !!tizen.systeminfo.getCapability('http://tizen.org/feature/network.bluetooth'); }
        catch (e) { log('Bluetooth capability unavailable: ' + DevLog.errorText(e)); }
        UI.menu('Bluetooth', [
            { label: supported ? 'Bluetooth is available on this TV' : 'Bluetooth status is managed by Samsung', run: function () { UI.toast('Use the device list below to pair speakers, headphones or remotes'); } },
            { label: 'Open Bluetooth device list · auto-return in 2 min', run: function () { openSettingPanel('Bluetooth', 'http://tizen.org/appcontrol/operation/setting/bt_enable'); } },
            { label: 'Open SmartThings / Connected Devices', run: function () {
                Apps.launchGrouped(SMARTTHINGS).catch(function () { return Apps.launchGrouped(SAMSUNG_HOME); });
            } },
            { label: 'Open Samsung settings', run: function () { Apps.launchGrouped(SAMSUNG_HOME); } }
        ]);
    }

    function openScreenShare() {
        if (systemOpening) return;
        systemOpening = true;
        UI.toast('Opening phone sharing — on your phone choose Smart View, then this TV');
        Apps.launch(CAST_SETTINGS).catch(function () {
            return Apps.launch(SMARTTHINGS);
        }).catch(function (err) {
            log('Share panels unavailable: ' + DevLog.errorText(err));
            UI.toast('Opening Samsung Home — choose Connected Devices / Screen Mirroring');
            return Apps.launch(SAMSUNG_HOME);
        }).catch(function (err) {
            UI.toast('Could not open screen sharing: ' + DevLog.errorText(err));
        }).then(function () { systemOpening = false; });
    }

    function dockRows() {
        var items = UI.children($('apps-row'));
        if (Number(Prefs.get().appearance.dockRows) !== 2) return [items];
        var top = [];
        var bottom = [];
        items.forEach(function (item, i) { (i % 2 ? bottom : top).push(item); });
        return [top, bottom];
    }

    function openInput(item, method) {
        method = method || item.method || cfg.inputMethod;
        UI.toast('Switching to ' + item.label + '…');
        runLogged('Input HDMI ' + item.hdmi + ' via ' + method, Inputs.open(item.hdmi, method)).then(function (result) {
            log('Current source now: ' + Inputs.describeSource(Inputs.current()));
            if (result === 'inapp') enterTvMode();
        }).catch(function (err) {
            UI.toast('Could not switch to ' + item.label + ': ' + DevLog.errorText(err));
        });
    }

    function openDiscoveredSource(src, label) {
        var method = cfg.inputMethod;
        UI.toast('Switching to ' + label + '…');
        runLogged('Input ' + Inputs.describeSource(src) + ' via ' + method,
            Inputs.openSource(src, method)).then(function (result) {
            log('Current source now: ' + Inputs.describeSource(Inputs.current()));
            if (result === 'inapp') enterTvMode();
        }).catch(function (err) {
            UI.toast('Could not switch to ' + label + ': ' + DevLog.errorText(err));
        });
    }

    function sourceMenu() {
        Inputs.sources().then(function (info) {
            var items = [];
            var seen = {};
            function add(src, connected) {
                var key = src.type + ':' + src.number;
                if (seen[key]) return;
                seen[key] = true;
                items.push({ src: src, connected: connected });
            }
            (info.connected || []).forEach(function (src) { add(src, true); });
            (info.disconnected || []).forEach(function (src) { add(src, false); });
            items.sort(function (a, b) {
                if (a.src.type === 'TV' && b.src.type !== 'TV') return -1;
                if (a.src.type !== 'TV' && b.src.type === 'TV') return 1;
                return (a.src.number || 0) - (b.src.number || 0);
            });
            var options = items.map(function (entry) {
                var label = entry.src.type === 'TV' ? 'Live TV' : entry.src.type + ' ' + entry.src.number;
                return {
                    label: label + (entry.connected ? '  ·  connected' : '  ·  not connected'),
                    run: function () { openDiscoveredSource(entry.src, label); }
                };
            });
            if (!options.length) {
                UI.toast('The TV did not report any inputs');
                return;
            }
            UI.menu('TV & HDMI sources', options);
        }).catch(function (err) {
            UI.toast('Could not read inputs: ' + DevLog.errorText(err));
        });
    }

    function enterTvMode() {
        state.tvMode = true;
        document.documentElement.classList.add('tv-mode');
    }

    function exitTvMode() {
        state.tvMode = false;
        document.documentElement.classList.remove('tv-mode');
        Inputs.hide().catch(function (err) { log('Hide input failed: ' + DevLog.errorText(err)); });
    }

    function labDumpApps() {
        runLogged('App list', Apps.getInstalledApps()).then(function (apps) {
            log('apps: ' + apps.length + ' total, ' + apps.filter(function (a) { return a.show; }).length + ' with show=true',
                apps.map(Apps.describe));
            UI.toast('Sent ' + apps.length + ' apps to the log');
        }).catch(function () {});
    }

    function labReadInputs() {
        runLogged('Inputs', Inputs.sources()).then(function (info) {
            var fmt = function (list) { return (list || []).map(Inputs.describeSource).join(', ') || 'none'; };
            log('connected: ' + fmt(info.connected));
            log('disconnected: ' + fmt(info.disconnected));
            log('current: ' + Inputs.describeSource(Inputs.current()));
        }).catch(function () {});
    }

    function nextWallpaper() {
        var w = Wallpaper.next();
        if (w) UI.toast(w.title + (w.credit ? ' · ' + w.credit : ''));
    }

    // Colour keys are hidden shortcuts; everything is also reachable from Settings.
    function colourKey(k, view) {
        if (k === KEY.RED || k === KEY.R) {
            UI.show(view === 'all' ? 'home' : 'all');
        } else if (k === KEY.GREEN || k === KEY.G) {
            if (view === 'home') nextWallpaper();
        } else if (k === KEY.BLUE || k === KEY.B) {
            UI.show(view === 'lab' ? 'home' : 'lab');
        } else if (k === KEY.YELLOW || k === KEY.Y) {
            if (view === 'all') {
                state.showEverything = !state.showEverything;
                UI.show('all', { back: true });
            } else if (view === 'home' && window.RunnerGame) {
                RunnerGame.open();
            } else return false;
        } else {
            return false;
        }
        return true;
    }

    // ---------- Clock, data, lifecycle

    function updateClock() {
        var d = new Date();
        var t = Appearance.time(d);
        $('time-main').textContent = t.time;
        $('time-suffix').textContent = t.suffix;
        $('date').textContent = Appearance.date(d);
        $('analog-hour').style.transform = 'translateX(-50%) rotate(' + ((d.getHours() % 12) * 30 + d.getMinutes() * 0.5) + 'deg)';
        $('analog-minute').style.transform = 'translateX(-50%) rotate(' + (d.getMinutes() * 6 + d.getSeconds() * 0.1) + 'deg)';
        $('analog-second').style.transform = 'translateX(-50%) rotate(' + (d.getSeconds() * 6) + 'deg)';
    }

    // The TV takes ~4 s to list its ~450 apps, so Home is drawn from the last list we saw
    // and only redrawn if a fresh list differs.
    function readCache() {
        try {
            return JSON.parse(localStorage.getItem(CACHE_KEY));
        } catch (e) {
            return null;
        }
    }

    function writeCache(apps) {
        try {
            localStorage.setItem(CACHE_KEY, JSON.stringify(apps));
        } catch (e) {
            // Without the cache we only lose the fast start.
        }
    }

    var listeners = [];
    /*
     * Hidden game code: Left and Right alternating three times.
     *
     * Two properties matter on a remote. It is matched against the tail of the last few keys,
     * not with a position counter, because a held key repeats and one extra press would
     * otherwise reset progress so the code could never complete. And it alternates rather than
     * repeating a key, because both auto-repeat and sweeping along a row produce runs of the
     * same key — a code made of runs fires by accident during ordinary browsing.
     */
    var gameCode = [KEY.LEFT, KEY.RIGHT, KEY.LEFT, KEY.RIGHT, KEY.LEFT, KEY.RIGHT];
    var recentKeys = [];

    function gameCodeEntered(k) {
        recentKeys.push(k);
        if (recentKeys.length > gameCode.length) recentKeys.shift();
        if (recentKeys.length < gameCode.length) return false;
        for (var i = 0; i < gameCode.length; i++) {
            if (recentKeys[i] !== gameCode[i]) return false;
        }
        recentKeys.length = 0;
        return true;
    }

    function setApps(apps) {
        var firstLoad = !state.apps.length;
        var sig = apps.map(function (a) { return a.id + '|' + a.name + '|' + a.show; }).join(',');
        if (sig === state.appsSig) return;
        state.appsSig = sig;
        state.apps = apps;
        renderHome();
        if (firstLoad && UI.isVisible('home') && $('apps-row').firstElementChild) {
            UI.focusOn($('apps-row').firstElementChild);
        }
        if (UI.isVisible('all')) UI.show('all', { back: true });
        listeners.forEach(function (fn) { fn(); });
    }

    function loadApps() {
        state.lastFetch = Date.now();
        return Apps.getInstalledApps().then(function (apps) {
            var list = Apps.launchable(apps).map(function (a) {
                return { id: a.id, name: a.name, show: a.show, iconPath: a.iconPath || '' };
            });
            writeCache(list);
            setApps(list);
        }).catch(function (err) {
            UI.toast('Could not list apps: ' + DevLog.errorText(err));
            log('App list failed: ' + DevLog.errorText(err));
        });
    }

    function registerKeys() {
        try {
            tizen.tvinputdevice.registerKeyBatch(['ColorF0Red', 'ColorF1Green', 'ColorF2Yellow', 'ColorF3Blue']);
        } catch (e) {
            log('Colour keys unavailable: ' + DevLog.errorText(e));
        }
    }

    function registerViews() {
        UI.register('home', {
            el: $('home'),
            startRow: 1,
            hints: function () {
                return [['OK', T('open')], ['▲', T('quickSettings')], ['▼', T('allApps')], ['Home', T('returnFromApps')]];
            },
            rows: function () {
                return [UI.children($('quick-actions'))].concat(dockRows());
            },
            activate: function (item) {
                if (item.kind === 'app') launchApp(item);
                else if (item.kind === 'all') UI.show('all');
                else if (item.kind === 'input') openInput(item);
                else if (item.kind === 'source') sourceMenu();
                else if (item.kind === 'settings') UI.show('settings');
                else if (item.kind === 'edit-dock') UI.show('homeapps');
                else if (item.kind === 'wifi') wifiMenu();
                else if (item.kind === 'bluetooth') bluetoothMenu();
                else if (item.kind === 'share') openScreenShare();
            },
            // Home is the root: Back does nothing.
            onBack: function () { return true; }
        });
        $('gear')._item = { kind: 'settings' };
        $('source')._item = { kind: 'source' };
        $('wifi')._item = { kind: 'wifi' };
        $('bluetooth')._item = { kind: 'bluetooth' };
        $('share')._item = { kind: 'share' };

        UI.register('all', {
            el: $('all'),
            rows: function () { return UI.chunk(UI.children($('all-grid')), GRID_COLS); },
            onShow: renderAll,
            activate: launchApp,
            hints: function () { return [['OK', T('open')], ['Back', T('home')]]; }
        });

        UI.register('lab', {
            el: $('lab'),
            rows: function () { return UI.children($('lab-list')).map(function (li) { return [li]; }); },
            activate: function (item) { item.run(); },
            hints: [['OK', 'Run'], ['Back', 'Home']]
        });
    }

    function init() {
        clearReturnAlarm();
        registerKeys();
        registerViews();
        UI.setColourKey(colourKey);
        UI.setKeyHook(function (k) {
            if (state.tvMode) {
                if (k === KEY.BACK || k === KEY.ESC || k === KEY.BACKSPACE) exitTvMode();
                return true;
            }
            if (!UI.isVisible('home')) { recentKeys.length = 0; return false; }
            var focused = document.querySelector('.focused');
            if (k === KEY.DOWN && focused && focused.parentNode && focused.parentNode.id === 'apps-row') {
                if (Number(Prefs.get().appearance.dockRows) === 2) {
                    var index = UI.children($('apps-row')).indexOf(focused);
                    if (index % 2 === 0 && index + 1 < $('apps-row').children.length) return false;
                }
                UI.show('all');
                return true;
            }
            if (gameCodeEntered(k)) {
                if (window.RunnerGame) RunnerGame.open(true);
                return true;
            }
            return false;
        });
        Appearance.apply();
        updateClock();
        setInterval(updateClock, 1000);
        renderLab();
        var cached = readCache();
        if (cached && cached.length) setApps(cached);
        else renderHome();
        UI.show('home');
        Wallpaper.start();

        document.addEventListener('visibilitychange', function () {
            if (document.hidden) {
                if (state.tvMode) exitTvMode();
                return;
            }
            clearReturnAlarm();
            updateClock();
            refreshInputStatus();
            if (UI.isVisible('home')) Wallpaper.homeShown();
            if (Date.now() - state.lastFetch > REFRESH_AFTER_MS) setTimeout(loadApps, 1500);
        });
        // With a cache, let the first frames and key presses through before the slow app list.
        setTimeout(loadApps, cached ? 2000 : 0);
        refreshInputStatus();
        log('Launcher started');
    }

    window.Home = {
        init: init,
        apps: function () { return state.apps; },
        homeItems: homeItems,
        setHomeItems: setHomeItems,
        inputs: inputs,
        setInputs: setInputs,
        hdmiStatus: function () { return state.hdmi; },
        // An HDMI input shown inside the launcher: no screen saver over it.
        tvMode: function () { return state.tvMode; },
        refreshInputStatus: refreshInputStatus,
        renderLab: renderLab,
        updateClock: updateClock,
        reloadApps: loadApps,
        renderHome: renderHome,
        miniTile: miniTile,
        miniInputTile: miniInputTile,
        onAppsChanged: function (fn) { listeners.push(fn); }
    };
})();
