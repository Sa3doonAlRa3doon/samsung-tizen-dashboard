/*
 * Minimal fake of the Tizen APIs the launcher uses, for desktop-browser preview.
 * Does nothing when running on the TV.
 * The app ids below are illustrative; use "All apps" on the TV for real ones.
 */
(function () {
    'use strict';
    if (window.tizen) return;
    window.__TIZEN_MOCK__ = true;

    // Desktop-only visual QA switches, for example ?clock=analog&rows=2.
    try {
        var preview = new URLSearchParams(location.search);
        if (preview.has('clock') || preview.has('rows') || preview.has('photo')) {
            var saved = JSON.parse(localStorage.getItem('arn0.prefs.v1') || '{}');
            saved.appearance = saved.appearance || {};
            saved.wallpaper = saved.wallpaper || {};
            if (preview.has('clock')) saved.appearance.clockStyle = preview.get('clock');
            if (preview.has('rows')) saved.appearance.dockRows = Number(preview.get('rows'));
            if (preview.has('photo')) {
                saved.wallpaper.mode = 'photo';
                saved.wallpaper.photo = preview.get('photo');
                saved.wallpaper.collection = 'sarajevo';
            }
            localStorage.setItem('arn0.prefs.v1', JSON.stringify(saved));
        }
    } catch (e) {
        // Preview settings are optional.
    }

    function app(id, name, show) {
        return { id: id, name: name, show: show !== false, iconPath: '', categories: [], packageId: id.split('.')[0] };
    }

    var apps = [
        app('Arn0Lnchr0.Launcher', 'Arn0 Launcher'),
        app('xvvl3S1TT1.TizenTubeStandalone', 'TizenTube'),
        app('com.samsung.tv.cobalt-yt', 'YouTube'),
        app('org.tizen.netflix-app', 'Netflix'),
        app('ShahidApp0.Shahid', 'Shahid'),
        app('org.tizen.primevideo', 'Prime Video'),
        app('MCmYXNxgcu.DisneyPlus', 'Disney+'),
        app('com.samsung.tv.aria-video', 'Apple TV'),
        app('rJeHak5zRg.Spotify', 'Spotify'),
        app('Jz7aUrV2Q4.Twitch', 'Twitch'),
        app('E0P3lRI4H7.MYTF1', 'TF1+ : Streaming, TV en Direct'),
        app('MovistarPl.MovistarPlus', 'Movistar Plus+'),
        app('PlexMedia0.Plex', 'Plex'),
        app('DaznApp000.DAZN', 'DAZN'),
        app('RtveTvApp0.RTVEPlay', 'RTVE Play'),
        app('Atresplay0.atresplayer', 'atresplayer'),
        app('org.tizen.browser', 'Internet'),
        // Noise that the consumer filter should hide
        app('com.samsung.tv.ep-dataservice-app', 'ep-dataservice-app'),
        app('adplatform.ADPlayer', 'ADPlayer'),
        app('com.samsung.tv.store', 'Apps'),
        app('25emanual3.emanual', 'e-Manual'),
        app('org.tizen.volume-setting', 'Volume', false)
    ];

    var sources = {
        connected: [{ type: 'TV', number: 1 }, { type: 'HDMI', number: 2 }, { type: 'HDMI', number: 4 }],
        disconnected: [{ type: 'HDMI', number: 1 }, { type: 'HDMI', number: 3 }]
    };
    var currentSource = sources.connected[0];

    function later(fn) { setTimeout(fn, 60); }

    window.tizen = {
        AlarmRelative: function (seconds) { this.seconds = seconds; this.id = 'preview-return-alarm'; },
        alarm: {
            _all: [],
            add: function (alarm) { this._all = [alarm]; console.log('[mock] return alarm', alarm.seconds); },
            removeAll: function () { this._all = []; }
        },
        ApplicationControl: function (operation, uri, mime, category, data, launchMode) {
            this.operation = operation;
            this.launchMode = launchMode || 'SINGLE';
        },
        application: {
            getAppsInfo: function (ok) { later(function () { ok(apps.slice()); }); },
            launch: function (id, ok, err) {
                console.log('[mock] launch', id);
                if (id === 'rJeHak5zRg.Spotify') {
                    later(function () { err({ name: 'NotFoundError', message: 'Mock launch failure' }); });
                    return;
                }
                later(ok);
            },
            launchAppControl: function (control, id, ok) {
                console.log('[mock] launchAppControl', control.operation, id || 'auto', control.launchMode);
                later(ok);
            },
            getCurrentApplication: function () {
                return { appInfo: { id: 'Arn0Lnchr0.Launcher' }, exit: function () {}, hide: function () {} };
            }
        },
        systeminfo: {
            getPropertyValue: function (prop, ok, err) {
                if (prop === 'VIDEOSOURCE') { later(function () { ok(sources); }); return; }
                if (prop === 'WIFI_NETWORK') {
                    later(function () { ok({ status: 'ON', ssid: 'Home Wi‑Fi', ipAddress: '192.168.1.50', signalStrength: 0.86, securityMode: 'WPA2_PSK' }); });
                    return;
                }
                later(function () { err({ name: 'NotSupportedError', message: prop }); });
            },
            getCapability: function (key) { return key.indexOf('network.bluetooth') >= 0 || key.indexOf('network.wifi') >= 0; }
        },
        tvwindow: {
            setSource: function (src, ok) { console.log('[mock] setSource', src); currentSource = src; later(function () { ok(src); }); },
            getSource: function () { return currentSource; },
            show: function (ok) { console.log('[mock] tvwindow.show'); later(ok); },
            hide: function (ok) { console.log('[mock] tvwindow.hide'); later(ok); }
        },
        tvinputdevice: {
            registerKey: function () {},
            registerKeyBatch: function () {},
            unregisterKey: function () {},
            getSupportedKeys: function () { return []; }
        }
    };
})();
