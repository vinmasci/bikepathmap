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

        map.on('error', (e) => {
            console.error("Map error:", e);
        });
        

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



        // Initialize event listeners
        initEventListeners();

        // Highlight the segments tab by default
        updateTabHighlight('segments-tab', false);
    });
}

// ============================
// SECTION: Add Segment Layers
// ============================
function addSegmentLayers() {
    // Add the background layer first
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
                'line-color': '#FFFFFF',  // White background
                'line-width': 5           // Slightly wider than the main line
            }
        });
    }

    // Add the stroke layer next (to provide an outline)
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
                'line-width': 6           // Thick stroke
            }
        });
    }

    // Add the actual segments layer (with dynamic color and line style)
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
                'line-color': ['get', 'color'],  // Dynamic color from GeoJSON
                'line-width': 3,                 // Thinner than stroke and background
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
        console.log("Raw routes data from API:", data.routes);  // Log raw data from API

        if (!data || !data.routes) {
            throw new Error("No data or routes found in the API response");
        }

        // Log each route's geojson individually
        data.routes.forEach((route, index) => {
            console.log(`Route ${index} geojson:`, route.geojson);
        });

        // Map over routes to get their geojson features and filter valid ones
        const geojsonData = {
            'type': 'FeatureCollection',
            'features': data.routes.flatMap(route => {
                if (route.geojson && route.geojson.features) {
                    // Ensure each geojson has valid features
                    return route.geojson.features.filter(feature => 
                        feature && feature.geometry && feature.geometry.coordinates);
                }
                return [];  // Return an empty array if there are no valid features
            })
        };

        console.log("GeoJSON Data being set:", geojsonData);  // Log the entire GeoJSON data after filtering

        const source = map.getSource('drawnSegments');
        if (source) {
            console.log("Setting data for drawnSegments.");
            source.setData(geojsonData);  // Update the source with the new GeoJSON data
        } else {
            console.error('drawnSegments source not found.');
        }
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
    document.getElementById('draw-route-tab').addEventListener('click', toggleDrawingMode);
    document.getElementById('photos-tab').addEventListener('click', togglePhotoLayer);
    document.getElementById('pois-tab').addEventListener('click', togglePOILayer);
    document.getElementById('add-tab').addEventListener('click', toggleAddDropdown);

    // Add event listeners for the reset, undo, and save buttons
    document.getElementById('reset-btn').addEventListener('click', resetRoute);  // Reset button triggers resetRoute
    document.getElementById('undo-btn').addEventListener('click', undoLastSegment); // Undo button triggers undoLastSegment
    document.getElementById('save-btn').addEventListener('click', saveDrawnRoute);  // Save button triggers saveDrawnRoute

        // Add event listeners to the gravel type radio buttons to change route color instantly
        document.querySelectorAll('input[name="gravelType"]').forEach((radio) => {
            radio.addEventListener('change', function () {
                const selectedGravelType = this.value;
                selectedColor = gravelColors[selectedGravelType];  // Update selectedColor based on chosen gravel type
                console.log("Route color updated to:", selectedColor);
            });
        });
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
