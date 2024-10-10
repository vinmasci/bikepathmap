// ============================
// SECTION: Open Route Modal
// ============================
function openSegmentModal(segmentId) {
    const segmentDetails = document.getElementById('segment-details');
    segmentDetails.textContent = `Segment ID: ${segmentId}`;

    // Show the modal
    document.getElementById('segment-modal').style.display = 'block';

    const deleteButton = document.getElementById('delete-segment');
    deleteButton.onclick = () => deleteSegment(segmentId); // Pass the segment ID to delete
}

// ============================
// SECTION: Close Modal
// ============================
function closeModal() {
    document.getElementById('segment-modal').style.display = 'none';
}

// Close the modal when clicking outside of it
window.onclick = function(event) {
    const modal = document.getElementById('segment-modal');
    if (event.target === modal) {
        closeModal();
    }
};

// ============================
// SECTION: TOOGLE DRAWING MODE
// ============================
function toggleDrawingMode() {
    drawingEnabled = !drawingEnabled;
    if (drawingEnabled) {
        enableDrawingMode();
        document.getElementById('control-panel').style.display = 'block'; // Show control panel
        updateTabHighlight('draw-route-tab', true);
        map.getCanvas().style.cursor = 'crosshair'; // Set crosshair cursor when drawing is enabled
    } else {
        disableDrawingMode(false); // Disable drawing mode without saving
        document.getElementById('control-panel').style.display = 'none'; // Hide control panel
        updateTabHighlight('draw-route-tab', false);
        map.getCanvas().style.cursor = ''; // Reset cursor to default when drawing is disabled
    }
}

// ============================
// SECTION: Tab Highlighting
// ============================
function updateTabHighlight(tabId, isActive) {
    const tab = document.getElementById(tabId);
    if (isActive) {
        tab.classList.add('active');
    } else {
        tab.classList.remove('active');
    }
}

// =========================
// SECTION: Dropdown Toggles
// =========================
function toggleAddDropdown() {
    const dropdown = document.getElementById('add-dropdown');
    dropdown.classList.toggle('show');
}