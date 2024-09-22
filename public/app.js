document.addEventListener("DOMContentLoaded", function () {
    // Ensure Mapbox is set up
    mapboxgl.accessToken = 'pk.eyJ1IjoidmlubWFzY2kiLCJhIjoiY20xY3B1ZmdzMHp5eDJwcHBtMmptOG8zOSJ9.Ayn_YEjOCCqujIYhY9PiiA'; // Replace with your actual Mapbox token

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

    // Functions to handle layer toggling
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

    function togglePhotoLayer() {
        // Implement your logic to toggle the photo layer
        console.log('Toggling photos');
    }

    function togglePOILayer() {
        // Implement your logic to toggle POIs
        console.log('Toggling POIs');
    }

    function removeLayer(layerId) {
        if (map.getLayer(layerId)) {
            map.removeLayer(layerId);
            map.removeSource(layerId);
        }
    }

    // Handle the tabs functionality
    document.getElementById('road-tab').addEventListener('click', function () {
        toggleGPXLayer(roadGPX, 'road');
    });

    document.getElementById('gravel-tab').addEventListener('click', function () {
        toggleGPXLayer(gravelGPX, 'gravel');
    });

    document.getElementById('photos-tab').addEventListener('click', function () {
        togglePhotoLayer();
    });

    document.getElementById('pois-tab').addEventListener('click', function () {
        togglePOILayer();
    });

    // Make sure the "upload-photo-button" exists before adding the event listener
    const uploadPhotoButton = document.getElementById('upload-photo-button');
    if (uploadPhotoButton) {
        uploadPhotoButton.addEventListener('click', function () {
            openAddModal('photo-modal');
        });
    }
});
