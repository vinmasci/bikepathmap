let map;
let layerVisibility = { segments: false, gravel: false, photos: false, pois: false };
let drawnPoints = [];
let currentLine = null;
let drawingEnabled = false; // Flag for drawing mode
let firstPointMarker = null; // Store the first point marker
let markers = []; // Store all point markers, including the first point
let segmentRoutes = []; // To store the segment routes loaded from MongoDB

// ===========================
// SECTION: Map Initialization
// ===========================
// This section initializes the map using Mapbox. It sets the initial map view.
function initMap() {
    mapboxgl.accessToken = 'pk.eyJ1IjoidmlubWFzY2kiLCJhIjoiY20xY3B1ZmdzMHp5eDJwcHBtMmptOG8zOSJ9.Ayn_YEjOCCqujIYhY9PiiA';
    map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/streets-v11',
        center: [144.9631, -37.8136],
        zoom: 10
    });

    // Add event listeners for the tabs (toggles for layers)
    document.getElementById('segments-tab').addEventListener('click', toggleSegmentsLayer);
    document.getElementById('draw-route-tab').addEventListener('click', toggleDrawingMode);
    document.getElementById('photos-tab').addEventListener('click', togglePhotoLayer);
    document.getElementById('pois-tab').addEventListener('click', togglePOILayer);
    document.getElementById('add-tab').addEventListener('click', toggleAddDropdown);
}

// ============================
// SECTION: Toggle Functionality
// ============================
// This section handles toggling the visibility of different map layers such as
// segments, photo markers, and POIs.
function toggleSegmentsLayer() {
    layerVisibility.segments = !layerVisibility.segments;
    const visibility = layerVisibility.segments ? 'visible' : 'none';

    if (layerVisibility.segments) {
        loadSavedRoutes(); // Load saved routes from MongoDB when the segment layer is toggled on
    } else {
        removeSegmentRoutes(); // Remove segment routes from the map when toggled off
    }

    updateTabHighlight('segments-tab', layerVisibility.segments);
}

// ============================
// SECTION: Load Saved Routes
// ============================
// This section loads saved routes from MongoDB and displays them on the map.
async function loadSavedRoutes() {
    try {
        const response = await fetch('/api/get-saved-routes'); // Assuming you have a route to fetch saved routes
        const data = await response.json();

        if (data.routes) {
            data.routes.forEach(route => {
                const geojson = route.geojson;
                map.addSource(`route-${route._id}`, { type: 'geojson', data: geojson });

                map.addLayer({
                    id: `route-layer-${route._id}`,
                    type: 'line',
                    source: `route-${route._id}`,
                    layout: { 'line-join': 'round', 'line-cap': 'round' },
                    paint: { 'line-color': '#00FF00', 'line-width': 4 } // Green color for saved segments
                });

                segmentRoutes.push(route._id); // Store the route IDs
            });
        }
    } catch (error) {
        console.error('Error loading saved routes:', error);
    }
}

// ============================
// SECTION: Remove Segment Routes
// ============================
// This section removes the saved routes from the map when the segment layer is toggled off.
function removeSegmentRoutes() {
    segmentRoutes.forEach(routeId => {
        if (map.getLayer(`route-layer-${routeId}`)) {
            map.removeLayer(`route-layer-${routeId}`);
        }
        if (map.getSource(`route-${routeId}`)) {
            map.removeSource(`route-${routeId}`);
        }
    });

    segmentRoutes = []; // Clear the stored routes
}

// ========================
// SECTION: Drawing Function
// ========================
// This section handles enabling/disabling the drawing mode, creating points,
// and snapping drawn points to roads using the Mapbox API.
function enableDrawingMode() {
    map.on('click', drawPoint);
    document.getElementById('map').style.cursor = 'crosshair'; // Set cursor to crosshair
}

function disableDrawingMode(shouldSave = true) {
    map.off('click', drawPoint);
    if (shouldSave && drawnPoints.length > 1) {
        saveDrawnRoute();  // Save the drawn route only if this flag is true and there are points
    }
    document.getElementById('map').style.cursor = ''; // Reset cursor
}

// ================================
// SECTION: Save Drawn Route
// ================================
// This section handles saving the drawn route to the backend (MongoDB) once the
// drawing mode is disabled and points are snapped to the road.
function saveDrawnRoute() {
    if (drawnPoints.length > 1) {
        const geojsonData = {
            'type': 'FeatureCollection',
            'features': [
                {
                    'type': 'Feature',
                    'geometry': {
                        'type': 'LineString',
                        'coordinates': drawnPoints
                    },
                    'properties': {}
                }
            ]
        };

        fetch('/api/save-drawn-route', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ geojson: geojsonData }) // Send geojson to your API
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Route saved successfully!');
            } else {
                alert('Error saving route.');
            }
        })
        .catch(error => console.error('Error:', error));
    } else {
        alert('No route to save.');
    }
}

// ===========================
// SECTION: Reset and Undo
// ===========================
// This section handles resetting the route (clearing markers and drawn points)
// and undoing the last drawn point.
function resetRoute() {
    if (currentLine) {
        map.removeLayer('drawn-route');
        map.removeSource('drawn-route');
        currentLine = null; 
    }

    // Remove all markers from the map
    markers.forEach(marker => marker.remove());
    markers = []; 

    drawnPoints = []; 

    // Keep drawing mode enabled after reset
    disableDrawingMode(false);
    enableDrawingMode();  // Re-enable drawing mode after reset

    alert('Route has been reset.');
}

function undoLastPoint() {
    if (drawnPoints.length > 1) {
        drawnPoints.pop(); 
        const lastMarker = markers.pop();
        if (lastMarker) lastMarker.remove();
        if (drawnPoints.length > 1) {
            snapToRoads(drawnPoints); 
        } else {
            if (currentLine) {
                map.removeLayer('drawn-route');
                map.removeSource('drawn-route');
                currentLine = null;
            }
        }
    } else if (drawnPoints.length === 1) {
        const firstMarker = markers.pop();
        if (firstMarker) firstMarker.remove(); // Fixed the missing parentheses here
        drawnPoints = [];
        if (currentLine) {
            map.removeLayer('drawn-route');
            map.removeSource('drawn-route'); // Fixed the missing period here
            currentLine = null;
        }
        alert('All points have been undone.');
    }
}

// ============================
// SECTION: Photo Marker Logic
// ============================
// This section handles loading and removing photo markers from the map.
async function loadPhotoMarkers() {
    console.log("Loading photo markers...");
}

function removePhotoMarkers() {
    console.log("Removing photo markers...");
}

let poiMarkers = []; // Array to store POI markers

// ==========================
// SECTION: POI Marker Logic
// ==========================
// This section handles loading and removing Points of Interest (POI) markers.
async function loadPOIMarkers() {
    console.log("Loading POI markers...");

    // Example POI data
    const poiData = [
        { coords: [144.9631, -37.8136], name: "POI 1" },
        { coords: [144.9701, -37.8206], name: "POI 2" }
    ];

    // Loop through the POI data and create markers
    poiData.forEach(poi => {
        const marker = new mapboxgl.Marker()
            .setLngLat(poi.coords)
            .setPopup(new mapboxgl.Popup().setText(poi.name)) // Add a popup with the POI name
            .addTo(map);

        // Store each marker in the poiMarkers array
        poiMarkers.push(marker);
    });
}

function removePOIMarkers() {
    console.log("Removing POI markers...");

    // Loop through the poiMarkers array and remove each marker from the map
    poiMarkers.forEach(marker => marker.remove());

    // Clear the array after removing the markers
    poiMarkers = [];
}
