let map;
let layerVisibility = { road: false, gravel: false, photos: false, pois: false };
let drawnPoints = [];
let currentLine = null;
let drawingEnabled = false; // Flag for drawing mode
let firstPointMarker = null; // Store the first point marker // Restored line
let markers = []; // Store all point markers, including the first point


// ===========================
// SECTION: Map Initialization
// ===========================
// This section initializes the map using Mapbox. It sets the initial map view
// and loads existing GPX data from local storage if available.
function initMap() {
    mapboxgl.accessToken = 'pk.eyJ1IjoidmlubWFzY2kiLCJhIjoiY20xY3B1ZmdzMHp5eDJwcHBtMmptOG8zOSJ9.Ayn_YEjOCCqujIYhY9PiiA';
    map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/streets-v11',
        center: [144.9631, -37.8136],
        zoom: 10
    });

    // Load existing GPX data if available
    map.on('load', function () {
        const storedGPX = localStorage.getItem('gpxData');
        if (storedGPX) {
            const geojson = JSON.parse(storedGPX);
            addGPXLayer(geojson);
        }
    });

    // Add event listeners for the tabs (toggles for layers)
    document.getElementById('road-tab').addEventListener('click', toggleRoadLayer);
    document.getElementById('draw-route-tab').addEventListener('click', toggleDrawingMode);
    document.getElementById('photos-tab').addEventListener('click', togglePhotoLayer);
    document.getElementById('pois-tab').addEventListener('click', togglePOILayer);
    document.getElementById('add-tab').addEventListener('click', toggleAddDropdown);
}

// ========================================
// SECTION: Adding GPX Layer (Roads/Gravel)
// ========================================
// This section handles adding a GPX layer to the map. It checks if a GPX route
// layer already exists and adds it if not, applying specific styling (orange line).
function addGPXLayer(geojson) {
    if (map.getSource('gpx-route')) {
        map.getSource('gpx-route').setData(geojson);
    } else {
        map.addSource('gpx-route', { type: 'geojson', data: geojson });
        map.addLayer({
            id: 'gpx-route-layer',
            type: 'line',
            source: 'gpx-route',
            layout: { 'line-join': 'round', 'line-cap': 'round' },
            paint: { 
                'line-color': '#FFA500', // Orange color for the line
                'line-width': 4 
            }
        });
    }
}

// ============================
// SECTION: Toggle Functionality
// ============================
// This section handles toggling the visibility of different map layers such as
// road routes, photo markers, and POIs.
function toggleRoadLayer() {
    layerVisibility.road = !layerVisibility.road;
    const visibility = layerVisibility.road ? 'visible' : 'none';
    map.setLayoutProperty('gpx-route-layer', 'visibility', visibility);
    updateTabHighlight('road-tab', layerVisibility.road);
}

function toggleDrawingMode() {
    drawingEnabled = !drawingEnabled;
    if (drawingEnabled) {
        enableDrawingMode();
        document.getElementById('control-panel').style.display = 'block'; // Show control panel
        updateTabHighlight('draw-route-tab', true);
        document.getElementById('map').style.cursor = 'crosshair'; // Set crosshair cursor
    } else {
        disableDrawingMode(false); // Disable drawing mode without saving
        document.getElementById('control-panel').style.display = 'none'; // Hide control panel
        updateTabHighlight('draw-route-tab', false);
        document.getElementById('map').style.cursor = ''; // Reset cursor
    }
}

function togglePhotoLayer() {
    layerVisibility.photos = !layerVisibility.photos;
    updateTabHighlight('photos-tab', layerVisibility.photos);
    if (layerVisibility.photos) {
        loadPhotoMarkers(); // Show photos
    } else {
        removePhotoMarkers(); // Hide photos
    }
}

function togglePOILayer() {
    layerVisibility.pois = !layerVisibility.pois;
    updateTabHighlight('pois-tab', layerVisibility.pois);
    if (layerVisibility.pois) {
        loadPOIMarkers(); // Show POIs
    } else {
        removePOIMarkers(); // Hide POIs
    }
}

// =========================
// SECTION: Dropdown Toggles
// =========================
// This section handles toggling the "Add" dropdown menu.
function toggleAddDropdown() {
    const dropdown = document.getElementById('add-dropdown');
    dropdown.classList.toggle('show');
}

// =========================
// SECTION: Tab Highlighting
// =========================
// This section manages highlighting tabs when a layer is toggled on/off.
function updateTabHighlight(tabId, isActive) {
    const tab = document.getElementById(tabId);
    if (isActive) {
        tab.classList.add('active');
    } else {
        tab.classList.remove('active');
    }
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
    if (shouldSave) {
        saveDrawnRoute();  // Save the drawn route only if this flag is true
    }
    document.getElementById('map').style.cursor = ''; // Reset cursor
}

function drawPoint(e) {
    const coords = [e.lngLat.lng, e.lngLat.lat];
    drawnPoints.push(coords);

    // Create a custom marker element (orange circle with white stroke)
    const markerElement = document.createElement('div');
    markerElement.style.width = '16px';  
    markerElement.style.height = '16px';
    markerElement.style.backgroundColor = '#FFA500'; 
    markerElement.style.borderRadius = '50%'; 
    markerElement.style.border = '2px solid white'; 

    // Add the marker to the map
    const marker = new mapboxgl.Marker({ element: markerElement })
        .setLngLat(coords)
        .addTo(map);

    markers.push(marker); // Store the marker

    if (drawnPoints.length > 1) {
        snapToRoads(drawnPoints); // Snap to roads after the second point
    }
}

// ================================
// SECTION: Road Snapping Function
// ================================
// This section sends the drawn points to the Mapbox API to snap them to roads,
// creating a new line with the snapped coordinates.
async function snapToRoads(points) {
    try {
        const response = await fetch('/api/snap-to-road', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ points })
        });

        const data = await response.json();

        if (data && data.matchings) {
            const snappedPoints = data.matchings[0].geometry.coordinates;

            if (currentLine) {
                map.removeLayer('drawn-route');
                map.removeSource('drawn-route');
            }

            currentLine = {
                'type': 'Feature',
                'geometry': {
                    'type': 'LineString',
                    'coordinates': snappedPoints
                }
            };

            map.addSource('drawn-route', { 'type': 'geojson', 'data': currentLine });
            map.addLayer({
                'id': 'drawn-route',
                'type': 'line',
                'source': 'drawn-route',
                'layout': { 'line-join': 'round', 'line-cap': 'round' },
                'paint': { 
                    'line-color': '#FFA500', 
                    'line-width': 4 
                }
            });
        } else {
            console.error('Snap to road error:', data.message);
        }
    } catch (error) {
        console.error('Error calling /api/snap-to-road:', error);
    }
}

// ==========================
// SECTION: Save Drawn Route
// ==========================
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
            body: JSON.stringify(geojsonData)
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

    // Disable drawing mode but keep control panel visible
    disableDrawingMode(false);

    // No longer hiding the control panel to keep it visible after reset
    // document.getElementById('control-panel').style.display = 'none'; // This line is removed

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
        if (firstMarker) firstMarker.remove(); // Corrected this line
        drawnPoints = [];
        if (currentLine) {
            map.removeLayer('drawn-route');
            map.removeSource('drawn-route'); // Corrected this line
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

// ==========================
// SECTION: POI Marker Logic
// ==========================
// This section handles loading and removing Points of Interest (POI) markers.
async function loadPOIMarkers() {
    console.log("Loading POI markers...");
}

function removePOIMarkers() {
    console.log("Removing POI markers...");
}
