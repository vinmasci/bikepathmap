// Initialize the Mapbox map
mapboxgl.accessToken = 'pk.eyJ1IjoidmlubWFzY2kiLCJhIjoiY20xY3B1ZmdzMHp5eDJwcHBtMmptOG8zOSJ9.Ayn_YEjOCCqujIYhY9PiiA';

const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v11', // You can use any Mapbox style
    center: [144.9631, -37.8136], // Center it on Melbourne, adjust as needed
    zoom: 10
});

// GPX URLs
const roadGPX = '/GPX/Road/Capital_City_Trail.gpx';
const gravelGPX = '/GPX/Gravel/Dandenong_Creek_Trail_.gpx';

// Function to load GPX data, parse it, and display it as a line on the map
function loadGPXLayer(url, map, layerId) {
    fetch(url)
        .then(response => response.text())
        .then(gpxData => {
            const parser = new DOMParser();
            const gpxDoc = parser.parseFromString(gpxData, 'application/xml');
            
            // Convert GPX to GeoJSON using togeojson
            const geojson = togeojson.gpx(gpxDoc);

            // Add the GeoJSON as a line on the map
            if (map.getSource(layerId)) {
                map.removeLayer(layerId);
                map.removeSource(layerId);
            }

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

            // Optionally, fit the map to the bounds of the route
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

// Handle tab switching logic
document.getElementById('road-tab').addEventListener('click', function() {
    switchLayer('road');
});
document.getElementById('gravel-tab').addEventListener('click', function() {
    switchLayer('gravel');
});

function switchLayer(layer) {
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    document.getElementById(layer + '-tab').classList.add('active');

    if (layer === 'road') {
        loadRoadRoutes();
    } else if (layer === 'gravel') {
        loadGravelRoutes();
    }
}
