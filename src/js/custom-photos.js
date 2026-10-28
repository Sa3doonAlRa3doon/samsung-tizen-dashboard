/* Phone/laptop photo inbox. Images are copied into IndexedDB on the TV and work offline afterwards. */
(function () {
    'use strict';

    var DB_NAME = 'tizen-dashboard-photos';
    var STORE = 'photos';
    var memory = [];
    var dbPromise = null;
    var listeners = [];
    var syncing = null;

    function cfg() { return (window.LAUNCHER_CONFIG && LAUNCHER_CONFIG.photoUpload) || {}; }

    function openDb() {
        if (dbPromise) return dbPromise;
        dbPromise = new Promise(function (resolve, reject) {
            var request = indexedDB.open(DB_NAME, 1);
            request.onupgradeneeded = function () {
                if (!request.result.objectStoreNames.contains(STORE)) {
                    request.result.createObjectStore(STORE, { keyPath: 'id' });
                }
            };
            request.onsuccess = function () { resolve(request.result); };
            request.onerror = function () { reject(request.error); };
        });
        return dbPromise;
    }

    function transaction(mode, work) {
        return openDb().then(function (db) {
            return new Promise(function (resolve, reject) {
                var tx = db.transaction(STORE, mode);
                var store = tx.objectStore(STORE);
                work(store);
                tx.oncomplete = function () { resolve(); };
                tx.onerror = function () { reject(tx.error); };
            });
        });
    }

    function revoke() {
        memory.forEach(function (item) {
            if (item.file && item.file.indexOf('blob:') === 0) URL.revokeObjectURL(item.file);
            if (item.thumb && item.thumb.indexOf('blob:') === 0) URL.revokeObjectURL(item.thumb);
        });
    }

    function reload() {
        return openDb().then(function (db) {
            return new Promise(function (resolve, reject) {
                var request = db.transaction(STORE, 'readonly').objectStore(STORE).getAll();
                request.onsuccess = function () {
                    revoke();
                    memory = (request.result || []).map(function (record) {
                        return {
                            id: record.id,
                            key: 'uploaded-' + record.id,
                            title: record.name || 'My photo',
                            file: URL.createObjectURL(record.blob),
                            thumb: URL.createObjectURL(record.blob),
                            credit: I18n.t('permanent'),
                            collection: 'custom'
                        };
                    });
                    listeners.forEach(function (fn) { fn(memory.slice()); });
                    resolve(memory.slice());
                };
                request.onerror = function () { reject(request.error); };
            });
        });
    }

    function api(path) {
        var base = String(cfg().server || '').replace(/\/$/, '');
        var separator = path.indexOf('?') >= 0 ? '&' : '?';
        return base + path + separator + 'pin=' + encodeURIComponent(cfg().pin || '');
    }

    function sync() {
        if (syncing) return syncing;
        if (!cfg().server) return Promise.resolve({ added: 0, total: memory.length, offline: true });
        syncing = fetch(api('/api/photos'), { cache: 'no-store' }).then(function (response) {
            if (!response.ok) throw new Error('Photo inbox HTTP ' + response.status);
            return response.json();
        }).then(function (manifest) {
            var known = {};
            memory.forEach(function (item) { known[item.id] = true; });
            var fresh = (manifest.photos || []).filter(function (item) { return !known[item.id]; });
            return Promise.all(fresh.map(function (item) {
                return fetch(api('/photos/' + encodeURIComponent(item.file)), { cache: 'no-store' })
                    .then(function (response) {
                        if (!response.ok) throw new Error('Photo download HTTP ' + response.status);
                        return response.blob();
                    }).then(function (blob) {
                        return transaction('readwrite', function (store) {
                            store.put({ id: item.id, name: item.name, blob: blob, savedAt: Date.now() });
                        });
                    });
            })).then(function () {
                return reload().then(function () { return { added: fresh.length, total: memory.length, offline: false }; });
            });
        }).catch(function (error) {
            DevLog.log('Photo sync unavailable: ' + DevLog.errorText(error));
            return { added: 0, total: memory.length, offline: true, error: error };
        }).then(function (result) {
            syncing = null;
            return result;
        }, function (error) {
            syncing = null;
            throw error;
        });
        return syncing;
    }

    function clear() {
        return transaction('readwrite', function (store) { store.clear(); }).then(reload);
    }

    function init() {
        return reload().catch(function (error) {
            DevLog.log('Permanent photo storage unavailable: ' + DevLog.errorText(error));
            return [];
        });
    }

    function startAutoSync() {
        sync();
        setInterval(function () {
            if (!document.hidden) sync();
        }, 30000);
    }

    window.CustomPhotos = {
        init: init,
        sync: sync,
        clear: clear,
        list: function () { return memory.slice(); },
        count: function () { return memory.length; },
        server: function () { return cfg().server || ''; },
        pin: function () { return cfg().pin || ''; },
        onChange: function (fn) { listeners.push(fn); },
        startAutoSync: startAutoSync
    };
})();

