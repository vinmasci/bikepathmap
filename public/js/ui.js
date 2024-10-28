// ============================
// SECTION: Open Segment Modal
// ============================
function openSegmentModal(title, routeId) {
    const modal = document.getElementById('segment-modal');
    const segmentDetails = document.getElementById('segment-details');
    const deleteButton = document.getElementById('delete-segment');

    // Update modal content
    segmentDetails.innerText = `Segment: ${title}`;
    
    // Show modal
    modal.classList.add('show');  // Add the 'show' class to make the modal visible
    modal.style.display = 'block';

    // Attach the click event listener for deleting the segment using the routeId
    deleteButton.onclick = () => {
        console.log("Attempting to delete segment with ID:", routeId); // Log the routeId before deletion
        deleteSegment(routeId);
    };
}


// ============================
// SECTION: Delete Segment
// ============================
async function deleteSegment(routeId) {
    if (confirm("Are you sure you want to delete this segment?")) {
        try {
            console.log(`Deleting segment with ID: ${routeId}`);
            
            const response = await fetch(`/api/delete-drawn-route?id=${routeId}`, {
                method: 'DELETE',
            });

            const result = await response.json();

            if (result.success) {
                console.log('Segment deleted successfully.');
                closeModal();
                loadSegments(); // Reload segments to refresh the map
            } else {
                console.error('Failed to delete segment:', result.message);
            }
        } catch (error) {
            console.error('Error in deleting segment:', error);
        }
    }
}




// ============================
// SECTION: Close Modal
// ============================
function closeModal() {
    console.log('Close button clicked'); // Check if this appears in the console
    const modal = document.getElementById('segment-modal');
    modal.style.display = 'none';
    modal.classList.remove('show');
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
