// /public/js/map.js

import { parseTrackPoints } from './geojson.js';
import { loadPhotoMarkers } from './photo.js';

export let map;
export let layerVisibility = { road: false, gravel: false, photos: false, pois: false };

export function initMap() {
    mapboxgl.accessToken = 'pk.eyJ1IjoidmlubWFzY2kiLCJhIjoiY20xY3B1ZmdzMHp5eDJwcHBtMmptOG8zOSJ9.Ayn_YEjOCCqujIYhY9PiiA';
    map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/streets-v11',
        center: [144.9631, -37.8136],
        zoom: 10
    });

    map.on('load', function() {
        const storedGPX = localStorage.getItem('gpxData');
        if (storedGPX) {
            const geojson = JSON.parse(storedGPX);
            addGPXLayer(geojson);
        }
    });
}

export function addGPXLayer(geojson) {
    map.addSource('gpx-route', { type: 'geojson', data: geojson });

    map.addLayer({
        id: 'gpx-route-layer',
        type: 'line',
        source: 'gpx-route',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: { 'line-color': '#ff0000', 'line-width': 4 }
    });
}

export function toggleRoadLayer() {
    if (map.getLayer('gpx-route-layer')) {
        layerVisibility.road = !layerVisibility.road;
        map.setLayoutProperty('gpx-route-layer', 'visibility', layerVisibility.road ? 'visible' : 'none');
    } else {
        alert("No GPX route is loaded yet.");
    }
}
