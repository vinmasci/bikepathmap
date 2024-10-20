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
    console.log("Map loaded successfully.");

    // Add GeoJSON source for storing drawn segments
    map.addSource('drawnSegments', {
        'type': 'geojson',
        'data': {
            'type': 'FeatureCollection',
            'features': []
        }
    });

    // Add a line layer to display the segments
    map.addLayer({
        'id': 'drawn-segments-layer',
        'type': 'line',
        'source': 'drawnSegments',
        'layout': {
            'line-join': 'round',
            'line-cap': 'round'
        },
        'paint': {
            'line-color': ['get', 'color'],
            'line-width': 4,
            'line-dasharray': ['case', ['==', ['get', 'lineStyle'], 'dashed'], [2, 4], [1]]
        }
    });

    // Set up event listeners after source and layer are added
    initEventListeners();
    loadSegments(); // Load segments on map load
    updateTabHighlight('segments-tab', true); // Highlight the segments tab
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
    document.getElementById('draw-route-tab').addEventListener('click', toggleDrawingMode); // Toggle Drawing Mode
    document.getElementById('photos-tab').addEventListener('click', togglePhotoLayer);
    document.getElementById('pois-tab').addEventListener('click', togglePOILayer);
    document.getElementById('add-tab').addEventListener('click', toggleAddDropdown);
    document.getElementById('undo-btn').addEventListener('click', undoLastSegment); // Undo Last Segment
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

// ============================
// SECTION: Toggle Drawing Mode
// ============================
function toggleDrawingMode() {
    if (map.getCanvas().style.cursor === 'crosshair') {
        disableDrawingMode();
    } else {
        enableDrawingMode();
    }
}