// Initialize the Mapbox map with your stored token
mapboxgl.accessToken = 'pk.eyJ1IjoidmlubWFzY2kiLCJhIjoiY20xY3B1ZmdzMHp5eDJwcHBtMmptOG8zOSJ9.Ayn_YEjOCCqujIYhY9PiiA'; // No need to re-add this if already set elsewhere

const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v11',
    center: [144.9631, -37.8136], // Center on Melbourne
    zoom: 10
});

// GPX URLs
const roadGPX = '/GPX/Road/Capital_City_Trail.gpx';
const gravelGPX = '/GPX/Gravel/Dandenong_Creek_Trail_.gpx';

// Function to load and parse GPX data
function loadGPXLayer(url, map, layerId) {
    fetch(url)
        .then(response => response.text())
        .then(gpxData => {
            const parser = new DOMParser();
            const gpxDoc = parser.parseFromString(gpxData, 'application/xml');
            
            // Convert GPX to GeoJSON using toGeoJSON
            const geojson = toGeoJSON.gpx(gpxDoc);

            // Remove existing layer if it exists
            if (map.getSource(layerId)) {
                map.removeLayer(layerId);
                map.removeSource(layerId);
            }

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

            // Fit the map to the bounds of the route
            const coordinates = geojson.features[0].geometry.coordinates;
            const bounds = coordinates.reduce(function(bounds, coord) {
                return bounds.extend(coord);
            }, new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]));

            map.fitBounds(bounds, {
                padding: 20
            });
        });
}

// Load Road Routes GPX Layer
function loadRoadRoutes() {
    loadGPXLayer(roadGPX, map, 'road-route');
}

// Load Gravel Routes GPX Layer
function loadGravelRoutes() {
    loadGPXLayer(gravelGPX, map, 'gravel-route');
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

// Function to add photo markers to the map
function loadPhotoLayer() {
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
    });
}

// Handle tab switching logic
document.getElementById('road-tab').addEventListener('click', function() {
    switchLayer('road');
});
document.getElementById('gravel-tab').addEventListener('click', function() {
    switchLayer('gravel');
});
document.getElementById('photos-tab').addEventListener('click', function() {
    switchLayer('photos');
});

function switchLayer(layer) {
    // Deactivate all tabs
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    document.getElementById(layer + '-tab').classList.add('active');

    // Load corresponding GPX layer or photo layer based on selected tab
    if (layer === 'road') {
        loadRoadRoutes();
    } else if (layer === 'gravel') {
        loadGravelRoutes();
    } else if (layer === 'photos') {
        loadPhotoLayer();
    }
}
