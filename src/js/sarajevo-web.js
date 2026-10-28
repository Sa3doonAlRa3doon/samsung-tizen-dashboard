/* Offline Sarajevo photo collection. Original files and licence pages are recorded in CREDITS-SARAJEVO.md. */
(function () {
    'use strict';

    var photos = [
        ['yellow-fortress-view', 'Yellow Fortress view', 'Skelanard · CC BY-SA 4.0', 'A_view_of_Sarajevo_from_the_Yellow_Fortress.jpg'],
        ['bascarsija-square', 'Baščaršija square', 'Stechshotme · CC BY-SA 4.0', 'Baščaršija_Sarajevo.jpg'],
        ['bascarsija-street', 'Baščaršija streets', 'Janko Hoener · CC BY-SA 4.0', 'Baščaršija_2018.jpg'],
        ['bravadziluk', 'Bravadžiluk', 'CeeGee · CC BY-SA 4.0', 'Bravadžiluk_Street_Baščaršija_Sarajevo.jpg'],
        ['miljacka-river', 'Miljacka river', 'Pudelek (Marcin Szala) · CC BY-SA 3.0', 'Miljacka_river_in_Sarajevo_(by_Pudelek).JPG'],
        ['trebevic-panorama', 'Trebević panorama', 'BiHVolim · CC BY-SA 4.0', 'Mount_Trebević_view_from_Sarajevo_(Panoramic).jpg'],
        ['city-hall', 'Sarajevo City Hall', 'Bernard Gagnon · CC BY-SA 4.0', 'Sarajevo_City_Hall_01.jpg'],
        ['city-hall-night', 'City Hall at night', 'Julian Nyča · CC BY-SA 3.0', 'Sarajevo_–_Vijećnica_at_night.jpg'],
        ['alifakovac-night', 'Vijećnica from Alifakovac', 'Julian Nyča · CC BY-SA 3.0', 'Sarajevo_–_Vijećnica_from_Alifakovac_(2017).jpg'],
        ['city-panorama', 'City panorama', 'Julian Nyča · CC BY-SA 4.0', 'Sarajevo_City_Panorama.JPG'],
        ['night-skyline', 'Night skyline', 'Alen Djuderija Photography · CC BY 2.0', 'Sarajevo_Night_Skyline_Bosnia_&_Herzegovina_2014_(15510458883).jpg'],
        ['bibans-sunset', 'View from Biban’s', 'Julian Nyča · CC BY-SA 3.0', 'Sarajevo_–_from_Biban\'s.jpg'],
        ['yellow-fortress-iftar', 'Iftar at Yellow Fortress', 'Julian Nyča · CC BY-SA 3.0', 'Sarajevo_–_Iftar_at_Žuta_tabija.jpg'],
        ['cable-car', 'Cable car and minaret', 'Julian Nyča · CC BY-SA 3.0', 'Sarajevo_–_Cable_Car_and_Minaret.jpg'],
        ['old-town-aerial', 'Old town from Trebević', 'Julian Nyča · CC BY-SA 3.0', 'Sarajevo_Bascarsija_from_Trebevic.JPG'],
        ['sebilj', 'Sebilj fountain', 'Fred Romero · CC BY 2.0', 'Sarajevo_-_Sebilj_(49090400881).jpg'],
        ['vijecnica-detail', 'Vijećnica detail', 'Fred Romero · CC BY 2.0', 'Sarajevo_-_Gradska_Vijećnica_(49100427291).jpg'],
        ['tram-modern', 'Sarajevo tram', 'Smooth O · CC BY-SA 4.0', 'Sarajevo_tram_905.jpg'],
        ['tram-historic', 'Historic Baščaršija tram', 'Public domain', 'Sarajevo_Tram_Bascarsija.jpg'],
        ['latin-bridge-web', 'Latin Bridge', 'Julian Nyča · CC BY-SA 3.0', 'Sarajevo_Lateinerbrücke_1.JPG'],
        ['miljacka-valley', 'Miljacka valley', 'Julian Nyča · CC BY-SA 3.0', 'Sarajevo_Miljacka_Valley.JPG'],
        ['miljacka-bridge', 'Miljacka city view', 'Julian Nyča · CC BY-SA 4.0', 'Sarajevo_Miljacka_2.jpg'],
        ['modern-city', 'Modern Sarajevo', 'Milan Suvajac · CC BY-SA 4.0', 'Sarajevo_Cityscape_2011-10-15.jpg'],
        ['city-morning', 'Sarajevo cityscape', 'Milan Suvajac · CC BY-SA 4.0', 'Sarajevo_Cityscape_2013-11-08.jpg'],
        ['yellow-fortress', 'Žuta Tabija', 'Fred Romero · CC BY 2.0', 'Sarajevo_-_Žuta_Tabija_(49126643821).jpg']
    ];

    photos.forEach(function (p, i) {
        var number = String(i + 1).padStart(2, '0');
        window.WALLPAPERS.push({
            key: 'sarajevo-' + p[0],
            title: 'Sarajevo · ' + p[1],
            file: 'img/wallpapers/sarajevo-web-' + number + '.jpg',
            thumb: 'img/wallpapers/thumbs/sarajevo-web-' + number + '.jpg',
            credit: p[2],
            source: 'https://commons.wikimedia.org/wiki/File:' + encodeURIComponent(p[3]),
            collection: 'sarajevo'
        });
    });
})();
