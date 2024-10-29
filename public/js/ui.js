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

    // Check if the modal is already open to prevent duplicate openings
    if (modal.classList.contains('show')) {
        console.log("Modal is already open, skipping duplicate open.");
        return;
    }

    // Update modal content with segment title
    segmentDetails.innerText = `Segment: ${title}`;

    // Show the modal
    modal.classList.add('show');
    modal.style.display = 'block';

    // Remove any previous event listener from the delete button to prevent duplicates
    deleteButton.onclick = null;

    // Attach the click event listener for deleting the segment with the specific routeId
    deleteButton.onclick = () => {
        console.log("Attempting to delete segment with ID:", routeId); // Log the routeId
        deleteSegment(routeId);  // Call delete function with the routeId
    };
}

// ============================
// SECTION: Delete Segment
// ============================
async function deleteSegment(routeId) {
    // Confirm with the user before proceeding
    if (confirm("Are you sure you want to delete this segment?")) {
        try {
            console.log(`Deleting segment with ID: ${routeId}`);
            
            const response = await fetch(`/api/delete-drawn-route?id=${routeId}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' }
            });

            if (!response.ok) {
                throw new Error(`Server responded with status ${response.status}`);
            }

            const result = await response.json();
            console.log('Delete request result:', result);

            // Check if deletion was successful
            if (result.success) {
                console.log('Segment deleted successfully.');
                closeModal();         // Close the modal
                loadSegments();        // Reload segments to refresh the map
            } else {
                console.error('Failed to delete segment:', result.message);
                alert(`Failed to delete segment: ${result.message}`);
            }
        } catch (error) {
            console.error('Error in deleting segment:', error);
            alert("An error occurred while attempting to delete the segment. Please try again.");
        }
    }
}

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
