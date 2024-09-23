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
        try {
            const response = await fetch('/api/get-photos');
            const photos = await response.json();

            photos.forEach(photo => {
                if (photo.latitude && photo.longitude) {
                    const marker = new mapboxgl.Marker()
                        .setLngLat([photo.longitude, photo.latitude])
                        .addTo(map);

                    const popup = new mapboxgl.Popup({ offset: 25 })
                        .setHTML(`<h3>${photo.originalName}</h3><img src="${photo.url}" style="width:200px;">`);

                    marker.setPopup(popup);
                    photoMarkers.push(marker);
                }
            });
        } catch (error) {
            console.error('Error loading photo markers:', error);
        }
    }

    function removePhotoMarkers() {
        photoMarkers.forEach(marker => marker.remove());
        photoMarkers = [];
    }

    function togglePhotoLayer() {
        if (layerVisibility.photos) {
            removePhotoMarkers();
            layerVisibility.photos = false;
        } else {
            loadPhotoMarkers();
            layerVisibility.photos = true;
        }
    }

    // Add Tab functionality: toggle dropdown
    document.getElementById('add-tab').addEventListener('click', function () {
        const dropdown = document.getElementById('add-dropdown');
        dropdown.classList.toggle('show'); // Toggles the display of dropdown
    });

    // Modal functionality for photo upload
    document.getElementById('add-photo').addEventListener('click', function() {
        const photoModal = document.getElementById('photo-modal');
        if (photoModal) {
            photoModal.style.display = 'block';
        }
    });

    // Close modal functionality
    const closeButtons = document.querySelectorAll('.close');
    closeButtons.forEach(button => {
        button.addEventListener('click', function () {
            const modalId = button.parentElement.parentElement.id;
            document.getElementById(modalId).style.display = 'none';
        });
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

                    // Close the photo modal
                    document.getElementById('photo-modal').style.display = 'none';

                    // Add uploaded photo to the map dynamically
                    const newPhotoMarker = new mapboxgl.Marker()
                        .setLngLat([data.longitude, data.latitude])
                        .addTo(map);

                    const newPopup = new mapboxgl.Popup({ offset: 25 })
                        .setHTML(`<h3>${data.originalName}</h3><img src="${data.url}" style="width:200px;">`);

                    newPhotoMarker.setPopup(newPopup);
                    photoMarkers.push(newPhotoMarker);
                }
            })
            .catch(error => {
                console.error('Error uploading photo:', error);
            });
        });
    }

    // Add event listener for the "photos-tab" to toggle the photo markers on the map
    document.getElementById('photos-tab').addEventListener('click', togglePhotoLayer);
});
