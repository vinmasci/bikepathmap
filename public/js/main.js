document.addEventListener("DOMContentLoaded", function () {
    // Initialize the map
    initMap();

    // Initialize modals
    initModals();

    // Tab and modal interaction
    document.getElementById('road-tab').addEventListener('click', toggleRoadLayer);
    document.getElementById('photos-tab').addEventListener('click', togglePhotoLayer);
    document.getElementById('add-tab').addEventListener('click', toggleAddDropdown);

    // Open modals for adding GPX files and photos
    document.getElementById('add-road-gpx').addEventListener('click', function() {
        openModal('road-modal');
    });
    document.getElementById('add-photo').addEventListener('click', function() {
        openModal('photo-modal'); // This will open the photo modal
    });

    // Upload GPX file when 'Upload' button is clicked
    document.getElementById('upload-road-gpx-button').addEventListener('click', function() {
        uploadGPXFile('road-file');
    });

    // Upload photos when 'Upload' button is clicked in photo modal
    document.getElementById('photo-upload-button').addEventListener('click', function() {
        uploadPhoto(); // Call the photo upload function
    });
});
