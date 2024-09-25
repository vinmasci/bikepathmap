// /public/js/map.js

let map;
let layerVisibility = { road: false, gravel: false, photos: false, pois: false };

function initMap() {
    mapboxgl.accessToken = 'pk.eyJ1IjoidmlubWFzY2kiLCJhIjoiY20xY3B1ZmdzMHp5eDJwcHBtMmptOG8zOSJ9.Ayn_YEjOCCqujIYhY9PiiA';
    map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/streets-v11',
        center: [144.9631, -37.8136],
        zoom: 10
    });

    map.on('load', function() {
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
