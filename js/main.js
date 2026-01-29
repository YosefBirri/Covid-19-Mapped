mapboxgl.accessToken = 'pk.eyJ1IjoieWJpcnJpIiwiYSI6ImNta3Q0cWQ3cjFpbWMzZnBzZjBocnQ0MWwifQ.Cy4Rb6d1y86r-MbcVOqHZg';

const mapType = document.body.getAttribute('data-map');

let dataFile, valueField, legendTitle, breaks, colors, popupLabel;

if (mapType === 'rates') {
    dataFile = 'assets/us-covid-2020-rates.json';
    valueField = 'rates';
    legendTitle = 'COVID 19 Rate (per 1000)';
    popupLabel = 'Rate';

    breaks = [0, 50, 100, 150, 300];
    colors = ['#f7f7f7', '#cccccc', '#969696', '#636363', '#252525'];

} else if (mapType === 'counts') {
    dataFile = 'assets/us-covid-2020-counts.geojson'; // centroids
    valueField = 'cases';
    legendTitle = 'COVID-19 Case Counts';
    popupLabel = 'Cases';

    breaks = [0, 1000, 5000, 10000, 50000];
    colors = ['#fee5d9', '#fcae91', '#fb6a4a', '#de2d26', '#a50f15'];
}

// Map
const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/ybirri/cmkucbpap001o01sfe84w4zz8',
    center: [-98, 39],
    zoom: 3,
    projection: {
        name: 'albers',
        parallels: [29.5, 45.5]
    }
});

map.on('load', () => {

    // data source
    map.addSource('covid-data', {
        type: 'geojson',
        data: dataFile
    });

    // layers
    if (mapType === 'rates') {

        // map1/choropleth
        map.addLayer({
            id: 'covid-layer',
            type: 'fill',
            source: 'covid-data',
            paint: {
                'fill-color': [
                    'interpolate',
                    ['linear'],
                    ['get', valueField],
                    breaks[0], colors[0],
                    breaks[1], colors[1],
                    breaks[2], colors[2],
                    breaks[3], colors[3],
                    breaks[4], colors[4]
                ],
                'fill-outline-color': '#ffffff',
                'fill-opacity': 0.75
            }
        });

        // border highlight
        map.addLayer({
            id: 'county-highlight',
            type: 'line',
            source: 'covid-data',
            paint: {
                'line-color': '#000000',
                'line-width': 3
            },
            filter: ['==', 'fips', '']
        });

    } else if (mapType === 'counts') {

        // map2/prop symb
        map.addLayer({
            id: 'covid-layer',
            type: 'circle',
            source: 'covid-data',
            paint: {
                'circle-radius': [
                    'interpolate',
                    ['linear'],
                    ['get', valueField],
                    0, 2,
                    1000, 4,
                    5000, 9,
                    10000, 14,
                    50000, 25
                ],
                'circle-color': '#de2d26',
                'circle-opacity': 0.7,
                'circle-stroke-color': '#ffffff',
                'circle-stroke-width': 0.6
            }
        });
    }

    // popup event
    const popup = new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: false
    });

    // hover interacion
    map.on('mousemove', 'covid-layer', (e) => {
        map.getCanvas().style.cursor = 'pointer';

        if (e.features.length > 0) {
            const f = e.features[0];

            // highlight if it's map1 only
            if (mapType === 'rates') {
                map.setFilter('county-highlight', ['==', 'fips', f.properties.fips]);
            }

            // show popup
            popup
                .setLngLat(e.lngLat)
                .setHTML(`
                    <strong>County:</strong> ${f.properties.county}<br>
                    <strong>${popupLabel}:</strong> ${f.properties[valueField].toLocaleString()}
                `)
                .addTo(map);
        }
    });

    map.on('mouseleave', 'covid-layer', () => {
        map.getCanvas().style.cursor = '';
        if (mapType === 'rates') {
            map.setFilter('county-highlight', ['==', 'fips', '']); // remove highlight
        }
        popup.remove();
    });

    // Legend
    const legend = document.getElementById('legend');
    legend.innerHTML = ''; // clear previous

    if (mapType === 'rates') {

        // map1 legend
        let labels = [`<strong>${legendTitle}</strong>`];
        for (let i = 0; i < breaks.length - 1; i++) {
            labels.push(`
                <div class="legend-item">
                    <span class="legend-color" style="background:${colors[i]}"></span>
                    <span class="legend-label">${breaks[i]} – ${breaks[i+1]}</span>
                </div>
            `);
        }
        legend.innerHTML = labels.join('');
    } else if (mapType === 'counts') {

        // map2 legend
        const circleSizes = [2, 4, 8, 14, 25];
        const labels = [`<strong>${legendTitle}</strong>`];

        for (let i = 0; i < circleSizes.length; i++) {
            let label = (i < breaks.length - 1)
                ? `${breaks[i]} – ${breaks[i+1]}`
                : `${breaks[i]}+`;
            labels.push(`
                <div class="legend-item" style="display: flex; align-items: center; margin-bottom: 4px;">
                    <span style="
                        display:inline-block;
                        width:${circleSizes[i]*2}px;
                        height:${circleSizes[i]*2}px;
                        background:#e34a33;
                        border-radius:50%;
                        margin-right:8px;
                        border:1px solid #fff;
                    "></span>
                    <span class="legend-label">${label}</span>
                </div>
            `);
        }
        legend.innerHTML = labels.join('');
    }
});