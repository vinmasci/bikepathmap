let map;
let layerVisibility = { segments: false, gravel: false, photos: false, pois: false };
let drawnPoints = [];
let currentLine = null;
let drawingEnabled = false; // Flag for drawing mode
let firstPointMarker = null; // Store the first point marker
let markers = []; // Store all point markers, including the first point

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
    map.setLayoutProperty('gpx-route-layer', 'visibility', visibility);
    updateTabHighlight('segments-tab', layerVisibility.segments);
}

function toggleDrawingMode() {
    drawingEnabled = !drawingEnabled;
    if (drawingEnabled) {
        enableDrawingMode();
        document.getElementById('control-panel').style.display = 'block'; // Show control panel
        updateTabHighlight('draw-route-tab', true);
        map.getCanvas().style.cursor = 'crosshair'; // Set crosshair cursor when drawing is enabled
    } else {
        disableDrawingMode(false); // Disable drawing mode without saving
        document.getElementById('control-panel').style.display = 'none'; // Hide control panel
        updateTabHighlight('draw-route-tab', false);
        map.getCanvas().style.cursor = ''; // Reset cursor to default when drawing is disabled
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
        removePOIMarkers(); // Hide POIs.
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
    map.getCanvas().style.cursor = 'crosshair'; // Ensure crosshair cursor is set when drawing mode is enabled
}

function disableDrawingMode(shouldSave = true) {
    map.off('click', drawPoint);
    if (shouldSave && drawnPoints.length > 1) {
        console.log("Saving drawn route...");  // Debugging log
        saveDrawnRoute();  // Save the drawn route only if this flag is true and there are points
    }
    map.getCanvas().style.cursor = ''; // Reset cursor to default when drawing mode is disabled
}



function drawPoint(e) {
    const coords = [e.lngLat.lng, e.lngLat.lat];
    console.log("Adding point:", coords);  // Log each point added
    drawnPoints.push(coords);

    const markerElement = document.createElement('div');
    markerElement.style.width = '16px';  
    markerElement.style.height = '16px';
    markerElement.style.backgroundColor = '#FFA500'; 
    markerElement.style.borderRadius = '50%'; 
    markerElement.style.border = '2px solid white';

    const marker = new mapboxgl.Marker({ element: markerElement })
        .setLngLat(coords)
        .addTo(map);

    markers.push(marker);

    if (drawnPoints.length > 1) {
        snapToRoads(drawnPoints); // Snap to roads after the second point
    }
}



// ================================
// SECTION: Road and Bike Path Snapping Function
// ================================
// This section sends the drawn points to the Mapbox API using the cycling profile
// to snap them to roads and bike paths, creating a new line with the snapped coordinates.
async function snapToRoads(points) {
    try {
        // Convert points array to a string of coordinates
        const coordinatesString = points.map(coord => coord.join(',')).join(';');

        // Send the request to Mapbox's Map Matching API with the 'cycling' profile
        const response = await fetch(`https://api.mapbox.com/matching/v5/mapbox/cycling/${coordinatesString}?access_token=${mapboxgl.accessToken}&geometries=geojson&steps=true`);

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
                    'line-color': '#FFA500', // Orange color for the line
                    'line-width': 4 
                }
            });
        } else {
            console.error('Snap to road and bike path error:', data.message);
        }
    } catch (error) {
        console.error('Error calling Mapbox cycling API:', error);
    }
}

// ==========================
// SECTION: Save Drawn Route
// ==========================
// This section handles saving the drawn route to the backend (MongoDB) once the
// drawing mode is disabled and points are snapped to the road.
function saveDrawnRoute() {
    console.log("saveDrawnRoute called"); // Check if function is triggered

    if (drawnPoints.length > 1) {
        // Construct GeoJSON data from drawn points
        const geojsonData = {
            'type': 'FeatureCollection',
            'features': [
                {
                    'type': 'Feature',
                    'geometry': {
                        'type': 'LineString',
                        'coordinates': drawnPoints // The drawn route's coordinates
                    },
                    'properties': {}
                }
            ]
        };

        console.log("GeoJSON Data:", geojsonData); // Log GeoJSON data

        // Send the GeoJSON data to the backend API to save the route in MongoDB
        fetch('/api/save-drawn-route', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ geojson: geojsonData }) // Send the GeoJSON in the request body
        })
        .then(response => {
            console.log("Fetch response status:", response.status);  // Log fetch status
            return response.json();
        })
        .then(data => {
            console.log("Fetch data:", data);  // Log actual response data
            if (data.success) {
                alert('Route saved successfully!');
            } else {
                alert('Error saving route.');
            }
        })
        .catch(error => {
            console.error('Error during fetch request:', error);  // Log any errors
        });
    } else {
        alert('No route to save.');  // If no points were drawn
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
