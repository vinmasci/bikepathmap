document.addEventListener("DOMContentLoaded", function () {
    // Initialize the map
    initMap();

    // Initialize modals
    initModals();

    // Add event listeners for the reset, undo and save buttons
    document.getElementById('reset-btn').addEventListener('click', resetRoute);  // Reset button triggers resetRoute
    document.getElementById('undo-btn').addEventListener('click', undoLastPoint); // Undo button triggers undoLastPoint
    document.getElementById('save-btn').addEventListener('click', saveDrawnRoute);  // Add this line

    // Tab and modal interaction
    document.getElementById('segments-tab').addEventListener('click', toggleRoadLayer);
    document.getElementById('photos-tab').addEventListener('click', togglePhotoLayer);
    document.getElementById('add-tab').addEventListener('click', toggleAddDropdown);

    // Open modals for adding GPX files and photos
    document.getElementById('add-road-gpx').addEventListener('click', function() {
        openModal('road-modal');
    });
    document.getElementById('add-photo').addEventListener('click', function() {
        openModal('photo-modal');
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
