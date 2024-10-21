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
        center: [144.9631, -37.8136],  // Replace with your coordinates
        zoom: 10
    });

// ============================
// SECTION: Initialize GeoJSON Source for Segments
// ============================
map.on('load', () => {
    console.log("Map loaded successfully.");

    // Add GeoJSON source for storing drawn segments
    if (!map.getSource('drawnSegments')) {
        map.addSource('drawnSegments', {
            'type': 'geojson',
            'data': {
                'type': 'FeatureCollection',
                'features': []  // Initially empty
            }
        });
    }

    // Add a black stroke line layer (drawn below both the white and colored lines)
    if (!map.getLayer('drawn-segments-layer-stroke')) {
        map.addLayer({
            'id': 'drawn-segments-layer-stroke',
            'type': 'line',
            'source': 'drawnSegments',
            'layout': {
                'line-join': 'round',
                'line-cap': 'round'
            },
            'paint': {
                'line-color': '#000000',  // Black stroke
                'line-width': 6           // Width of the black stroke (adjust as needed)
            }
        });
    } else {
        console.error("'drawn-segments-layer-stroke' already exists on the map");
    }

    // Add a solid white background line layer (drawn above the black stroke)
    if (!map.getLayer('drawn-segments-layer-background')) {
        map.addLayer({
            'id': 'drawn-segments-layer-background',
            'type': 'line',
            'source': 'drawnSegments',
            'layout': {
                'line-join': 'round',
                'line-cap': 'round'
            },
            'paint': {
                'line-color': '#FFFFFF',  // Solid white color
                'line-width': 5           // Width of the white line (adjust as needed)
            }
        });
    } else {
        console.error("'drawn-segments-layer-background' already exists on the map");
    }

    // Add a dashed colored line layer (drawn on top of both the black stroke and white background)
    if (!map.getLayer('drawn-segments-layer')) {
        map.addLayer({
            'id': 'drawn-segments-layer',
            'type': 'line',
            'source': 'drawnSegments',
            'layout': {
                'line-join': 'round',
                'line-cap': 'round'
            },
            'paint': {
                'line-color': ['get', 'color'],  // Dynamic color from properties
                'line-width': 3,                 // Width of the colored line (slightly smaller than the white line)
                'line-dasharray': [
                    'case',
                    ['==', ['get', 'lineStyle'], 'dashed'], ['literal', [2, 4]], // Dashed line
                    ['literal', [1, 0]] // Solid line
                ]
            }
            
        });

    } else {
        console.error("'drawn-segments-layer' already exists on the map");
    }

    
    
    initEventListeners();
    // Load segments when the map is initialized
    loadSegments();  // Automatically load segments when the page loads
    updateTabHighlight('segments-tab', true);  // Highlight the segments tab by default
    layerVisibility.segments = true;  // Set segments to visible by default
});

// Handle any errors that occur during the map initialization
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

}

// ============================
// SECTION: Toggle Segments Layer
// ============================
function toggleSegmentsLayer() {
    layerVisibility.segments = !layerVisibility.segments;

    if (layerVisibility.segments) {
        loadSegments();  // Load segments when toggled on
    } else {
        removeSegments();  // Remove segments when toggled off
    }

    updateTabHighlight('segments-tab', layerVisibility.segments);
}

// ============================
// SECTION: Load Segments
// ============================
async function loadSegments() {
    try {
        const response = await fetch('/api/get-drawn-routes');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Ensure 'data' is defined and contains 'routes'
        if (!data || !data.routes) {
            throw new Error("No data or routes found in the API response");
        }

        const source = map.getSource('drawnSegments');
        if (source) {
            source.setData({
                'type': 'FeatureCollection',
                'features': data.routes.map(route => route.geojson)  // Pass GeoJSON directly
            });
        }
    } catch (error) {
        console.error('Error loading drawn routes:', error);
    }
    console.log("Fetched GeoJSON routes:", data?.routes); // Use optional chaining to prevent errors
}



// ============================
// SECTION: Remove Segments
// ============================
function removeSegments() {
    const source = map.getSource('drawnSegments');
    if (source) {
        source.setData({
            'type': 'FeatureCollection',
            'features': []  // Clear the features from the source
        });
    }
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