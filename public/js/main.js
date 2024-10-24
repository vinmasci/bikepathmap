

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


