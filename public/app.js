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

// Function to toggle GPX layers using toGeoJSON
function toggleGPXLayer(url, layerId) {
    if (layerVisibility[layerId]) {
        removeLayer(layerId);
        layerVisibility[layerId] = false;
        document.getElementById(layerId + '-tab').classList.remove('active');
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
                document.getElementById(layerId + '-tab').classList.add('active');
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

// Function to toggle the dropdown when the "Edit" tab is clicked
document.getElementById('edit-tab').addEventListener('click', function () {
    const dropdown = document.getElementById('edit-dropdown');
    dropdown.classList.toggle('show');
    highlightTab('edit-tab');
});

// Handle adding GPX, Photos, POIs
document.getElementById('add-road-gpx').addEventListener('click', function () {
    alert('Add GPX Road file logic here');
    // Logic for uploading GPX road files
});
document.getElementById('add-gravel-gpx').addEventListener('click', function () {
    alert('Add GPX Gravel file logic here');
    // Logic for uploading GPX gravel files
});
document.getElementById('add-photo').addEventListener('click', function () {
    alert('Add Photo logic here');
    // Logic for adding a photo
});
document.getElementById('add-poi').addEventListener('click', function () {
    alert('Add POI logic here');
    // Logic for adding a POI
});

// Highlight active tab function
function highlightTab(tabId) {
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
}
