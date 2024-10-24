

    // Initialize modals
    initModals(); // Ensure this function is defined in ui.js

    // Add event listeners for the reset, undo, and save buttons
    document.getElementById('reset-btn').addEventListener('click', resetRoute);  // Reset button triggers resetRoute
    document.getElementById('undo-btn').addEventListener('click', undoLastSegment); // Undo button triggers undoLastPoint
    document.getElementById('save-btn').addEventListener('click', saveDrawnRoute);  // Save button triggers saveDrawnRoute



    // Open modals for adding GPX files and photos
    document.getElementById('add-road-gpx').addEventListener('click', function() {
        openModal('road-modal'); // Ensure openModal function is defined in ui.js
    });
    document.getElementById('add-photo').addEventListener('click', function() {
        openModal('photo-modal'); // Ensure openModal function is defined in ui.js
    });

    // Draw route functionality for "Draw Route" tab
    let drawingEnabled = false;
    document.getElementById('draw-route-tab').addEventListener('click', function() {
        drawingEnabled = !drawingEnabled;
        if (drawingEnabled) {
            enableDrawingMode();  // Function should be defined in map.js
            updateTabHighlight('draw-route-tab', true);  // Highlight the active tab
        } else {
            disableDrawingMode(); // Function should be defined in map.js
            updateTabHighlight('draw-route-tab', false); // Remove highlight
        }
    });
});
