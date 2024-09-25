// /public/js/main.js

document.addEventListener("DOMContentLoaded", function () {
    // Initialize the map
    initMap();

    // Initialize modals
    initModals();

    // Tab and modal interaction
    document.getElementById('road-tab').addEventListener('click', toggleRoadLayer);
    document.getElementById('photos-tab').addEventListener('click', togglePhotoLayer);
    document.getElementById('add-tab').addEventListener('click', toggleAddDropdown);
    document.getElementById('add-road-gpx').addEventListener('click', function() {
        openModal('road-modal');
    });
    document.getElementById('photo-upload-button').addEventListener('click', function() {
        uploadGPXFile('road-file');
    });
});
