document.addEventListener("DOMContentLoaded", function () {
    mapboxgl.accessToken = 'pk.eyJ1IjoidmlubWFzY2kiLCJhIjoiY20xY3B1ZmdzMHp5eDJwcHBtMmptOG8zOSJ9.Ayn_YEjOCCqujIYhY9PiiA';  // Use your actual Mapbox token

    const map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/streets-v11',
        center: [144.9631, -37.8136],
        zoom: 10
    });

    const roadGPX = '/GPX/Road/Capital_City_Trail.gpx';
    const gravelGPX = '/GPX/Gravel/Dandenong_Creek_Trail_.gpx';

    let layerVisibility = {
        road: false,
        gravel: false,
        photos: false,
        pois: false
    };

    let photoMarkers = [];
    let poiMarkers = [];

    // Function to fetch and load photo markers from MongoDB
    async function loadPhotoMarkers() {
        const response = await fetch('/api/get-photos');
        const photos = await response.json();

        photos.forEach(photo => {
            const marker = new mapboxgl.Marker()
                .setLngLat([photo.longitude, photo.latitude])
                .addTo(map);

            const popup = new mapboxgl.Popup({ offset: 25 })
                .setHTML(`<h3>${photo.originalName}</h3><img src="${photo.url}" style="width:200px;">`);

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

    // Other functions and layers (GPX, POIs)

    function updateTabHighlight(tabId, isActive) {
        const tab = document.getElementById(tabId);
        if (isActive) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
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

            fetch('/api/upload-photo', {
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

                    // Adding the uploaded photo as a marker on the map dynamically
                    const photoCoordinates = [data.longitude, data.latitude];

                    const newPhotoMarker = new mapboxgl.Marker()
                        .setLngLat(photoCoordinates)
                        .addTo(map);

                    const newPopup = new mapboxgl.Popup({ offset: 25 })
                        .setHTML(`<h3>New Photo</h3><img src="${data.url}" style="width:200px;">`);

                    newPhotoMarker.setPopup(newPopup);
                    photoMarkers.push(newPhotoMarker);
                }
            })
            .catch(error => {
                console.error('Error uploading photo:', error);
            });
        });
    }
});
