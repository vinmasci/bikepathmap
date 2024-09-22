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

// Track POI placement mode state
let isPOIActive = false;

// Function to toggle GPX layers using toGeoJSON
function toggleGPXLayer(url, layerId) {
    if (layerVisibility[layerId]) {
        removeLayer(layerId);
        layerVisibility[layerId] = false;
    } else {
        fetch(url)
            .then(response => response.text())
            .then(gpxData => {
                const parser = new DOMParser();
                const gpxDoc = parser.parseFromString(gpxData, 'application/xml');

                const geojson = toGeoJSON.gpx(gpxDoc);

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
                        'line-color': '#FF0000',
                        'line-width': 4
                    }
                });

                layerVisibility[layerId] = true;
            })
            .catch(error => console.error('Error loading GPX:', error));
    }
}

// Function to remove layers
function removeLayer(layerId) {
    if (map.getLayer(layerId)) {
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

// Custom icons for different types of POIs
const poiIcons = {
    cafe: '<i class="fas fa-coffee"></i>',
    caution: '<i class="fas fa-exclamation-triangle"></i>',
    tourist: '<i class="fas fa-map-marker-alt"></i>'
};

// Add floating button for adding POIs
const addPOIButton = document.getElementById('add-poi-btn');

// Function to enable "POI placement mode" with toggling and color change
addPOIButton.addEventListener('click', function () {
    isPOIActive = !isPOIActive;
    
    if (isPOIActive) {
        addPOIButton.style.backgroundColor = '#FF5555'; // Lighter red when active
        document.body.style.cursor = 'url("https://img.icons8.com/ios-filled/50/FF0000/plus-math.png"), auto'; // Red cursor
        map.once('click', function (e) {
            document.body.style.cursor = ''; // Reset cursor
            openPOIModal(e.lngLat.lng, e.lngLat.lat);
            isPOIActive = false; // Deactivate after adding POI
            addPOIButton.style.backgroundColor = '#FF0000'; // Reset button color
        });
    } else {
        addPOIButton.style.backgroundColor = '#FF0000'; // Back to original color
        document.body.style.cursor = ''; // Reset cursor
    }
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
            <button id="close-poi-modal">Cancel</button>
        </div>
    `;
    document.body.appendChild(modal);

    document.getElementById('save-poi').addEventListener('click', function () {
        const title = document.getElementById('poi-title').value;
        const description = document.getElementById('poi-description').value;
        const type = document.getElementById('poi-type').value;

        const newPOI = {
            coordinates: [lng, lat],
            title: title,
            description: description,
            type: type
        };

        pois.push(newPOI);
        addPOIMarker(newPOI);
        document.body.removeChild(modal);
    });

    document.getElementById('close-poi-modal').addEventListener('click', function () {
        document.body.removeChild(modal); // Close modal
    });
}

// Function to toggle POI markers
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
