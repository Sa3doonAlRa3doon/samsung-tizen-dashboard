/* Next-prayer countdown. Daily schedules come from AlAdhan and are cached for outages. */
(function () {
    'use strict';

    var PRAYERS = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
    var CACHE_PREFIX = 'tizen-dashboard-prayer-v1:';
    var REFRESH_MS = 6 * 60 * 60 * 1000;
    var state = { days: {}, lastFetch: 0, timer: null, refreshTimer: null, dayKey: '' };

    function el(id) { return document.getElementById(id); }
    function cfg() { return window.LAUNCHER_CONFIG.prayer || {}; }
    function T(key) { return window.I18n ? I18n.t(key) : key; }
    function pad(n) { return n < 10 ? '0' + n : String(n); }
    function dateKey(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
    function apiDate(d) { return pad(d.getDate()) + '-' + pad(d.getMonth() + 1) + '-' + d.getFullYear(); }
    function tomorrow(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1, 12, 0, 0); }
    function enabled() {
        var p = cfg();
        return p.enabled === true && isFinite(Number(p.latitude)) && isFinite(Number(p.longitude));
    }

    function cacheKey() {
        var p = cfg();
        return CACHE_PREFIX + [p.latitude, p.longitude, p.method, p.school, p.tune || ''].join('|');
    }

    function loadCache() {
        try {
            var saved = JSON.parse(localStorage.getItem(cacheKey()) || '{}');
            state.days = saved.days || {};
            state.lastFetch = Number(saved.lastFetch) || 0;
        } catch (e) {
            state.days = {};
            state.lastFetch = 0;
        }
    }

    function saveCache() {
        try { localStorage.setItem(cacheKey(), JSON.stringify({ days: state.days, lastFetch: state.lastFetch })); }
        catch (e) { /* Countdown still works until the app closes. */ }
    }

    function urlFor(d) {
        var p = cfg();
        var url = 'https://api.aladhan.com/v1/timings/' + apiDate(d) +
            '?latitude=' + encodeURIComponent(p.latitude) +
            '&longitude=' + encodeURIComponent(p.longitude) +
            '&method=' + encodeURIComponent(p.method == null ? 8 : p.method) +
            '&school=' + encodeURIComponent(p.school == null ? 0 : p.school);
        if (p.tune) url += '&tune=' + encodeURIComponent(p.tune);
        return url;
    }

    function fetchDay(d) {
        var key = dateKey(d);
        return fetch(urlFor(d), { cache: 'no-store' }).then(function (response) {
            if (!response.ok) throw new Error('HTTP ' + response.status);
            return response.json();
        }).then(function (body) {
            if (!body || Number(body.code) !== 200 || !body.data || !body.data.timings) {
                throw new Error('Invalid prayer response');
            }
            var timings = {};
            PRAYERS.forEach(function (name) { timings[name] = String(body.data.timings[name] || '').slice(0, 5); });
            state.days[key] = { timings: timings, timezone: body.data.meta && body.data.meta.timezone || '' };
            return state.days[key];
        });
    }

    function refresh(force) {
        if (!enabled()) return Promise.resolve(false);
        var now = new Date();
        var todayKey = dateKey(now);
        var tomorrowKey = dateKey(tomorrow(now));
        if (!force && state.days[todayKey] && state.days[tomorrowKey] && Date.now() - state.lastFetch < REFRESH_MS) {
            return Promise.resolve(true);
        }
        el('prayer-status').textContent = T('prayerUpdating');
        return Promise.all([fetchDay(now), fetchDay(tomorrow(now))]).then(function () {
            state.lastFetch = Date.now();
            saveCache();
            render();
            return true;
        }).catch(function () {
            render();
            return false;
        });
    }

    function parse(date, text) {
        var parts = String(text || '').match(/^(\d{1,2}):(\d{2})/);
        if (!parts) return null;
        return new Date(date.getFullYear(), date.getMonth(), date.getDate(), Number(parts[1]), Number(parts[2]), 0, 0);
    }

    function nextPrayer(now) {
        var dates = [now, tomorrow(now)];
        for (var d = 0; d < dates.length; d++) {
            var day = dates[d];
            var stored = state.days[dateKey(day)];
            if (!stored) continue;
            for (var i = 0; i < PRAYERS.length; i++) {
                var at = parse(day, stored.timings[PRAYERS[i]]);
                if (at && at.getTime() > now.getTime()) {
                    return { name: PRAYERS[i], at: at, text: stored.timings[PRAYERS[i]], timezone: stored.timezone };
                }
            }
        }
        return null;
    }

    function countdown(ms) {
        var seconds = Math.max(0, Math.floor(ms / 1000));
        var hours = Math.floor(seconds / 3600);
        var minutes = Math.floor((seconds % 3600) / 60);
        var secs = seconds % 60;
        return pad(hours) + ':' + pad(minutes) + ':' + pad(secs);
    }

    function render() {
        var card = el('prayer-card');
        if (!enabled()) { card.classList.add('hidden'); return; }
        card.classList.remove('hidden');
        var now = new Date();
        var next = nextPrayer(now);
        if (!next) {
            el('prayer-name').textContent = T('prayerTimes');
            el('prayer-time').textContent = '—';
            el('prayer-countdown').textContent = T('prayerUnavailable');
            el('prayer-status').textContent = 'AlAdhan API';
            return;
        }
        el('prayer-name').textContent = T('prayer' + next.name);
        el('prayer-time').textContent = next.text;
        el('prayer-countdown').textContent = countdown(next.at.getTime() - now.getTime());
        el('prayer-status').textContent = 'AlAdhan API' + (next.timezone ? ' · ' + next.timezone : '');
        if (dateKey(now) !== state.dayKey) {
            state.dayKey = dateKey(now);
            refresh(true);
        }
    }

    function start() {
        if (!enabled()) { el('prayer-card').classList.add('hidden'); return; }
        loadCache();
        state.dayKey = dateKey(new Date());
        render();
        refresh(false);
        state.timer = setInterval(render, 1000);
        state.refreshTimer = setInterval(function () { refresh(false); }, 30 * 60 * 1000);
        document.addEventListener('visibilitychange', function () {
            if (!document.hidden) { render(); refresh(false); }
        });
    }

    window.Prayer = { start: start, refresh: refresh, render: render, _state: state };
})();
