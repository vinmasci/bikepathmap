let map;
let layerVisibility = { segments: false, gravel: false, photos: false, pois: false };

// ===========================
// SECTION: Map Initialization
// ===========================
function initMap() {
    console.log("Initializing map...");
    
    mapboxgl.accessToken = 'pk.eyJ1IjoidmlubWFzY2kiLCJhIjoiY20xY3B1ZmdzMHp5eDJwcHBtMmptOG8zOSJ9.Ayn_YEjOCCqujIYhY9PiiA'; // Replace with your Mapbox token
    map = new mapboxgl.Map({
        container: 'map',               // Specify the ID of the div element where the map should appear
        style: 'mapbox://styles/mapbox/streets-v11',  // Style URL
        center: [144.9631, -37.8136],   // Map center (longitude, latitude)
        zoom: 10                        // Zoom level
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

        // Ensure layers are added after the source is ready
        addSegmentLayers(); // Call a function to add layers once the source is loaded

        // Automatically load segments when the page loads
        loadSegments(); 

        // Set segments to visible by default
        layerVisibility.segments = true;

        // Initialize event listeners
        initEventListeners();

        // Highlight the segments tab by default
        updateTabHighlight('segments-tab', true);
    });
}

// ============================
// SECTION: Add Segment Layers
// ============================
function addSegmentLayers() {
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
                'line-color': '#000000',  
                'line-width': 6           
            }
        });
    }

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
                'line-color': '#FFFFFF',  
                'line-width': 5           
            }
        });
    }

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
                'line-color': ['get', 'color'],  
                'line-width': 3,                
                'line-dasharray': [
                    'case',
                    ['==', ['get', 'lineStyle'], 'dashed'], ['literal', [2, 4]], 
                    ['literal', [1, 0]]  // Solid line by default
                ]
            }
        });
    }
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
        console.log("API Response:", data); // Log the entire response for debugging
        
        if (!data || !data.routes) {
            throw new Error("No data or routes found in the API response");
        }

        // Prepare GeoJSON data
        const geojsonData = {
            'type': 'FeatureCollection',
            'features': data.routes.map(route => route.geojson)
        };
        console.log("GeoJSON Data being set:", geojsonData); // Log the GeoJSON data for verification
        
        const source = map.getSource('drawnSegments');
        if (source) {
            console.log("Updating drawnSegments source with new data.");
            source.setData(geojsonData);  // Update the source with the new GeoJSON data
        } else {
            console.error('drawnSegments source not found.');
        }

        console.log("Fetched GeoJSON routes:", data.routes); // Log the fetched routes for confirmation
    } catch (error) {
        console.error('Error loading drawn routes:', error);
    }
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
        map.setLayoutProperty('drawn-segments-layer', 'visibility', 'visible');
        loadSegments();
    } else {
        map.setLayoutProperty('drawn-segments-layer', 'visibility', 'none');
        removeSegments();
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
// SECTION: Error Handling
// ============================
map.on('error', (e) => {
    console.error("Map error:", e);
});
