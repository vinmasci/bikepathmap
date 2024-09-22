document.addEventListener("DOMContentLoaded", function () {
    // Set the Mapbox access token
    mapboxgl.accessToken = 'pk.eyJ1IjoidmlubWFzY2kiLCJhIjoiY20xY3B1ZmdzMHp5eDJwcHBtMmptOG8zOSJ9.Ayn_YEjOCCqujIYhY9PiiA';

    // Initialize the map
    const map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/streets-v11',
        center: [144.9631, -37.8136], // Center on Melbourne
        zoom: 10
    });

    // GPX URLs
    const roadGPX = '/GPX/Road/Capital_City_Trail.gpx';
    const gravelGPX = '/GPX/Gravel/Dandenong_Creek_Trail_.gpx';

    // Placeholder for photos and POIs
    const photos = [];
    const pois = [];

    // Track visibility of layers
    let layerVisibility = {
        road: false,
        gravel: false,
        photos: false,
        pois: false
    };

    // Track photo and POI markers
    let photoMarkers = [];
    let poiMarkers = [];

    // Helper function to highlight tabs
    function updateTabHighlight(tabId, isActive) {
        const tab = document.getElementById(tabId);
        if (isActive) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    }

    // GPX Layer Toggle Function
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

    // Load and Remove Photo Markers
    function loadPhotoMarkers() {
        photos.forEach(photo => {
            const marker = new mapboxgl.Marker()
                .setLngLat(photo.coordinates)
                .addTo(map);

            const popup = new mapboxgl.Popup({ offset: 25 })
                .setHTML(`<h3>${photo.title}</h3><img src="${photo.imageUrl}" style="width:200px;">`);

            marker.setPopup(popup);
            photoMarkers.push(marker);  // Track the new marker
        });
    }

    function removePhotoMarkers() {
        photoMarkers.forEach(marker => marker.remove());  // Remove all photo markers
        photoMarkers = [];  // Clear the array
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

    // Load and Remove POI Markers
    function loadPOIMarkers() {
        pois.forEach(poi => {
            const marker = new mapboxgl.Marker()
                .setLngLat(poi.coordinates)
                .addTo(map);

            const popup = new mapboxgl.Popup({ offset: 25 })
                .setHTML(`<h3>${poi.title}</h3><p>${poi.description}</p>`);

            marker.setPopup(popup);
            poiMarkers.push(marker);  // Track the new marker
        });
    }

    function removePOIMarkers() {
        poiMarkers.forEach(marker => marker.remove());  // Remove all POI markers
        poiMarkers = [];  // Clear the array
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

    // Remove layers from the map
    function removeLayer(layerId) {
        if (map.getLayer(layerId)) {
            map.removeLayer(layerId);
            map.removeSource(layerId);
        }
    }

    // Event Listeners for Tabs
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

    // Modal Logic for Add Tab Buttons
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

    // Event listeners for dropdown buttons to open modals
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

    // Close modals when clicking the close button (X)
    const closeButtons = document.querySelectorAll('.close');
    closeButtons.forEach(button => {
        button.addEventListener('click', function () {
            const modalId = button.parentElement.parentElement.id;
            closeModal(modalId);
        });
    });

    // Close modals if the user clicks outside of the modal content
    window.onclick = function(event) {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            if (event.target === modal) {
                modal.style.display = "none";
            }
        });
    };

    // Photo Upload Logic
    function uploadPhotoFile() {
        const fileInput = document.getElementById('photo-file');
        const formData = new FormData();
        formData.append('photoFile', fileInput.files[0]);

        fetch('/upload-photo', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                alert('Upload failed: ' + data.error);
            } else {
                alert('Photo uploaded successfully!');

                // Add the uploaded photo as a marker on the map
                const coordinates = [144.9631, -37.8136]; // Example coordinates, could be dynamic later
                const marker = new mapboxgl.Marker()
                    .setLngLat(coordinates)
                    .addTo(map);

                const popup = new mapboxgl.Popup({ offset: 25 })
                    .setHTML(`<h3>New Photo</h3><img src="${data.url}" style="width:200px;">`);

                marker.setPopup(popup);
                photos.push(marker);  // Track the new marker
            }
        })
        .catch(error => console.error('Error uploading photo:', error));
    }

    // Add event listener for the "Upload" button in the photo modal
    document.getElementById('photo-upload-button').addEventListener('click', uploadPhotoFile);
});
