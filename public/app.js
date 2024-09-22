mapboxgl.accessToken = 'pk.eyJ1IjoidmlubWFzY2kiLCJhIjoiY20xY3B1ZmdzMHp5eDJwcHBtMmptOG8zOSJ9.Ayn_YEjOCCqujIYhY9PiiA'; // Replace with your token

const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v11',
    center: [144.9631, -37.8136], // Center on Melbourne
    zoom: 10
});

// GPX URLs
const roadGPX = '/GPX/Road/Capital_City_Trail.gpx';
const gravelGPX = '/GPX/Gravel/Dandenong_Creek_Trail_.gpx';

// State to track whether layers are on or off
let layerVisibility = {
    road: false,
    gravel: false,
    photos: false,
    pois: false
};

// Function to remove layers
function removeLayer(layerId) {
    if (map.getLayer(layerId)) {
        map.removeLayer(layerId);
        map.removeSource(layerId);
    }
}

// GPX Layer Toggle
function toggleGPXLayer(url, layerId) {
    if (layerVisibility[layerId]) {
        removeLayer(layerId);
        layerVisibility[layerId] = false;
        updateTabHighlight(layerId + '-tab', false);
    } else {
        fetch(url)
            .then(response => response.text())
            .then(gpxData => {
                const parser = new DOMParser();
                const gpxDoc = parser.parseFromString(gpxData, 'application/xml');
                const geojson = toGeoJSON.gpx(gpxDoc);

                map.addSource(layerId, {
                    type: 'geojson',
                    data: geojson
                });

                map.addLayer({
                    id: layerId,
                    type: 'line',
                    source: layerId,
                    layout: {
                        'line-join': 'round',
                        'line-cap': 'round'
                    },
                    paint: {
                        'line-color': '#FF0000',
                        'line-width': 4
                    }
                });

                layerVisibility[layerId] = true;
                updateTabHighlight(layerId + '-tab', true);
            })
            .catch(error => console.error('Error loading GPX:', error));
    }
}

// Photos data
const photos = [
    { coordinates: [144.9631, -37.8136], title: 'Photo 1', imageUrl: '/photos/photo1.jpg' },
    { coordinates: [144.9781, -37.8196], title: 'Photo 2', imageUrl: '/photos/photo2.jpg' }
];

// POI data
const pois = [
    { coordinates: [144.9631, -37.814], title: 'Federation Square', description: 'A famous cultural precinct in Melbourne.' },
    { coordinates: [144.978, -37.819], title: 'Flinders Street Station', description: 'One of Melbourne\'s most iconic buildings.' }
];

// Toggle functions for Photos and POIs
function togglePhotoLayer() {
    if (layerVisibility.photos) {
        removePhotoMarkers();
        layerVisibility.photos = false;
        updateTabHighlight('photos-tab', false);
    } else {
        loadPhotoMarkers();
        layerVisibility.photos = true;
        updateTabHighlight('photos-tab', true);
    }
}

function togglePOILayer() {
    if (layerVisibility.pois) {
        removePOIMarkers();
        layerVisibility.pois = false;
        updateTabHighlight('pois-tab', false);
    } else {
        loadPOIMarkers();
        layerVisibility.pois = true;
        updateTabHighlight('pois-tab', true);
    }
}

// Functions to handle marker loading and removal
let photoMarkers = [];
let poiMarkers = [];

// Load photo markers
function loadPhotoMarkers() {
    photos.forEach(photo => {
        const marker = new mapboxgl.Marker()
            .setLngLat(photo.coordinates)
            .addTo(map);

        const popup = new mapboxgl.Popup({ offset: 25 })
            .setHTML(`<h3>${photo.title}</h3><img src="${photo.imageUrl}" alt="${photo.title}" style="width:200px;">`);

        marker.setPopup(popup);
        photoMarkers.push(marker);
    });
    console.log("Photo markers loaded");
}

// Remove photo markers
function removePhotoMarkers() {
    photoMarkers.forEach(marker => marker.remove());
    photoMarkers = [];
    console.log("Photo markers removed");
}

// Load POI markers
function loadPOIMarkers() {
    pois.forEach(poi => {
        const marker = new mapboxgl.Marker()
            .setLngLat(poi.coordinates)
            .addTo(map);

        const popup = new mapboxgl.Popup({ offset: 25 })
            .setHTML(`<h3>${poi.title}</h3><p>${poi.description}</p>`);

        marker.setPopup(popup);
        poiMarkers.push(marker);
    });
    console.log("POI markers loaded");
}

// Remove POI markers
function removePOIMarkers() {
    poiMarkers.forEach(marker => marker.remove());
    poiMarkers = [];
    console.log("POI markers removed");
}

// Tab Switch Event Listeners
document.getElementById('road-tab').addEventListener('click', function () {
    toggleGPXLayer(roadGPX, 'road');
});

document.getElementById('gravel-tab').addEventListener('click', function () {
    toggleGPXLayer(gravelGPX, 'gravel');
});

document.getElementById('photos-tab').addEventListener('click', function () {
    togglePhotoLayer();
});

document.getElementById('pois-tab').addEventListener('click', function () {
    togglePOILayer();
});

// Dropdown functionality under "Add" tab
document.getElementById('add-tab').addEventListener('click', function () {
    const dropdown = document.getElementById('add-dropdown');
    dropdown.classList.toggle('show');
    updateTabHighlight('add-tab', dropdown.classList.contains('show'));
});

// Function to update tab highlights based on the layer visibility
function updateTabHighlight(tabId, isActive) {
    const tabElement = document.getElementById(tabId);
    if (isActive) {
        tabElement.classList.add('active');
    } else {
        tabElement.classList.remove('active');
    }
}
