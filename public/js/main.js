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

    // Upload photos when 'Upload' button is clicked in the photo modal
    document.getElementById('photo-upload-button').addEventListener('click', function() {
        uploadPhoto(); // Call the photo upload function
    });

    // Draw route functionality for "Draw Route" tab!
    let drawingEnabled = false;
    document.getElementById('draw-route-tab').addEventListener('click', function() {
        drawingEnabled = !drawingEnabled;
        if (drawingEnabled) {
            enableDrawingMode();  // Enable drawing mode from map.js
            updateTabHighlight('draw-route-tab', true);  // Highlight the active tab
        } else {
            disableDrawingMode(); // Disable drawing mode and save the route
            updateTabHighlight('draw-route-tab', false); // Remove highlight
        }
    });
});
