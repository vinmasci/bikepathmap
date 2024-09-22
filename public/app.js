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
