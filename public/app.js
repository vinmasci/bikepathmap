// Initialize the Mapbox map
mapboxgl.accessToken = 'YOUR_MAPBOX_ACCESS_TOKEN'; // Replace with your own Mapbox token

const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v11', // You can use any Mapbox style
    center: [144.9631, -37.8136], // Center it on Melbourne, adjust as needed
    zoom: 10
});

// Placeholder for layers
let roadLayer = {}; // Placeholder for road routes GPX layer
let gravelLayer = {}; // Placeholder for gravel routes GPX layer
let photosLayer = {}; // Placeholder for photos layer
let poisLayer = {}; // Placeholder for POIs layer

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

    // Placeholder logic for switching layers (to be implemented later)
    console.log(`Switched to ${layer} layer`);
}
