// ============================
// SECTION: Open Segment Modal
// ============================
function openSegmentModal(title, routeId) {
    console.log("Opening segment modal with routeId:", routeId); // Check if routeId is valid
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

            console.log('Delete request response:', response);
            const result = await response.json();
            console.log('Delete request result:', result);

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
