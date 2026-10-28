window.LAUNCHER_LOCAL = {
    // Optional private LAN photo inbox. Copy this file to config.local.js.
    photoUpload: {
        server: 'http://192.168.1.20:8096',
        pin: 'CHANGE-ME'
    },

    // Optional weather location. Keep personal coordinates out of Git.
    weather: {
        latitude: null,
        longitude: null,
        unit: 'celsius'
    },

    prayer: {
        enabled: false,
        latitude: null,
        longitude: null,
        method: 8,
        school: 0,
        tune: ''
    }
};
