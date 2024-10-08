let map;
let layerVisibility = { road: false, gravel: false, photos: false, pois: false };
let drawnPoints = [];
let currentLine = null;
let drawingEnabled = false; // Flag for drawing mode

function initMap() {
    mapboxgl.accessToken = 'pk.eyJ1IjoidmlubWFzY2kiLCJhIjoiY20xY3B1ZmdzMHp5eDJwcHBtMmptOG8zOSJ9.Ayn_YEjOCCqujIYhY9PiiA';
    map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/streets-v11',
        center: [144.9631, -37.8136],
        zoom: 10
    });

    map.on('load', function () {
        const storedGPX = localStorage.getItem('gpxData');
        if (storedGPX) {
            const geojson = JSON.parse(storedGPX);
            addGPXLayer(geojson);
        }
    });

    // Add event listeners for the tabs
    document.getElementById('road-tab').addEventListener('click', toggleRoadLayer);
    document.getElementById('draw-route-tab').addEventListener('click', toggleDrawingMode);
    document.getElementById('photos-tab').addEventListener('click', togglePhotoLayer);
    document.getElementById('pois-tab').addEventListener('click', togglePOILayer);
    document.getElementById('add-tab').addEventListener('click', toggleAddDropdown);
}

// Function to add GPX Layer
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
            paint: { 'line-color': '#ff0000', 'line-width': 4 }
        });
    }
}

// Toggle road layer
function toggleRoadLayer() {
    layerVisibility.road = !layerVisibility.road;
    const visibility = layerVisibility.road ? 'visible' : 'none';
    map.setLayoutProperty('gpx-route-layer', 'visibility', visibility);
    updateTabHighlight('road-tab', layerVisibility.road);
}

// Toggle drawing mode
function toggleDrawingMode() {
    drawingEnabled = !drawingEnabled;
    if (drawingEnabled) {
        enableDrawingMode();
        document.getElementById('control-panel').style.display = 'block'; // Show control panel
        updateTabHighlight('draw-route-tab', true);
    } else {
        disableDrawingMode();
        document.getElementById('control-panel').style.display = 'none'; // Hide control panel
        updateTabHighlight('draw-route-tab', false);
    }
}

// Toggle photo layer
function togglePhotoLayer() {
    layerVisibility.photos = !layerVisibility.photos;
    updateTabHighlight('photos-tab', layerVisibility.photos);
    if (layerVisibility.photos) {
        loadPhotoMarkers(); // Show photos
    } else {
        removePhotoMarkers(); // Hide photos
    }
}

// Toggle POI layer
function togglePOILayer() {
    layerVisibility.pois = !layerVisibility.pois;
    updateTabHighlight('pois-tab', layerVisibility.pois);
    if (layerVisibility.pois) {
        loadPOIMarkers(); // Show POIs
    } else {
        removePOIMarkers(); // Hide POIs
    }
}

// Toggle Add dropdown
function toggleAddDropdown() {
    const dropdown = document.getElementById('add-dropdown');
    dropdown.classList.toggle('show');
}

// Update tab highlight
function updateTabHighlight(tabId, isActive) {
    const tab = document.getElementById(tabId);
    if (isActive) {
        tab.classList.add('active');
    } else {
        tab.classList.remove('active');
    }
}

// Enable drawing mode
function enableDrawingMode() {
    map.on('click', drawPoint);
}

// Disable drawing mode and save the route
function disableDrawingMode() {
    map.off('click', drawPoint);
    saveDrawnRoute();  // Save the drawn route
}

// Draw a point on the map
function drawPoint(e) {
    const coords = [e.lngLat.lng, e.lngLat.lat];
    drawnPoints.push(coords);

    if (drawnPoints.length > 1) {
        snapToRoads(drawnPoints); // Snap to roads
    }
}

// Snap drawn points to the road using Mapbox API
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
                'paint': { 'line-color': '#ff0000', 'line-width': 4 }
            });
        } else {
            console.error('Snap to road error:', data.message);
        }
    } catch (error) {
        console.error('Error calling /api/snap-to-road:', error);
    }
}

// Save the drawn route to MongoDB
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

// Reset the route
function resetRoute() {
    if (currentLine) {
        map.removeLayer('drawn-route');
        map.removeSource('drawn-route');
        currentLine = null;
        drawnPoints = [];
    }
}

// Undo the last drawn point
function undoLastPoint() {
    if (drawnPoints.length > 1) {
        drawnPoints.pop(); // Remove the last point
        snapToRoads(drawnPoints); // Redraw the route without the last point
    }
}

// Load and remove markers for photos/POIs (placeholder functions)
async function loadPhotoMarkers() { console.log("Loading photo markers..."); }
function removePhotoMarkers() { console.log("Removing photo markers..."); }
async function loadPOIMarkers() { console.log("Loading POI markers..."); }
function removePOIMarkers() { console.log("Removing POI markers..."); }

// Add event listeners for control panel buttons
document.getElementById('undo-btn').addEventListener('click', undoLastPoint);
document.getElementById('reset-btn').addEventListener('click', resetRoute);
document.getElementById('save-btn').addEventListener('click', saveDrawnRoute);
