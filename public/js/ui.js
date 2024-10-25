
// Initialize popup for segment interaction
const segmentPopup = new mapboxgl.Popup({
    closeButton: false,
    closeOnClick: false
});

// ============================
// SECTION: Segment Interaction (Hover & Click)
// ============================
function setupSegmentInteraction() {
    // Hover interaction for showing segment title
    map.on('mouseenter', 'drawn-segments-layer', (e) => {
        map.getCanvas().style.cursor = 'pointer';

        const title = e.features[0].properties.title;
        if (title) {
            segmentPopup.setLngLat(e.lngLat).setHTML(`<strong>${title}</strong>`).addTo(map);
        }
    });

    // Hide popup and reset cursor on mouse leave
    map.on('mouseleave', 'drawn-segments-layer', () => {
        map.getCanvas().style.cursor = '';
        segmentPopup.remove();
    });

    // Show persistent popup on click
    map.on('click', 'drawn-segments-layer', (e) => {
        const title = e.features[0].properties.title;
        if (title) {
            new mapboxgl.Popup()
                .setLngLat(e.lngLat)
                .setHTML(`<strong>${title}</strong>`)
                .addTo(map);
        }
    });
}

// Function to open the modal for entering the route name
function openRouteNameModal() {
    document.getElementById('routeNameModal').style.display = 'block';  // Show modal
}

// Function to close the modal
function closeRouteNameModal() {
    document.getElementById('routeNameModal').style.display = 'none';  // Hide modal
}


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
