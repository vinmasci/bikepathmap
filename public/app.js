document.addEventListener("DOMContentLoaded", function () {
    mapboxgl.accessToken = 'pk.eyJ1IjoidmlubWFzY2kiLCJhIjoiY20xY3B1ZmdzMHp5eDJwcHBtMmptOG8zOSJ9.Ayn_YEjOCCqujIYhY9PiiA'; 

    const map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/streets-v11',
        center: [144.9631, -37.8136], 
        zoom: 10
    });

    const roadGPX = '/GPX/Road/Capital_City_Trail.gpx';
    const gravelGPX = '/GPX/Gravel/Dandenong_Creek_Trail_.gpx';
    const photos = [
        { coordinates: [144.9631, -37.8136], title: 'Photo 1', imageUrl: '/photos/photo1.jpeg' },
        { coordinates: [144.9781, -37.8196], title: 'Photo 2', imageUrl: '/photos/photo2.jpeg' }
    ];
    const pois = [
        { coordinates: [144.9631, -37.814], title: 'Federation Square', description: 'Cultural precinct in Melbourne.' },
        { coordinates: [144.978, -37.819], title: 'Flinders Street Station', description: 'Melbourne’s iconic building.' }
    ];

    let layerVisibility = {
        road: false,
        gravel: false,
        photos: false,
        pois: false
    };

    // Helper function to highlight tabs
    function updateTabHighlight(tabId, isActive) {
        const tab = document.getElementById(tabId);
        if (isActive) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    }

    // Functions to load/remove layers (GPX, Photos, POIs)
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

    function loadPhotoMarkers() {
        photos.forEach(photo => {
            const marker = new mapboxgl.Marker()
                .setLngLat(photo.coordinates)
                .addTo(map);

            const popup = new mapboxgl.Popup({ offset: 25 })
                .setHTML(`<h3>${photo.title}</h3><img src="${photo.imageUrl}" style="width:200px;">`);

            marker.setPopup(popup);
        });
    }

    function togglePhotoLayer() {
        if (layerVisibility.photos) {
            layerVisibility.photos = false;
            removeLayer('photos');
            updateTabHighlight('photos-tab', false);
        } else {
            loadPhotoMarkers();
            layerVisibility.photos = true;
            updateTabHighlight('photos-tab', true);
        }
    }

    function loadPOIMarkers() {
        pois.forEach(poi => {
            const marker = new mapboxgl.Marker()
                .setLngLat(poi.coordinates)
                .addTo(map);

            const popup = new mapboxgl.Popup({ offset: 25 })
                .setHTML(`<h3>${poi.title}</h3><p>${poi.description}</p>`);

            marker.setPopup(popup);
        });
    }

    function togglePOILayer() {
        if (layerVisibility.pois) {
            layerVisibility.pois = false;
            removeLayer('pois');
            updateTabHighlight('pois-tab', false);
        } else {
            loadPOIMarkers();
            layerVisibility.pois = true;
            updateTabHighlight('pois-tab', true);
        }
    }

    // Remove layers
    function removeLayer(layerId) {
        if (map.getLayer(layerId)) {
            map.removeLayer(layerId);
            map.removeSource(layerId);
        }
    }

    // Tab Switch Event Listeners
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

    // Dropdown toggle for the "Add" tab
    document.getElementById('add-tab').addEventListener('click', function () {
        const dropdown = document.getElementById('add-dropdown');
        dropdown.classList.toggle('show');
        updateTabHighlight('add-tab', dropdown.classList.contains('show'));
    });
});
