// Initialize the Mapbox map
mapboxgl.accessToken = 'pk.eyJ1IjoidmlubWFzY2kiLCJhIjoiY20xY3B1ZmdzMHp5eDJwcHBtMmptOG8zOSJ9.Ayn_YEjOCCqujIYhY9PiiA'; // Replace with your actual token

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
    photos: false
};

// Function to remove layers
function removeLayer(layerId) {
    if (map.getLayer(layerId)) {
        map.removeLayer(layerId);
        map.removeSource(layerId);
    }
}

// Function to toggle GPX layers
function toggleGPXLayer(url, map, layerId) {
    if (layerVisibility[layerId]) {
        // Layer is currently visible, so remove it
        removeLayer(layerId);
        layerVisibility[layerId] = false;
    } else {
        // Layer is not visible, so add it
        fetch(url)
            .then(response => response.text())
            .then(gpxData => {
                const parser = new DOMParser();
                const gpxDoc = parser.parseFromString(gpxData, 'application/xml');

                // Convert GPX to GeoJSON using toGeoJSON
                const geojson = toGeoJSON.gpx(gpxDoc);

                // Add the GeoJSON data as a new source and layer to the map
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
                        'line-color': '#FF0000', // Customize the color as needed
                        'line-width': 4
                    }
                });

                // Update layer visibility state
                layerVisibility[layerId] = true;
            });
    }
}

// Function to toggle photo markers
function togglePhotoLayer() {
    if (layerVisibility.photos) {
        // Photos are visible, remove them
        removePhotoMarkers();
        layerVisibility.photos = false;
    } else {
        // Photos are not visible, add them
        loadPhotoMarkers();
        layerVisibility.photos = true;
    }
}

// Store the markers for the photos so we can remove them later
let photoMarkers = [];

// Function to add photo markers to the map
function loadPhotoMarkers() {
    photos.forEach(photo => {
        // Create a marker for each photo
        const marker = new mapboxgl.Marker()
            .setLngLat(photo.coordinates)
            .addTo(map);

        // Create a popup for each marker with the photo
        const popup = new mapboxgl.Popup({ offset: 25 })
            .setHTML(`<h3>${photo.title}</h3><img src="${photo.imageUrl}" alt="${photo.title}" width="200px">`);

        // Link the popup to the marker
        marker.setPopup(popup);

        // Store the marker so it can be removed later
        photoMarkers.push(marker);
    });
}

// Function to remove photo markers
function removePhotoMarkers() {
    photoMarkers.forEach(marker => marker.remove());
    photoMarkers = [];
}

// Example photo data with coordinates and image paths (photos are in .jpeg format)
const photos = [
    {
        coordinates: [144.9631, -37.814], // Melbourne
        imageUrl: '/photos/photo1.jpeg',
        title: 'Photo 1'
    },
    {
        coordinates: [144.978, -37.819], // Nearby location
        imageUrl: '/photos/photo2.jpeg',
        title: 'Photo 2'
    }
];

// Handle tab switching logic
document.getElementById('road-tab').addEventListener('click', function() {
    toggleGPXLayer(roadGPX, map, 'road');
});
document.getElementById('gravel-tab').addEventListener('click', function() {
    toggleGPXLayer(gravelGPX, map, 'gravel');
});
document.getElementById('photos-tab').addEventListener('click', function() {
    togglePhotoLayer();
});
