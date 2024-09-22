// Mapbox initialization
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

let layerVisibility = {
    road: false,
    gravel: false,
    photos: false,
    pois: false
};

// Function to remove layers
function removeLayer(layerId) {
    if (map.getLayer(layerId)) {
        map.removeLayer(layerId);
        map.removeSource(layerId);
    }
}

// GPX Layer Toggle
function toggleGPXLayer(url, layerId) {
    if (layerVisibility[layerId]) {
        removeLayer(layerId);
        layerVisibility[layerId] = false;
        updateTabHighlight(layerId + '-tab', false);
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
                updateTabHighlight(layerId + '-tab', true);
            })
            .catch(error => console.error('Error loading GPX:', error));
    }
}

// Function to update tab highlights based on the layer visibility
function updateTabHighlight(tabId, isActive) {
    const tabElement = document.getElementById(tabId);
    if (isActive) {
        tabElement.classList.add('active');
    } else {
        tabElement.classList.remove('active');
    }
}

// Modal creation and handling
function createModal(content) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            ${content}
            <button id="close-modal">Close</button>
        </div>
    `;
    document.body.appendChild(modal);

    document.getElementById('close-modal').addEventListener('click', function () {
        document.body.removeChild(modal);
    });
}

// Functions for handling each modal
function openAddRoadGPXModal() {
    const content = `
        <h3>Add GPX Road File</h3>
        <input type="file" id="road-gpx-input" accept=".gpx">
        <button id="upload-road-gpx">Upload</button>
    `;
    createModal(content);
}

function openAddGravelGPXModal() {
    const content = `
        <h3>Add GPX Gravel File</h3>
        <input type="file" id="gravel-gpx-input" accept=".gpx">
        <button id="upload-gravel-gpx">Upload</button>
    `;
    createModal(content);
}

function openAddPhotoModal() {
    const content = `
        <h3>Add Photo</h3>
        <label for="photo-coordinates">Coordinates (Lng, Lat):</label>
        <input type="text" id="photo-coordinates" placeholder="e.g., 144.9631,-37.8136">
        <input type="file" id="photo-input" accept="image/*">
        <button id="upload-photo">Upload</button>
    `;
    createModal(content);
}

function openAddPOIModal() {
    const content = `
        <h3>Add POI</h3>
        <label for="poi-coordinates">Coordinates (Lng, Lat):</label>
        <input type="text" id="poi-coordinates" placeholder="e.g., 144.9631,-37.8136">
        <input type="text" id="poi-title" placeholder="POI Title">
        <textarea id="poi-description" placeholder="POI Description"></textarea>
        <button id="save-poi">Save POI</button>
    `;
    createModal(content);
}

// Add tab dropdown event listeners
document.getElementById('add-road-gpx').addEventListener('click', openAddRoadGPXModal);
document.getElementById('add-gravel-gpx').addEventListener('click', openAddGravelGPXModal);
document.getElementById('add-photo').addEventListener('click', openAddPhotoModal);
document.getElementById('add-poi').addEventListener('click', openAddPOIModal);

// Tab Switch Event Listeners for Layers
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

// Function to highlight active tabs
function highlightTab(tabId) {
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
}
