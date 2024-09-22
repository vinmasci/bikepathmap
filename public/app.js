// Frontend map logic (Mapbox setup)
mapboxgl.accessToken = 'pk.eyJ1IjoidmlubWFzY2kiLCJhIjoiY20xY3B1ZmdzMHp5eDJwcHBtMmptOG8zOSJ9.Ayn_YEjOCCqujIYhY9PiiA';

const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v11',
    center: [144.9631, -37.8136], // Melbourne center
    zoom: 10
});

// Function to upload photo via form
document.getElementById('upload-photo-button').addEventListener('click', function() {
    const fileInput = document.getElementById('photo-file');
    const formData = new FormData();
    formData.append('photoFile', fileInput.files[0]);

    fetch('/upload-photo', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        console.log('Uploaded image URL:', data.url);
        // Add marker to map using returned image URL
        const marker = new mapboxgl.Marker()
            .setLngLat([144.9631, -37.8136]) // Example coordinates
            .addTo(map);

        const popup = new mapboxgl.Popup({ offset: 25 })
            .setHTML(`<img src="${data.url}" alt="Uploaded photo" width="100">`);

        marker.setPopup(popup);
    })
    .catch(error => console.error('Error uploading photo:', error));
});
