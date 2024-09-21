// Initialize the Mapbox map
mapboxgl.accessToken = 'pk.eyJ1IjoidmlubWFzY2kiLCJhIjoiY20xY3B1ZmdzMHp5eDJwcHBtMmptOG8zOSJ9.Ayn_YEjOCCqujIYhY9PiiA';

const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v11', // You can use any Mapbox style
    center: [144.9631, -37.8136], // Center it on Melbourne, adjust as needed
    zoom: 10
});

// GPX URLs
const roadGPX = '/GPX/Road/Capital_City_Trail.GPX'; // Corrected URL
const gravelGPX = '/GPX/Gravel/Dandenong_Creek_Trail_.gpx'; // Corrected URL


// Function to load GPX data and display it on the map
function loadGPXLayer(url, map) {
    fetch(url)
        .then(response => response.text())
        .then(gpxData => {
            console.log(gpxData); // Here we'll parse the GPX data
            // You can add actual GPX parsing logic here
            // For example, using libraries like togpx or leaflet-omnivore

            // Example of adding a marker, replace this with GPX parsing and rendering
            new mapboxgl.Marker()
                .setLngLat([144.9631, -37.8136]) // Adjust based on GPX data
                .addTo(map);
        });
}

// Load Road Routes GPX Layer
function loadRoadRoutes() {
    loadGPXLayer(roadGPX, map);
}

// Load Gravel Routes GPX Layer
function loadGravelRoutes() {
    loadGPXLayer(gravelGPX, map);
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
document.getElementById('pois-tab').addEventListener('click', function() {
    switchLayer('pois');
});

function switchLayer(layer) {
    // Deactivate all tabs
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));

    // Activate the current tab
    document.getElementById(layer + '-tab').classList.add('active');

    // Load corresponding GPX layers based on the tab selected
    if (layer === 'road') {
        loadRoadRoutes();
    } else if (layer === 'gravel') {
        loadGravelRoutes();
    }
}
