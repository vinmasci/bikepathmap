// Initialize the Mapbox map
mapboxgl.accessToken = 'pk.eyJ1IjoidmlubWFzY2kiLCJhIjoiY20xY3B1ZmdzMHp5eDJwcHBtMmptOG8zOSJ9.Ayn_YEjOCCqujIYhY9PiiA'; // Replace with your Mapbox token

const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v11',
    center: [144.9631, -37.8136], // Center on Melbourne
    zoom: 10
});

// Function to load and parse GPX data
function loadGPXLayer(url, map, layerId) {
    fetch(url)
        .then(response => response.text())
        .then(gpxData => {
            const parser = new DOMParser();
            const gpxDoc = parser.parseFromString(gpxData, 'application/xml');
            
            // Convert GPX to GeoJSON using the locally loaded toGeoJSON library
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

// GPX URLs (adjust to the lowercase filenames as requested)
const roadGPX = '/GPX/Road/Capital_City_Trail.gpx';
const gravelGPX = '/GPX/Gravel/Dandenong_Creek_Trail_.gpx';

// Load Road Routes GPX Layer
function loadRoadRoutes() {
    loadGPXLayer(roadGPX, map, 'road-route');
}

// Load Gravel Routes GPX Layer
function loadGravelRoutes() {
    loadGPXLayer(gravelGPX, map, 'gravel-route');
}

// Handle tab switching logic
document.getElementById('road-tab').addEventListener('click', function() {
    switchLayer('road');
});
document.getElementById('gravel-tab').addEventListener('click', function() {
    switchLayer('gravel');
});

function switchLayer(layer) {
    // Deactivate all tabs
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));

    // Activate the current tab
    document.getElementById(layer + '-tab').classList.add('active');

    // Load corresponding GPX layer based on selected tab
    if (layer === 'road') {
        loadRoadRoutes();
    } else if (layer === 'gravel') {
        loadGravelRoutes();
    }
}
