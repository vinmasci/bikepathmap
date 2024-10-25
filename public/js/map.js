let map;
let layerVisibility = { segments: false, gravel: false, photos: false, pois: false };

// Tile URLs for different map layers
const tileLayers = {
    googleMap: 'https://mt1.google.com/vt/lyrs=r&x={x}&y={y}&z={z}',
    googleSatellite: 'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
    googleHybrid: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
    osmCycle: 'https://tile.thunderforest.com/cycle/{z}/{x}/{y}.png?apikey=7724ff4746164f39b35fadb342b13a50',
};

// Original Mapbox style URL for reset function
const originalMapboxStyle = 'mapbox://styles/mapbox/streets-v11';

// ===========================
// SECTION: Map Initialization
// ===========================
function initMap() {
    console.log("Initializing map...");

    mapboxgl.accessToken = 'pk.eyJ1IjoidmlubWFzY2kiLCJhIjoiY20xY3B1ZmdzMHp5eDJwcHBtMmptOG8zOSJ9.Ayn_YEjOCCqujIYhY9PiiA';  // Replace with your Mapbox token
    map = new mapboxgl.Map({
        container: 'map',
        style: originalMapboxStyle,   // Use original style by default
        center: [144.9631, -37.8136],
        zoom: 10
    });

    map.on('load', function () {
        console.log("Map loaded successfully.");
        initGeoJSONSource();       // Load GeoJSON source for segments
        addSegmentLayers();
        initEventListeners();      // Initialize other event listeners
        updateTabHighlight('segments-tab', false);  // Highlight the segments tab by default

                // Add hover and click events for segment labels
                setupSegmentInteraction();
    });

    map.on('error', (e) => {
        console.error("Map error:", e);
    });
}

// ===========================
// Function to reset to original Mapbox style
// ===========================
function resetToOriginalStyle() {
    map.setStyle(originalMapboxStyle);
    map.once('style.load', () => {
        initGeoJSONSource();
        addSegmentLayers();
    });
}

// ===========================
// Function to dynamically switch between tile layers
// ===========================
function setTileLayer(tileUrl) {
    if (!map || !map.isStyleLoaded()) {
        console.error('Map is not fully loaded yet.');
        return;
    }

    if (map.getSource('custom-tiles')) {
        map.removeLayer('custom-tiles-layer');
        map.removeSource('custom-tiles');
    }

    // Add new tile layer as a source and overlay on the map
    map.addSource('custom-tiles', {
        'type': 'raster',
        'tiles': [tileUrl],
        'tileSize': 256
    });

    map.addLayer({
        'id': 'custom-tiles-layer',
        'type': 'raster',
        'source': 'custom-tiles',
        'layout': { 'visibility': 'visible' }  // Ensure visibility
    });
}


// ============================
// SECTION: Initialize GeoJSON Source for Segments
// ============================
function initGeoJSONSource() {
    if (!map.getSource('drawnSegments')) {
        map.addSource('drawnSegments', {
            'type': 'geojson',
            'data': {
                'type': 'FeatureCollection',
                'features': []  // Initially empty
            }
        });

    }
}


// ============================
// SECTION: Add Segment Layers
// ============================
// Initialize a popup but keep it hidden initially
const segmentPopup = new mapboxgl.Popup({
    closeButton: false,
    closeOnClick: false
});

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

        // Initialize a popup but keep it hidden initially
const segmentPopup = new mapboxgl.Popup({
    closeButton: false,
    closeOnClick: false
});

function setupSegmentInteraction() {
    // Hover interaction for showing segment title
    map.on('mouseenter', 'drawn-segments-layer', (e) => {
        map.getCanvas().style.cursor = 'pointer';

        // Get the title of the hovered segment
        const title = e.features[0].properties.title;

        // Display popup with title if it exists
        if (title) {
            segmentPopup.setLngLat(e.lngLat).setHTML(`<strong>${title}</strong>`).addTo(map);
        }
    });

    // Remove popup and reset cursor on mouse leave
    map.on('mouseleave', 'drawn-segments-layer', () => {
        map.getCanvas().style.cursor = '';
        segmentPopup.remove();  // Hide the popup when mouse leaves
    });

    // Click interaction to show a persistent popup
    map.on('click', 'drawn-segments-layer', (e) => {
        const title = e.features[0].properties.title;
        
        // Show a popup that stays open on click
        if (title) {
            new mapboxgl.Popup()
                .setLngLat(e.lngLat)
                .setHTML(`<strong>${title}</strong>`)
                .addTo(map);
        }
    });
}
    }
}



    // Hover and click interaction for segment labels
    map.on('mouseenter', 'drawn-segments-layer', (e) => {
        map.getCanvas().style.cursor = 'pointer';

        // Get the title of the hovered segment
        const title = e.features[0].properties.title;

        // Display popup with title if it exists
        if (title) {
            segmentPopup.setLngLat(e.lngLat).setHTML(`<strong>${title}</strong>`).addTo(map);
        }
    });

    map.on('mouseleave', 'drawn-segments-layer', () => {
        map.getCanvas().style.cursor = '';
        segmentPopup.remove();  // Hide the popup when mouse leaves
    });

    map.on('click', 'drawn-segments-layer', (e) => {
        const title = e.features[0].properties.title;
        
        // Show a popup that stays open on click
        if (title) {
            new mapboxgl.Popup()
                .setLngLat(e.lngLat)
                .setHTML(`<strong>${title}</strong>`)
                .addTo(map);
        }
    });

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
    // Tabs and control buttons
    document.getElementById('segments-tab').addEventListener('click', toggleSegmentsLayer);
    document.getElementById('draw-route-tab').addEventListener('click', toggleDrawingMode);
    document.getElementById('photos-tab').addEventListener('click', togglePhotoLayer);
    document.getElementById('pois-tab').addEventListener('click', togglePOILayer);
    document.getElementById('add-tab').addEventListener('click', toggleAddDropdown);
    document.getElementById('reset-btn').addEventListener('click', resetRoute);
    document.getElementById('undo-btn').addEventListener('click', undoLastSegment);
    document.getElementById('save-btn').addEventListener('click', saveDrawnRoute);

    // Gravel type radio buttons for updating route color
    document.querySelectorAll('input[name="gravelType"]').forEach((radio) => {
        radio.addEventListener('change', function () {
            const selectedGravelType = this.value;
            selectedColor = gravelColors[selectedGravelType];
            console.log("Route color updated to:", selectedColor);
        });
    });

    // Tile layer selection dropdown listener
    document.getElementById('tileLayerSelect').addEventListener('change', function (event) {
        const selectedLayer = event.target.value;
        if (selectedLayer === 'reset') {
            resetToOriginalStyle();  // Reset to original Mapbox style
        } else if (tileLayers[selectedLayer]) {
            setTileLayer(tileLayers[selectedLayer]);  // Apply selected tile layer
        }
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
