let currentRouteId = null; // Track the route ID globally

// ============================
// SECTION: Open Segment Modal
// ============================
function openSegmentModal(title, routeId) {
    console.log("Opening segment modal with routeId:", routeId); // Check if routeId is valid

    const modal = document.getElementById('segment-modal');
    const segmentDetails = document.getElementById('segment-details');
    const deleteButton = document.getElementById('delete-segment');

    // Confirm that we have the correct elements before proceeding
    if (!modal || !segmentDetails || !deleteButton) {
        console.error("Modal, segment details, or delete button element not found.");
        return;
    }

    // Update the global variable with the current routeId
    currentRouteId = routeId;
    console.log("Set currentRouteId to:", currentRouteId); // Log to verify it's set

    // Update modal content with segment title
    segmentDetails.innerText = `Segment: ${title}`;

    // Show the modal
    modal.classList.add('show');
    modal.style.display = 'block';

    // Ensure the delete button is fully visible and clickable
    deleteButton.style.display = 'inline';
    deleteButton.style.visibility = 'visible';
    deleteButton.style.pointerEvents = 'auto';
}

// ============================
// SECTION: Delete Segment
// ============================
async function deleteSegment() {
    const deleteButton = document.getElementById('delete-segment');
    deleteButton.disabled = true;
    deleteButton.innerHTML = "Deleting..."; // Change button text to indicate progress

    if (!currentRouteId) {
        console.error("No current route ID found for deletion.");
        deleteButton.disabled = false;
        deleteButton.innerHTML = "Delete Segment";
        return;
    }

    if (confirm("Are you sure you want to delete this segment?")) {
        try {
            console.log(`Deleting segment with ID: ${currentRouteId}`);

            // Perform the delete request
            const response = await fetch(`/api/delete-drawn-route?id=${currentRouteId}`, {
                method: 'DELETE',
            });

            // Check if the response is OK (status 200)
            if (!response.ok) {
                console.error(`Failed to delete segment. Status: ${response.status}`);
                console.log(await response.text()); // Log any additional info from the server
                deleteButton.innerHTML = "Delete Segment"; // Reset button text
                return;
            }

            // Parse the response JSON
            const result = await response.json();
            console.log('Delete request result:', result);

            // Check if deletion was successful
            if (result.success) {
                console.log('Segment deleted successfully.');
                closeModal(); // Close modal on successful deletion
                loadSegments(); // Reload segments to refresh the map
            } else {
                console.error('Failed to delete segment:', result.message);
            }
        } catch (error) {
            console.error('Error in deleting segment:', error);
        } finally {
            deleteButton.disabled = false;
            deleteButton.innerHTML = "Delete Segment"; // Restore button text
        }
    } else {
        // Reset button state if deletion is canceled
        deleteButton.disabled = false;
        deleteButton.innerHTML = "Delete Segment";
    }
}

// ============================
// Persistent Delete Button Event Listener
// ============================
document.getElementById('delete-segment').addEventListener('click', () => {
    console.log("Delete button clicked with currentRouteId:", currentRouteId);
    deleteSegment();
});

// ============================
// SECTION: Close Modal
// ============================
function closeModal() {
    console.log('Close button clicked');
    const modal = document.getElementById('segment-modal');
    if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('show');
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

// =========================
// SECTION: Upload Photos
// =========================
async function handlePhotoUpload() {
    const photoFilesInput = document.getElementById('photoFilesInput');
    const files = photoFilesInput.files;

    if (files.length === 0) {
        alert('Please select photos to upload.');
        return;
    }

    const formData = new FormData();
    for (const file of files) {
        formData.append('photoFiles', file);
    }

    try {
        const response = await fetch('/api/upload-photo', {
            method: 'POST',
            body: formData,
        });

        const result = await response.json();

        if (response.ok) {
            console.log('Photos uploaded successfully:', result);
            alert('Photos uploaded successfully.');
            loadPhotoMarkers(); // Reload photo markers to include newly uploaded photos
        } else {
            console.error('Error uploading photos:', result.error);
            alert('Error uploading photos: ' + result.error);
        }
    } catch (error) {
        console.error('Error during upload:', error);
        alert('Error during upload: ' + error.message);
    }
}

// =========================
// SECTION: Save Route Modal 
// =========================
// Define the function to open the route name modal
function openRouteNameModal() {
    const modal = document.getElementById('routeNameModal');
    if (modal) {
        modal.style.display = 'block'; // Make the modal visible
    } else {
        console.error('routeNameModal not found in the DOM.');
    }
}

// Define the function to close the route name modal
function closeRouteNameModal() {
    const modal = document.getElementById('routeNameModal');
    if (modal) {
        modal.style.display = 'none'; // Hide the modal
    } else {
        console.error('routeNameModal not found in the DOM.');
    }
}
