// ============================
// SECTION: Open Segment Modal
// ============================
function openSegmentModal(segmentId) {
    console.log("Opening segment modal with segmentId:", segmentId);

    const modal = document.getElementById('segment-modal');
    const segmentDetails = document.getElementById('segment-details');
    const deleteButton = document.getElementById('delete-segment');

    if (!modal || !segmentDetails || !deleteButton) {
        console.error("Modal, segment details, or delete button element not found.");
        return;
    }

    // Display the segment title or other details (optional) and store the segmentId in a data attribute
    segmentDetails.innerText = `Segment Details`; // Only display a generic label, no segmentId
    segmentDetails.setAttribute('data-segment-id', segmentId); // Store segmentId as a data attribute

    modal.classList.add('show');
    modal.style.display = 'block';

    // Clear any prior event listeners to avoid duplicate calls
    deleteButton.onclick = null;

    // Set delete function with captured `segmentId`
    deleteButton.onclick = function() {
        deleteSegment(segmentId); // Pass segmentId explicitly
    };
}

// ============================
// SECTION: Delete Segment
// ============================
async function deleteSegment(segmentId) {
    const deleteButton = document.getElementById('delete-segment');
    deleteButton.disabled = true;
    deleteButton.innerHTML = "Deleting...";

    if (!segmentId) {
        console.error("No segment ID found for deletion.");
        deleteButton.disabled = false;
        deleteButton.innerHTML = "Delete Segment";
        return;
    }

    if (confirm("Are you sure you want to delete this segment?")) {
        try {
            console.log(`Deleting segment with ID: ${segmentId}`);
            const response = await fetch(`/api/delete-drawn-route?segmentId=${encodeURIComponent(segmentId)}`, {
                method: 'DELETE',
            });

            const result = await response.json();
            console.log('Delete request result:', result);

            if (result.success) {
                console.log('Segment deleted successfully.');
                closeModal();
                loadSegments(); // Refresh to show the updated segments list
            } else {
                console.error('Failed to delete segment:', result.message);
            }
        } catch (error) {
            console.error('Error in deleting segment:', error);
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
    if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('show');
    }
}

// ============================
// Attach Event Listener to Delete Button (No Inline Onclick)
// ============================
document.getElementById('delete-segment').addEventListener('click', () => {
    // Fetch the actual segmentId stored in the data attribute, not inner text
    const segmentId = document.getElementById('segment-details').getAttribute('data-segment-id');
    deleteSegment(segmentId);
});


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
