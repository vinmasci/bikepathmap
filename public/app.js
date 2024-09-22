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

let layerVisibility = {
    road: false,
    gravel: false,
    photos: false,
    pois: false
};

// GPX Layer Toggle
function toggleGPXLayer(url, layerId) {
    if (layerVisibility[layerId]) {
        removeLayer(layerId);
        layerVisibility[layerId] = false;
        document.getElementById(layerId + '-tab').classList.remove('active');
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
                document.getElementById(layerId + '-tab').classList.add('active');
            })
            .catch(error => console.error('Error loading GPX:', error));
    }
}

// Photo and POI layer toggle functions (similar to GPX layers)
function togglePhotoLayer() {
    if (layerVisibility.photos) {
        removePhotoMarkers();
        layerVisibility.photos = false;
    } else {
        loadPhotoMarkers();
        layerVisibility.photos = true;
    }
}

function togglePOILayer() {
    if (layerVisibility.pois) {
        removePOIMarkers();
        layerVisibility.pois = false;
    } else {
        loadPOIMarkers();
        layerVisibility.pois = true;
    }
}

// Dummy functions to handle loading and removing markers
function loadPhotoMarkers() { console.log("Loading photo markers"); }
function removePhotoMarkers() { console.log("Removing photo markers"); }
function loadPOIMarkers() { console.log("Loading POI markers"); }
function removePOIMarkers() { console.log("Removing POI markers"); }

// Tab Switch Event Listeners
document.getElementById('road-tab').addEventListener('click', function () {
    toggleGPXLayer(roadGPX, 'road');
    highlightTab('road-tab');
});
document.getElementById('gravel-tab').addEventListener('click', function () {
    toggleGPXLayer(gravelGPX, 'gravel');
    highlightTab('gravel-tab');
});
document.getElementById('photos-tab').addEventListener('click', function () {
    togglePhotoLayer();
    highlightTab('photos-tab');
});
document.getElementById('pois-tab').addEventListener('click', function () {
    togglePOILayer();
    highlightTab('pois-tab');
});

// Function to toggle the dropdown on the Add tab
document.getElementById('add-tab').addEventListener('click', function () {
    const dropdown = document.getElementById('add-dropdown');
    dropdown.classList.toggle('show');
    highlightTab('add-tab');
});

// Highlight the active tab
function highlightTab(tabId) {
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
}
