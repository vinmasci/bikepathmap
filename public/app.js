// Initialize the Mapbox map
mapboxgl.accessToken = 'pk.eyJ1IjoidmlubWFzY2kiLCJhIjoiY20xY3B1ZmdzMHp5eDJwcHBtMmptOG8zOSJ9.Ayn_YEjOCCqujIYhY9PiiA'; // Replace with your token

const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v11',
    center: [144.9631, -37.8136], // Center on Melbourne
    zoom: 10
});

// GPX URLs
const roadGPX = '/GPX/Road/Capital_City_Trail.gpx';
const gravelGPX = '/GPX/Gravel/Dandenong_Creek_Trail_.gpx';

// State to track whether layers are on or off
let layerVisibility = {
    road: false,
    gravel: false,
    photos: false,
    pois: false
};

// Helper function to check if a layer exists on the map
function layerExists(layerId) {
    return map.getLayer(layerId);
}

// Function to toggle GPX layers using toGeoJSON
function toggleGPXLayer(url, layerId) {
    if (layerVisibility[layerId]) {
        console.log(`Removing layer: ${layerId}`);
        removeLayer(layerId);
        layerVisibility[layerId] = false;
    } else {
        console.log(`Adding layer: ${layerId}`);
        fetch(url)
            .then(response => response.text())
            .then(gpxData => {
                const parser = new DOMParser();
                const gpxDoc = parser.parseFromString(gpxData, 'application/xml');

                // Ensure toGeoJSON is loaded and accessible
                if (typeof toGeoJSON === 'undefined') {
                    console.error('toGeoJSON is not loaded');
                    return;
                }

                const geojson = toGeoJSON.gpx(gpxDoc);

                if (!layerExists(layerId)) {
                    map.addSource(layerId, {
                        type: 'geojson',
                        data: geojson
                    });

                    map.addLayer({
                        id: layerId,
                        type: 'line',
                        source: layerId,
                        layout: {
                            'line-join': 'round',
                            'line-cap': 'round'
                        },
                        paint: {
                            'line-color': '#FF0000', // Customize the color
                            'line-width': 4
                        }
                    });

                    layerVisibility[layerId] = true;
                }
            })
            .catch(error => console.error('Error loading GPX:', error));
    }
}

// Function to remove layers
function removeLayer(layerId) {
    if (layerExists(layerId)) {
        map.removeLayer(layerId);
        map.removeSource(layerId);
    }
}

// Store the markers for the POIs
let poiMarkers = [];

// Function to load all POIs
function loadPOIMarkers() {
    pois.forEach(poi => addPOIMarker(poi));
}

// Function to add a POI marker
function addPOIMarker(poi) {
    const markerElement = document.createElement('div');
    markerElement.className = 'poi-marker';
    markerElement.style.fontSize = '24px';
    markerElement.innerHTML = poiIcons[poi.type] || poiIcons['tourist'];

    const marker = new mapboxgl.Marker(markerElement)
        .setLngLat(poi.coordinates)
        .addTo(map);

    const popup = new mapboxgl.Popup({ offset: 25 })
        .setHTML(`<h3>${poi.title}</h3><p>${poi.description}</p>`);

    marker.setPopup(popup);
    poiMarkers.push(marker);
}

// Function to remove POI markers
function removePOIMarkers() {
    poiMarkers.forEach(marker => marker.remove());
    poiMarkers = [];
}

// Example POI data
let pois = [
    {
        coordinates: [144.9631, -37.814],
        title: 'Federation Square',
        description: 'A famous cultural precinct in Melbourne.',
        type: 'tourist'
    },
    {
        coordinates: [144.978, -37.819],
        title: 'Flinders Street Station',
        description: 'One of Melbourne\'s most iconic buildings.',
        type: 'tourist'
    }
];

// Store the markers for the photos
let photoMarkers = [];

// Function to load photo markers
function loadPhotoMarkers() {
    photos.forEach(photo => {
        const marker = new mapboxgl.Marker()
            .setLngLat(photo.coordinates)
            .addTo(map);

        const popup = new mapboxgl.Popup({ offset: 25 })
            .setHTML(`<h3>${photo.title}</h3><img src="${photo.imageUrl}" alt="${photo.title}" width="200px">`);

        marker.setPopup(popup);
        photoMarkers.push(marker);
    });
}

// Function to remove photo markers
function removePhotoMarkers() {
    photoMarkers.forEach(marker => marker.remove());
    photoMarkers = [];
}

// Photos array
const photos = [
    {
        coordinates: [144.9631, -37.814],
        imageUrl: '/photos/photo1.jpeg',
        title: 'Photo 1'
    },
    {
        coordinates: [144.978, -37.819],
        imageUrl: '/photos/photo2.jpeg',
        title: 'Photo 2'
    }
];

// Toggle Photos Layer
function togglePhotoLayer() {
    if (layerVisibility.photos) {
        console.log("Removing photo layer");
        removePhotoMarkers();
        layerVisibility.photos = false;
    } else {
        console.log("Adding photo layer");
        loadPhotoMarkers();
        layerVisibility.photos = true;
    }
}

// Toggle POI Layer
function togglePOILayer() {
    if (layerVisibility.pois) {
        console.log("Removing POI layer");
        removePOIMarkers();
        layerVisibility.pois = false;
    } else {
        console.log("Adding POI layer");
        loadPOIMarkers();
        layerVisibility.pois = true;
    }
}

// Handle tab switching logic
document.getElementById('road-tab').addEventListener('click', function () {
    toggleGPXLayer(roadGPX, 'road');
    highlightTab('road-tab');
});

document.getElementById('gravel-tab').addEventListener('click', function () {
    toggleGPXLayer(gravelGPX, 'gravel');
    highlightTab('gravel-tab');
});

document.getElementById('photos-tab').addEventListener('click', function () {
    togglePhotoLayer();
    highlightTab('photos-tab');
});

document.getElementById('pois-tab').addEventListener('click', function () {
    togglePOILayer();
    highlightTab('pois-tab');
});

// Function to highlight the active tab
function highlightTab(tabId) {
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
}
