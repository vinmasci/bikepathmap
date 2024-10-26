// Function to open the modal for entering the route name
function openRouteNameModal() {
    document.getElementById('routeNameModal').style.display = 'block';  // Show modal
}

// Function to close the modal
function closeRouteNameModal() {
    document.getElementById('routeNameModal').style.display = 'none';  // Hide modal
}


// ============================
// SECTION: Open Segment Modal
// ============================
function openSegmentModal(title, routeId) {
    if (!routeId) {
        console.error('routeId is undefined when opening modal.');
        return;
    }
    const modal = document.getElementById('segment-modal');
    const segmentDetails = document.getElementById('segment-details');
    const deleteButton = document.getElementById('delete-segment');

    // Update modal content
    segmentDetails.innerText = `Segment: ${title}`;
    
    // Show modal
    modal.style.display = 'block';

    // Attach the click event listener for deleting the segment
    deleteButton.onclick = () => {
        console.log("Attempting to delete segment with ID:", routeId); // Log the segment ID before deletion
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
    const modal = document.getElementById('segment-modal');
    modal.style.display = 'none';
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
