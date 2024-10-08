let map;
let layerVisibility = { road: false, gravel: false, photos: false, pois: false };
let drawnPoints = [];
let currentLine = null;

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
}

function addGPXLayer(geojson) {
    map.addSource('gpx-route', { type: 'geojson', data: geojson });

    map.addLayer({
        id: 'gpx-route-layer',
        type: 'line',
        source: 'gpx-route',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: { 'line-color': '#ff0000', 'line-width': 4 }
    });
}

function toggleRoadLayer() {
    if (map.getLayer('gpx-route-layer')) {
        layerVisibility.road = !layerVisibility.road;
        map.setLayoutProperty('gpx-route-layer', 'visibility', layerVisibility.road ? 'visible' : 'none');
        updateTabHighlight('road-tab', layerVisibility.road); // Update tab highlight for road tab
    } else {
        alert("No GPX route is loaded yet.");
    }
}

function togglePhotoLayer() {
    if (layerVisibility.photos) {
        removePhotoMarkers(); // Remove photo markers if the layer is visible
        layerVisibility.photos = false;
    } else {
        loadPhotoMarkers(); // Load photo markers if the layer is invisible
        layerVisibility.photos = true;
    }

    updateTabHighlight('photos-tab', layerVisibility.photos); // Update tab highlight for photos tab
}

function updateTabHighlight(tabId, isActive) {
    const tab = document.getElementById(tabId);
    if (isActive) {
        tab.classList.add('active');
    } else {
        tab.classList.remove('active');
    }
}

// Remove all photo markers from the map
function removePhotoMarkers() {
    photoMarkers.forEach(marker => marker.remove());
    photoMarkers = [];
}

// Function to load photo markers from the database
async function loadPhotoMarkers() {
    try {
        const response = await fetch('/api/get-photos');
        const photos = await response.json();

        removePhotoMarkers(); // Clear any previous markers

        photos.forEach(photo => {
            if (photo.latitude && photo.longitude) {
                const markerElement = document.createElement('div');
                markerElement.className = 'custom-marker';
                markerElement.innerHTML = '<i class="fas fa-camera"></i>'; // Camera icon

                const marker = new mapboxgl.Marker(markerElement)
                    .setLngLat([photo.longitude, photo.latitude])
                    .addTo(map);

                const popup = new mapboxgl.Popup({ offset: 25 })
                    .setHTML(`<h3>${photo.originalName}</h3><img src="${photo.url}" style="width:200px;">`);

                marker.setPopup(popup);
                photoMarkers.push(marker);
            }
        });
    } catch (error) {
        console.error('Error loading photo markers:', error);
    }
}

// New: Drawing route functionality with road snapping
function enableDrawingMode() {
    map.on('click', drawPoint);
}

function disableDrawingMode() {
    map.off('click', drawPoint);
    saveDrawnRoute(); // Save the drawn route when disabling
}

function drawPoint(e) {
    const coords = [e.lngLat.lng, e.lngLat.lat];
    drawnPoints.push(coords);

    if (drawnPoints.length > 1) {
        // Call the /api/snap-to-road.js API endpoint to snap the points to the nearest roads
        snapToRoads(drawnPoints);
    }
}

// Function to proxy request to the /api/snap-to-road endpoint
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
                    'coordinates': snappedPoints  // Use snapped points from the /api/snap-to-road endpoint
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

// Function to save the drawn route to MongoDB
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
