// Initialize the Mapbox map
mapboxgl.accessToken = 'pk.eyJ1IjoidmlubWFzY2kiLCJhIjoiY20xY3B1ZmdzMHp5eDJwcHBtMmptOG8zOSJ9.Ayn_YEjOCCqujIYhY9PiiA'; // Use your actual token

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

// Function to toggle GPX layers
function toggleGPXLayer(url, map, layerId) {
    if (layerVisibility[layerId]) {
        // Layer is currently visible, remove it
        removeLayer(layerId);
        layerVisibility[layerId] = false;
    } else {
        // Layer is not visible, add it
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

// Function to remove layers
function removeLayer(layerId) {
    if (map.getLayer(layerId)) {
        map.removeLayer(layerId);
        map.removeSource(layerId);
    }
}

// Store the markers for the POIs so we can remove them later
let poiMarkers = [];

// Custom icons for different types of POIs
const poiIcons = {
    cafe: '<i class="fas fa-coffee"></i>',
    caution: '<i class="fas fa-exclamation-triangle"></i>',
    tourist: '<i class="fas fa-map-marker-alt"></i>'
};

// Function to add a POI marker using FontAwesome icons
function addPOIMarker(poi) {
    const markerElement = document.createElement('div');
    markerElement.className = 'poi-marker';
    markerElement.style.fontSize = '24px';
    markerElement.innerHTML = poiIcons[poi.type] || poiIcons['tourist']; // Default to tourist spot if no type

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
        type: 'tourist' // Default to tourist spot
    },
    {
        coordinates: [144.978, -37.819], // Nearby location
        title: 'Flinders Street Station',
        description: 'One of Melbourne\'s most iconic buildings.',
        type: 'tourist'
    }
];

// Add floating button for adding POIs
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

// Function to enable "POI placement mode"
addPOIButton.addEventListener('click', function() {
    document.body.style.cursor = 'crosshair'; // Change cursor to crosshair
    map.once('click', function(e) {
        document.body.style.cursor = ''; // Reset cursor after click

        // Open modal window for POI info
        openPOIModal(e.lngLat.lng, e.lngLat.lat);
    });
});

// Function to open the POI modal
function openPOIModal(lng, lat) {
    const modal = document.createElement('div');
    modal.className = 'poi-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h3>Create New POI</h3>
            <label>Title: <input type="text" id="poi-title"></label>
            <label>Description: <textarea id="poi-description"></textarea></label>
            <label>Type:
                <select id="poi-type">
                    <option value="cafe">Café</option>
                    <option value="caution">Caution</option>
                    <option value="tourist">Tourist Spot</option>
                </select>
            </label>
            <button id="save-poi">Save POI</button>
        </div>
    `;
    document.body.appendChild(modal);

    // Handle saving the POI
    document.getElementById('save-poi').addEventListener('click', function() {
        const title = document.getElementById('poi-title').value;
        const description = document.getElementById('poi-description').value;
        const type = document.getElementById('poi-type').value;

        // Create new POI object
        const newPOI = {
            coordinates: [lng, lat],
            title: title,
            description: description,
            type: type
        };

        // Add the new POI to the list of POIs
        pois.push(newPOI);

        // Add the new POI marker to the map
        addPOIMarker(newPOI);

        // Close the modal
        document.body.removeChild(modal);
    });
}

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

// Dummy togglePhotoLayer function for now (replace with actual logic)
function togglePhotoLayer() {
    console.log("Photo layer toggle not yet implemented");
}
