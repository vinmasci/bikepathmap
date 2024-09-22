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

    let photoMarkers = [];
    let poiMarkers = [];

    function updateTabHighlight(tabId, isActive) {
        const tab = document.getElementById(tabId);
        if (isActive) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    }

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
            photoMarkers.push(marker);  
        });
    }

    function removePhotoMarkers() {
        photoMarkers.forEach(marker => marker.remove());  
        photoMarkers = [];  
    }

    function togglePhotoLayer() {
        if (layerVisibility.photos) {
            removePhotoMarkers();
            layerVisibility.photos = false;
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
            poiMarkers.push(marker);  
        });
    }

    function removePOIMarkers() {
        poiMarkers.forEach(marker => marker.remove());  
        poiMarkers = [];  
    }

    function togglePOILayer() {
        if (layerVisibility.pois) {
            removePOIMarkers();
            layerVisibility.pois = false;
            updateTabHighlight('pois-tab', false);
        } else {
            loadPOIMarkers();
            layerVisibility.pois = true;
            updateTabHighlight('pois-tab', true);
        }
    }

    function removeLayer(layerId) {
        if (map.getLayer(layerId)) {
            map.removeLayer(layerId);
            map.removeSource(layerId);
        }
    }

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

    document.getElementById('add-tab').addEventListener('click', function () {
        const dropdown = document.getElementById('add-dropdown');
        dropdown.classList.toggle('show');
        updateTabHighlight('add-tab', dropdown.classList.contains('show'));
    });

    function openAddModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = "block";
        }
    }

    function closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = "none";
        }
    }

    document.getElementById('add-road-gpx').addEventListener('click', function() {
        openAddModal('road-modal');
    });
    document.getElementById('add-gravel-gpx').addEventListener('click', function() {
        openAddModal('gravel-modal');
    });
    document.getElementById('add-photo').addEventListener('click', function() {
        openAddModal('photo-modal');
    });
    document.getElementById('add-poi').addEventListener('click', function() {
        openAddModal('poi-modal');
    });

    const closeButtons = document.querySelectorAll('.close');
    closeButtons.forEach(button => {
        button.addEventListener('click', function () {
            const modalId = button.parentElement.parentElement.id;
            closeModal(modalId);
        });
    });

    window.onclick = function(event) {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            if (event.target === modal) {
                modal.style.display = "none";
            }
        });
    };

    // Upload photo event listener
    const uploadPhotoButton = document.getElementById('photo-upload-button');
    const photoFileInput = document.getElementById('photo-file');

    if (uploadPhotoButton && photoFileInput) {
        uploadPhotoButton.addEventListener('click', function() {
            const file = photoFileInput.files[0];
            if (!file) {
                alert('Please select a photo to upload');
                return;
            }

            const formData = new FormData();
            formData.append('photoFile', file);

            fetch('/upload-photo', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    alert('Error: ' + data.error);
                } else {
                    alert('Photo uploaded successfully: ' + data.url);
                    closeModal('photo-modal');
                    // Optionally, add the uploaded photo to the map
                }
            })
            .catch(error => {
                console.error('Error uploading photo:', error);
            });
        });
    }
});
