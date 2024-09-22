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

    let layerVisibility = {
        road: false,
        gravel: false,
        photos: false,
    };

    let photoMarkers = [];

    // Functions to toggle layers, add/remove markers
    // (omitted for brevity - no major changes from your original code)

    // Upload photo event listener
    const uploadPhotoButton = document.getElementById('photo-upload-button');
    const photoFileInput = document.getElementById('photo-file');

    if (uploadPhotoButton && photoFileInput) {
        uploadPhotoButton.addEventListener('click', function () {
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
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    return response.json();
                })
                .then(data => {
                    if (data.error) {
                        alert('Error: ' + data.error);
                    } else {
                        alert('Photo uploaded successfully: ' + data.url);
                        // Optionally, add photo marker to the map with data.url
                        closeModal('photo-modal');
                    }
                })
                .catch(error => {
                    console.error('Error uploading photo:', error);
                });
        });
    }
});
