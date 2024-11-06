// ============================
// SECTION: Open Segment Modal
// ============================
function openSegmentModal(title, routeId) {
    console.log("Opening segment modal with title:", title, "and routeId:", routeId);

    const modal = document.getElementById('segment-modal');
    const segmentTitle = document.getElementById('segment-details');
    const routeIdElement = document.getElementById('route-id');
    const deleteButton = document.getElementById('delete-segment');

    if (!modal || !segmentTitle || !routeIdElement || !deleteButton) {
        console.error("Modal, segment title, route ID element, or delete button not found.");
        return;
    }

    // Display the segment title and route ID in the modal
    segmentTitle.innerText = title;
    routeIdElement.innerText = `Route ID: ${routeId}`;

    // Show the modal
    modal.classList.add('show');
    modal.style.display = 'block';

    // Clear previous event listeners to avoid duplicate calls
    deleteButton.onclick = null;

    // Assign delete function directly to delete button
    deleteButton.onclick = function() {
        deleteSegment(); // Calls deleteSegment, which retrieves routeId from modal text
    };
}

// ============================
// SECTION: Delete Segment
// ============================
async function deleteSegment() {
    const deleteButton = document.getElementById('delete-segment');

    // Retrieve routeId directly from the displayed text in the modal
    const routeIdElement = document.getElementById('route-id');
    const routeId = routeIdElement ? routeIdElement.innerText.replace('Route ID: ', '') : null;

    if (!routeId) {
        console.error("No route ID found for deletion.");
        return; // Exit early if no route ID
    }

    // Prompt the user for confirmation
    if (!confirm("Are you sure you want to delete this segment?")) {
        return; // Exit if deletion is canceled by the user
    }

    // Set button text to "Deleting..." and disable the button only if deletion is confirmed
    deleteButton.disabled = true;
    deleteButton.innerHTML = "Deleting...";

    try {
        console.log(`Deleting segment with ID: ${routeId}`);
        const response = await fetch(`/api/delete-drawn-route?routeId=${encodeURIComponent(routeId)}`, {
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
        // Reset button state after attempting deletion
        deleteButton.disabled = false;
        deleteButton.innerHTML = "Delete Segment";
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
    // Fetch the segmentId from the delete button's data attribute
    const segmentId = document.getElementById('delete-segment').getAttribute('data-segment-id');
    deleteSegment(segmentId); // Call deleteSegment with segmentId
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
        formData.append('photo', file);
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

// ============================
// SECTION: Drop down panels
// ============================

// Ensure the contribute-dropdown is hidden on page load
document.addEventListener('DOMContentLoaded', function () {
    const dropdown = document.getElementById('contribute-dropdown');
    dropdown.style.display = 'none'; // Ensure hidden on page load
});

// Toggle the dropdown visibility and the active state of the Contribute tab
function toggleContributeDropdown() {
    const dropdown = document.getElementById('contribute-dropdown');
    const contributeTab = document.getElementById('draw-route-tab');

    if (dropdown.style.display === 'none' || dropdown.style.display === '') {
        console.log("Opening dropdown and setting active state");
        dropdown.style.display = 'flex'; // Show the dropdown
        contributeTab.classList.add('active'); // Highlight Contribute tab
        showControlPanel(); // Show Draw Route panel by default
    } else {
        console.log("Closing dropdown");
        dropdown.style.display = 'none'; // Hide the dropdown
        contributeTab.classList.remove('active'); // Remove highlight from Contribute tab
        resetActiveDropdownTabs(); // Reset active state of each dropdown tab button
        hideControlPanel(); // Hide all control panels
    }
}

// Helper function to set active state on the selected dropdown tab
function setActiveDropdownTab(selectedId) {
    console.log("Setting active state for tab:", selectedId);
    resetActiveDropdownTabs(); // Reset all before adding active to selected tab

    const selectedTab = document.getElementById(selectedId);
    if (selectedTab) {
        selectedTab.classList.add('active');
    }
}

// Function to reset active state on all dropdown tabs
function resetActiveDropdownTabs() {
    console.log("Resetting active state for all dropdown tabs");
    document.querySelectorAll('#contribute-dropdown .btn').forEach(tab => tab.classList.remove('active'));
}

// Show control panel for Draw Route and activate the tab
function showControlPanel() {
    document.getElementById('draw-route-control-panel').style.display = 'block';
    document.getElementById('photo-upload-control-panel').style.display = 'none';
    setActiveDropdownTab('draw-route-dropdown');
}

// Show upload photo panel and activate the tab
function showPhotoUploadPanel() {
    document.getElementById('draw-route-control-panel').style.display = 'none';
    document.getElementById('photo-upload-control-panel').style.display = 'block';
    setActiveDropdownTab('photo-upload-dropdown');
}

// Show GPX overlay and activate the tab
function showTempOverlay() {
    alert("GPX Overlay is a placeholder for now.");
    setActiveDropdownTab('gpx-overlay-dropdown');
}

// Hide all control panels when dropdown is closed
function hideControlPanel() {
    document.getElementById('draw-route-control-panel').style.display = 'none';
    document.getElementById('photo-upload-control-panel').style.display = 'none';
}


// =========================
// SECTION: Comments
// =========================

let comments = []; // Temporary storage for comments

// Function to add a comment
function addComment() {
    const commentInput = document.getElementById('comment-input');
    const commentText = commentInput.value.trim();

    if (commentText) {
        // Push new comment to the array and clear the input
        comments.push(commentText);
        commentInput.value = '';

        // Re-render the comments list
        renderComments();
    }
}

// Function to render comments
function renderComments() {
    const commentsList = document.getElementById('comments-list');
    commentsList.innerHTML = ''; // Clear previous comments

    comments.forEach((comment, index) => {
        const commentDiv = document.createElement('div');
        commentDiv.className = 'comment';
        commentDiv.innerText = comment;
        commentsList.appendChild(commentDiv);
    });
}

// Render comments when the modal opens
function openSegmentModal(title, routeId) {
    // Open the modal and set up other details
    const modal = document.getElementById('segment-modal');
    const segmentTitle = document.getElementById('segment-details');
    const routeIdElement = document.getElementById('route-id');

    segmentTitle.innerText = title;
    routeIdElement.innerText = `Route ID: ${routeId}`;
    
    modal.classList.add('show');
    modal.style.display = 'block';

    // Render comments for the segment
    renderComments();
}

// ============================
// SECTION: User Login Status
// ============================
document.addEventListener('DOMContentLoaded', async () => {
    const userStatus = document.getElementById('user-status');
    const userInfo = document.getElementById('user-info');
    const logoutButton = document.getElementById('logout-button');
    const loginButton = document.getElementById('login-button');

    // Check for token in localStorage and fetch user data if available
    const token = localStorage.getItem('token');
    console.log("Current token:", token); // Log the token to see if it exists

    if (token) {
        console.log("User is logged in, fetching user data..."); // Log that user is logged in
        await fetchUserData(token, userStatus, userInfo, logoutButton, loginButton); // Fetch user data with the token
    } else {
        // User is not logged in
        userStatus.style.display = 'flex';  // Ensure the user status display is visible
        userInfo.textContent = ''; // Clear user info if not logged in
        logoutButton.style.display = 'none'; // Hide logout button if not logged in
        loginButton.style.display = 'block'; // Show login button if not logged in
        console.log("User is not logged in, showing login button."); // Log that the user is not logged in
    }

    // Logout button handler
    logoutButton.addEventListener('click', async () => {
        console.log("Logging out..."); // Log when logout button is clicked
        localStorage.removeItem('token');  // Clear the token from localStorage
        userInfo.textContent = ''; // Clear user info
        logoutButton.style.display = 'none'; // Hide logout button
        loginButton.style.display = 'block'; // Show login button
        console.log("User logged out, login button will remain visible."); // Log logout event

        // Redirect to Google's logout endpoint
        const logoutUrl = `https://accounts.google.com/Logout`;
        window.location.href = logoutUrl; // Redirect to log out of Google
    });

    // Login button handler
    loginButton.addEventListener('click', () => {
        console.log("Redirecting to login..."); // Log when login button is clicked
        window.location.href = '/api/auth/login'; // Redirect to your login endpoint
    });
});

// ============================
// SECTION: Fetch User Data with Token
// ============================
async function fetchUserData(token, userStatus, userInfo, logoutButton, loginButton) {
    try {
        const response = await fetch('/api/auth/user', {
            headers: { 'Authorization': `Bearer ${token}` },  // Include the token here
        });

        if (!response.ok) {
            throw new Error(`Error: ${response.statusText}`);
        }

        const data = await response.json();

        if (data.user) {
            // Get user's initials (first two initials)
            const names = data.user.displayName.split(' ').map(name => name.charAt(0)).slice(0, 2).join('').toUpperCase();

            // Create a circle element for initials
            const initialsCircle = document.createElement('div');
            initialsCircle.textContent = names;
            initialsCircle.style.width = '40px'; // Circle size
            initialsCircle.style.height = '40px'; // Circle size
            initialsCircle.style.borderRadius = '50%'; // Makes it circular
            initialsCircle.style.backgroundColor = '#007bff'; // Background color (adjust as needed)
            initialsCircle.style.color = 'white'; // Text color
            initialsCircle.style.display = 'flex';
            initialsCircle.style.alignItems = 'center';
            initialsCircle.style.justifyContent = 'center';
            initialsCircle.style.fontSize = '16px'; // Adjust font size
            initialsCircle.style.marginRight = '10px'; // Space between initials and logout button
            
            // Clear previous content and append the circle
            userInfo.innerHTML = ''; // Clear previous user info
            userInfo.appendChild(initialsCircle); // Add initials circle to user info

// Add event listener for the initials circle
initialsCircle.addEventListener('click', (event) => {
    const modal = document.getElementById('profile-info-modal');
    
    // Get the bounding rectangle of the initials circle
    const rect = initialsCircle.getBoundingClientRect();
    
    // Set the modal position
    modal.style.position = 'absolute';
    modal.style.top = `${rect.bottom + window.scrollY}px`; // Position below the circle
    modal.style.left = `${rect.left}px`; // Align with the left edge of the circle
    modal.style.display = 'block'; // Show the modal
});

            userStatus.style.display = 'flex'; // Show user status
            logoutButton.style.display = 'block'; // Show logout button when logged in
            loginButton.style.display = 'none'; // Hide login button when logged in
            console.log("User data fetched successfully:", data.user);
        } else {
            // Handle the case where there is no user data
            userStatus.style.display = 'flex';
            userInfo.textContent = ''; 
            logoutButton.style.display = 'none'; 
            loginButton.style.display = 'block';
            console.log("No user data found, showing login button.");
        }
    } catch (error) {
        console.error('Error fetching user data:', error);
        userStatus.style.display = 'flex'; 
        userInfo.textContent = ''; 
        logoutButton.style.display = 'none'; 
        loginButton.style.display = 'block'; 
    }
}

// Save profile information
document.getElementById('save-profile-info').addEventListener('click', async () => {
    const userName = document.getElementById('user-name').value;
    const userEmail = document.getElementById('user-email').value;
    const profileImage = document.getElementById('profile-image').files[0];

    const formData = new FormData();
    formData.append('name', userName);
    formData.append('email', userEmail);
    if (profileImage) {
        formData.append('image', profileImage); // Add image file if exists
    }

    // Send this data to your backend
    const response = await fetch('/api/user/profile', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}` // Send the token if necessary
        },
        body: formData // Sending FormData to include file uploads
    });

    if (response.ok) {
        console.log('Profile information saved successfully');
        document.getElementById('profile-info-modal').style.display = 'none'; // Close modal
    } else {
        console.error('Error saving profile information');
    }
});

// Close modal functionality
document.getElementById('close-modal').addEventListener('click', () => {
    document.getElementById('profile-info-modal').style.display = 'none'; // Close modal
});


// ============================
// SECTION: Capture Token and Store in localStorage
// ============================
document.addEventListener('DOMContentLoaded', () => {
    // Capture the token from the URL if it exists
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    if (token) {
        // Store the token in localStorage
        localStorage.setItem('token', token);

        // Remove the token from the URL for a cleaner experience
        window.history.replaceState({}, document.title, "/");
        
        // Fetch user data immediately after storing the token
        fetchUserData(token, userStatus, userInfo, logoutButton, loginButton);
    }
});

