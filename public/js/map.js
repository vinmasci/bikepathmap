let map;
let layerVisibility = { segments: false, gravel: false, photos: false, pois: false };

// ===========================
// SECTION: Map Initialization
// ===========================
function initMap() {
    console.log("Initializing map...");
    mapboxgl.accessToken = 'pk.eyJ1IjoidmlubWFzY2kiLCJhIjoiY20xY3B1ZmdzMHp5eDJwcHBtMmptOG8zOSJ9.Ayn_YEjOCCqujIYhY9PiiA'; // Replace with your Mapbox token
    map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/streets-v11',
        center: [144.9631, -37.8136],
        zoom: 10
    });

// ============================
// SECTION: Initialize GeoJSON Source for Segments
// ============================
map.on('load', () => {
    // Initialize a GeoJSON source for all drawn segments
    map.addSource('drawnSegments', {
        type: 'geojson',
        data: {
            type: 'FeatureCollection',
            features: []
        }
    });

    // Add a layer to display the segments
    map.addLayer({
        id: 'drawnSegmentsLayer',
        type: 'line',
        source: 'drawnSegments',
        layout: {
            'line-join': 'round',
            'line-cap': 'round'
        },
        paint: {
            'line-color': ['get', 'color'], // Use color property from feature
            'line-width': 4,
            'line-dasharray': ['case', ['==', ['get', 'lineStyle'], 'dashed'], [2, 4], [1]]
        }
    });
});

    map.on('error', (e) => {
        console.error("Map error:", e);
    });
}


// ============================
// SECTION: Initialize Event Listeners
// ============================
function initEventListeners() {
    document.getElementById('segments-tab').addEventListener('click', toggleSegmentsLayer);
    document.getElementById('draw-route-tab').addEventListener('click', toggleDrawingMode); // Drawing mode logic
    document.getElementById('photos-tab').addEventListener('click', togglePhotoLayer); // Photos toggle logic
    document.getElementById('pois-tab').addEventListener('click', togglePOILayer); // POI toggle logic
    document.getElementById('add-tab').addEventListener('click', toggleAddDropdown); // Dropdown logic for Add tab
}

// ============================
// SECTION: Toggle Segments Layer
// ============================
function toggleSegmentsLayer() {
    layerVisibility.segments = !layerVisibility.segments;

    if (layerVisibility.segments) {
        loadSegments(); // Load segments when toggled on
    } else {
        removeSegments(); // Remove segments when toggled off
    }

    updateTabHighlight('segments-tab', layerVisibility.segments);
}

// ============================
// SECTION: Toggle Photo Layer
// ============================
function togglePhotoLayer() {
    layerVisibility.photos = !layerVisibility.photos;

    if (layerVisibility.photos) {
        loadPhotoMarkers(); // Load photo markers when toggled on
    } else {
        removePhotoMarkers(); // Remove photo markers when toggled off
    }

    updateTabHighlight('photos-tab', layerVisibility.photos);
}

// ============================
// SECTION: Toggle POI Layer
// ============================
function togglePOILayer() {
    layerVisibility.pois = !layerVisibility.pois;

    if (layerVisibility.pois) {
        loadPOIMarkers(); // Load POI markers when toggled on
    } else {
        removePOIMarkers(); // Remove POI markers when toggled off
    }

    updateTabHighlight('pois-tab', layerVisibility.pois);
}

// ============================
// SECTION: Toggle Add Dropdown
// ============================
function toggleAddDropdown() {
    const dropdown = document.getElementById('add-dropdown');
    dropdown.classList.toggle('show');
    updateTabHighlight('add-tab', dropdown.classList.contains('show')); // Update tab highlight
}
