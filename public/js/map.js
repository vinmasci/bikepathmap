let map;
let layerVisibility = { segments: false, gravel: false, photos: false, pois: false };
let drawnPoints = [];
let currentLine = null;
let drawingEnabled = false; // Flag for drawing mode
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

    if (layerVisibility.segments) {
        loadSegmentsFromDB();  // Load saved segments when the tab is enabled
    } else {
        if (map.getLayer('segments-layer')) {
            map.removeLayer('segments-layer');
        }
        if (map.getSource('segments')) {
            map.removeSource('segments');
        }
    }

    updateTabHighlight('segments-tab', layerVisibility.segments);
}

// ============================
// SECTION: Load Segments from MongoDB
// ============================
async function loadSegmentsFromDB() {
    try {
        const response = await fetch('/api/get-saved-routes');
        const data = await response.json();

        if (data.routes && data.routes.length > 0) {
            const geojsonData = {
                type: 'FeatureCollection',
                features: data.routes.map(route => ({
                    type: 'Feature',
                    geometry: route.geojson.features[0].geometry,
                    properties: route.geojson.features[0].properties || {}
                }))
            };

            if (map.getSource('segments')) {
                map.getSource('segments').setData(geojsonData);
            } else {
                map.addSource('segments', {
                    type: 'geojson',
                    data: geojsonData
                });

                map.addLayer({
                    id: 'segments-layer',
                    type: 'line',
                    source: 'segments',
                    layout: {
                        'line-join': 'round',
                        'line-cap': 'round'
                    },
                    paint: {
                        'line-color': '#FFA500',
                        'line-width': 4
                    }
                });
            }
        }
    } catch (error) {
        console.error('Error loading segments:', error);
    }
}

// =========================
// SECTION: Drawing Function
// =========================
function enableDrawingMode() {
    map.on('click', drawPoint);
    map.getCanvas().style.cursor = 'crosshair'; // Set cursor to crosshair
}

function disableDrawingMode(shouldSave = true) {
    map.off('click', drawPoint);
    if (shouldSave && drawnPoints.length > 1) {
        saveDrawnRoute();  // Save the drawn route only if this flag is true and there are points
    }
    map.getCanvas().style.cursor = ''; // Reset cursor to default
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
// SECTION: Road and Bike Path Snapping Function
// ================================
// This section sends the drawn points to the Mapbox API using the cycling profile
// to snap them to roads and bike paths, creating a new line with the snapped coordinates.
async function snapToRoads(points) {
    try {
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
                    'line-color': '#FFA500',
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
    if (drawnPoints.length > 1) {
        const geojsonData = {
            type: 'FeatureCollection',
            features: [
                {
                    type: 'Feature',
                    geometry: {
                        type: 'LineString',
                        coordinates: drawnPoints
                    },
                    properties: {}
                }
            ]
        };

        fetch('/api/save-drawn-route', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ geojson: geojsonData })
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
function resetRoute() {
    if (currentLine) {
        map.removeLayer('drawn-route');
        map.removeSource('drawn-route');
        currentLine = null;
    }

    markers.forEach(marker => marker.remove());
    markers = [];
    drawnPoints = [];

    disableDrawingMode(false);
    enableDrawingMode(); // Re-enable drawing mode after reset

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
        if (firstMarker) firstMarker.remove();
        drawnPoints = [];
        if (currentLine) {
            map.removeLayer('drawn-route');
            map.removeSource('drawn-route');
            currentLine = null;
        }
        alert('All points have been undone.');
    }
}

// ============================
// SECTION: Photo Marker Logic
// ============================
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
async function loadPOIMarkers() {
    console.log("Loading POI markers...");

    const poiData = [
        { coords: [144.9631, -37.8136], name: "POI 1" },
        { coords: [144.9701, -37.8206], name: "POI 2" }
    ];

    poiData.forEach(poi => {
        const marker = new mapboxgl.Marker()
            .setLngLat(poi.coords)
            .setPopup(new mapboxgl.Popup().setText(poi.name))
            .addTo(map);

        poiMarkers.push(marker);
    });
}

function removePOIMarkers() {
    console.log("Removing POI markers...");
    poiMarkers.forEach(marker => marker.remove());
    poiMarkers = [];
}
