let currentRouteId = null; // Track the route ID globally

// ============================
// SECTION: Open Segment Modal
// ============================
function openSegmentModal(title, routeId) {
    console.log("Opening segment modal with routeId:", routeId); // Confirm routeId is passed

    const modal = document.getElementById('segment-modal');
    const segmentDetails = document.getElementById('segment-details');
    const deleteButton = document.getElementById('delete-segment');

    // Check that the modal, details, and delete button elements exist
    if (!modal || !segmentDetails || !deleteButton) {
        console.error("Modal, segment details, or delete button element not found.");
        return;
    }

    // Set currentRouteId globally and confirm in the log
    currentRouteId = routeId;
    console.log("currentRouteId set to:", currentRouteId);

    // Update modal content and display it
    segmentDetails.innerText = `Segment: ${title}`;
    modal.classList.add('show');
    modal.style.display = 'block';

    // Ensure delete button is active and visible
    deleteButton.style.display = 'inline';
    deleteButton.style.visibility = 'visible';
    deleteButton.style.pointerEvents = 'auto';

    // Reset any previous event listener and set a new one for deletion
    deleteButton.onclick = () => deleteSegment();
}

// ============================
// SECTION: Delete Segment
// ============================
async function deleteSegment() {
    const deleteButton = document.getElementById('delete-segment');

    if (!currentRouteId) {
        console.error("No current route ID found for deletion."); // Log if no route ID is available
        deleteButton.disabled = false;
        deleteButton.innerHTML = "Delete Segment";
        return;
    }

    if (confirm("Are you sure you want to delete this segment?")) {
        deleteButton.disabled = true;
        deleteButton.innerHTML = "Deleting...";

        try {
            console.log(`Attempting to delete segment with ID: ${currentRouteId}`);
            const response = await fetch(`/api/delete-drawn-route?id=${currentRouteId}`, {
                method: 'DELETE',
            });

            const result = await response.json();
            console.log('Delete request result:', result);

            if (result.success) {
                console.log('Segment deleted successfully.');
                closeModal();
                loadSegments();
            } else {
                console.error('Failed to delete segment:', result.message);
            }
        } catch (error) {
            console.error('Error during deletion:', error);
        } finally {
            deleteButton.disabled = false;
            deleteButton.innerHTML = "Delete Segment";
        }
    }
}

// ============================
// SECTION: Close Modal
// ============================
function closeModal() {
    console.log('Closing modal.');
    const modal = document.getElementById('segment-modal');
    modal.style.display = 'none';
    modal.classList.remove('show');
}

// ============================
// Ensure Persistent Delete Button Event Listener for Safety
// ============================
document.getElementById('delete-segment').addEventListener('click', deleteSegment);


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
