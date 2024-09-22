// Initialize the Mapbox map
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

// Helper function to check if a layer exists on the map
function layerExists(layerId) {
    return map.getLayer(layerId);
}

// Function to toggle GPX layers using toGeoJSON
function toggleGPXLayer(url, layerId) {
    if (layerVisibility[layerId]) {
        console.log(`Removing layer: ${layerId}`);
        removeLayer(layerId);
        layerVisibility[layerId] = false;
    } else {
        console.log(`Adding layer: ${layerId}`);
        fetch(url)
            .then(response => response.text())
            .then(gpxData => {
                const parser = new DOMParser();
                const gpxDoc = parser.parseFromString(gpxData, 'application/xml');
                const geojson = toGeoJSON.gpx(gpxDoc);

                if (!layerExists(layerId)) {
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
                            'line-color': '#FF0000', // Customize the color
                            'line-width': 4
                        }
                    });

                    layerVisibility[layerId] = true;
                }
            })
            .catch(error => console.error('Error loading GPX:', error));
    }
}

// Function to remove layers
function removeLayer(layerId) {
    if (layerExists(layerId)) {
        map.removeLayer(layerId);
        map.removeSource(layerId);
    }
}

// Toggle Photos Layer
function togglePhotoLayer() {
    if (layerVisibility.photos) {
        console.log("Removing photo layer");
        removePhotoMarkers();
        layerVisibility.photos = false;
    } else {
        console.log("Adding photo layer");
        loadPhotoMarkers();
        layerVisibility.photos = true;
    }
}

// Function to remove photo markers
function removePhotoMarkers() {
    photoMarkers.forEach(marker => marker.remove());
    photoMarkers = [];
}

// Toggle POI Layer
function togglePOILayer() {
    if (layerVisibility.pois) {
        console.log("Removing POI layer");
        removePOIMarkers();
        layerVisibility.pois = false;
    } else {
        console.log("Adding POI layer");
        loadPOIMarkers();
        layerVisibility.pois = true;
    }
}

// Handle tab switching logic
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

// Function to highlight the active tab
function highlightTab(tabId) {
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
}
