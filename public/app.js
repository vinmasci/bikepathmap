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
    photos: false,
    pois: false
};

// Store the markers for the POIs so we can remove them later
let poiMarkers = [];

// Function to add a POI marker using FontAwesome icons
function addPOIMarker(poi) {
    const markerElement = document.createElement('div');
    markerElement.className = 'poi-marker';
    markerElement.style.fontSize = '24px';
    markerElement.style.color = poi.type === 'restaurant' ? 'red' : 'blue'; // Color based on POI type
    markerElement.innerHTML = poi.type === 'restaurant' ? '<i class="fas fa-utensils"></i>' : '<i class="fas fa-landmark"></i>';

    // Create a marker for each POI
    const marker = new mapboxgl.Marker(markerElement)
        .setLngLat(poi.coordinates)
        .addTo(map);

    // Create a popup for each marker with the POI details
    const popup = new mapboxgl.Popup({ offset: 25 })
        .setHTML(`<h3>${poi.title}</h3><p>${poi.description}</p>`);

    // Link the popup to the marker
    marker.setPopup(popup);

    // Store the marker so it can be removed later
    poiMarkers.push(marker);
}

// Function to load all POIs
function loadPOIMarkers() {
    pois.forEach(poi => {
        addPOIMarker(poi);
    });
}

// Function to remove POI markers
function removePOIMarkers() {
    poiMarkers.forEach(marker => marker.remove());
    poiMarkers = [];
}

// Example POI data with coordinates and details
let pois = [
    {
        coordinates: [144.9631, -37.814], // Melbourne
        title: 'Federation Square',
        description: 'A famous cultural precinct in the heart of Melbourne.',
        type: 'landmark' // Use landmark icon for this
    },
    {
        coordinates: [144.978, -37.819], // Nearby location
        title: 'Flinders Street Station',
        description: 'One of Melbourne\'s most iconic buildings.',
        type: 'landmark'
    }
];

// Function to toggle POI markers
function togglePOILayer() {
    if (layerVisibility.pois) {
        // POIs are visible, remove them
        removePOIMarkers();
        layerVisibility.pois = false;
    } else {
        // POIs are not visible, add them
        loadPOIMarkers();
        layerVisibility.pois = true;
    }
}

// Floating button to add a new POI
const addPOIButton = document.createElement('button');
addPOIButton.innerHTML = '<i class="fas fa-plus"></i>';
addPOIButton.style.position = 'fixed';
addPOIButton.style.bottom = '20px';
addPOIButton.style.right = '20px';
addPOIButton.style.width = '50px';
addPOIButton.style.height = '50px';
addPOIButton.style.backgroundColor = '#007bff';
addPOIButton.style.color = 'white';
addPOIButton.style.border = 'none';
addPOIButton.style.borderRadius = '50%';
addPOIButton.style.cursor = 'pointer';
document.body.appendChild(addPOIButton);

// Add click event to the floating button to place a new POI
addPOIButton.addEventListener('click', function() {
    map.once('click', function(e) {
        const coordinates = [e.lngLat.lng, e.lngLat.lat];
        const title = prompt('Enter POI title:');
        const description = prompt('Enter POI description:');
        const type = prompt('Enter POI type (e.g., restaurant, landmark):');

        // Create new POI object
        const newPOI = {
            coordinates: coordinates,
            title: title,
            description: description,
            type: type || 'landmark'
        };

        // Add the new POI to the list of POIs
        pois.push(newPOI);

        // Add the new POI marker to the map
        addPOIMarker(newPOI);
    });
});

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
document.getElementById('pois-tab').addEventListener('click', function() {
    togglePOILayer();
});

// Dummy toggleGPXLayer and togglePhotoLayer functions for now (replace with actual logic)
function toggleGPXLayer() {
    console.log("GPX layer toggle not yet implemented");
}

function togglePhotoLayer() {
    console.log("Photo layer toggle not yet implemented");
}
