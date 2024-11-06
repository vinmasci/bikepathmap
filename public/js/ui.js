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
        console.log("User is logged in, fetching user data...");
        await fetchUserData(token, userStatus, userInfo, logoutButton, loginButton);
    } else {
        userStatus.style.display = 'flex';
        userInfo.textContent = '';
        logoutButton.style.display = 'none';
        loginButton.style.display = 'block';
        console.log("User is not logged in, showing login button.");
    }

    // Logout button handler
    logoutButton.addEventListener('click', async () => {
        console.log("Logging out...");
        localStorage.removeItem('token');
        userInfo.textContent = '';
        logoutButton.style.display = 'none';
        loginButton.style.display = 'block';
        console.log("User logged out, login button will remain visible.");

        const logoutUrl = `https://accounts.google.com/Logout`;
        window.location.href = logoutUrl;
    });

    // Login button handler
    loginButton.addEventListener('click', () => {
        console.log("Redirecting to login...");
        window.location.href = '/api/auth/login';
    });
});

// ============================
// SECTION: Fetch User Data with Token
// ============================
async function fetchUserData(token, userStatus, userInfo, logoutButton, loginButton) {
    try {
        const response = await fetch('/api/auth/user', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            const errorData = await response.json();
            if (response.status === 401 && errorData.error === "Token expired") {
                console.error("Token expired at:", errorData.expiredAt);
                alert("Session expired. Please log in again.");
                window.location.href = '/api/auth/login';
                return;
            }
            throw new Error(`Error: ${response.statusText}`);
        }

        const data = await response.json();
        console.log("Fetched user data:", data); // Log the fetched user data

        if (data.user) {
            // Get user's initials (first two initials)
            const names = data.user.displayName.split(' ').map(name => name.charAt(0)).slice(0, 2).join('').toUpperCase();
            console.log("User initials:", names); // Log initials

            // Create a circle element for initials
            const initialsCircle = document.createElement('div');
            initialsCircle.textContent = names;
            initialsCircle.style.width = '40px';
            initialsCircle.style.height = '40px';
            initialsCircle.style.borderRadius = '50%';
            initialsCircle.style.backgroundColor = '#007bff';
            initialsCircle.style.color = 'white';
            initialsCircle.style.display = 'flex';
            initialsCircle.style.alignItems = 'center';
            initialsCircle.style.justifyContent = 'center';
            initialsCircle.style.fontSize = '16px';
            initialsCircle.style.marginRight = '10px';
            initialsCircle.style.cursor = 'pointer';

            userInfo.innerHTML = '';
            userInfo.appendChild(initialsCircle);

            const currentProfileImage = document.getElementById('current-profile-image');
            const currentInitials = document.getElementById('current-initials');

            // Check if profile image exists and set it
            if (data.user.profileImage) {
                console.log("Profile image found:", data.user.profileImage); // Log the image URL
                currentProfileImage.src = data.user.profileImage; // Set the profile image URL
                currentProfileImage.style.display = 'block'; // Show the image
                currentInitials.style.display = 'none'; // Hide initials
            } else {
                console.log("No profile image found, displaying initials."); // Log when no image is found
                currentInitials.textContent = names; // Set initials
                currentInitials.style.display = 'flex'; // Show initials
                currentProfileImage.style.display = 'none'; // Hide profile image
            }

            initialsCircle.addEventListener('click', () => {
                const modal = document.getElementById('profile-info-modal');
                const rect = initialsCircle.getBoundingClientRect();
                modal.style.position = 'absolute';
                modal.style.top = `${rect.bottom + window.scrollY}px`;
                modal.style.left = `${rect.left}px`;
                modal.style.display = 'block';

                document.getElementById('user-name').value = data.user.displayName; // Set the name field
            });

            userStatus.style.display = 'flex';
            logoutButton.style.display = 'none';
            loginButton.style.display = 'none';
            console.log("User data fetched successfully:", data.user);
        } else {
            console.log("No user data found, showing login button."); // Log when no user data is found
            userStatus.style.display = 'flex';
            userInfo.textContent = ''; 
            logoutButton.style.display = 'none'; 
            loginButton.style.display = 'block';
        }
    } catch (error) {
        console.error('Error fetching user data:', error);
        userStatus.style.display = 'flex'; 
        userInfo.textContent = ''; 
        logoutButton.style.display = 'none'; 
        loginButton.style.display = 'block'; 
    }
}



// ============================
// SECTION: Save Profile Information
// ============================
document.getElementById('save-profile-info').addEventListener('click', async () => {
    const userName = document.getElementById('user-name').value;
    const profileImage = document.getElementById('profile-image').files[0];

    const formData = new FormData();
    formData.append('name', userName);
    if (profileImage) {
        formData.append('image', profileImage);
    }

    const saveButton = document.getElementById('save-profile-info');
    saveButton.innerText = 'Saving...';
    saveButton.disabled = true;

    try {
        const response = await fetch('/api/user/profile', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: formData
        });

        console.log('Response:', response);
        
        if (response.ok) {
            console.log('Profile information saved successfully');
            document.getElementById('profile-info-modal').style.display = 'none';
        } else {
            const contentType = response.headers.get("content-type");
            let errorData;

            if (contentType && contentType.includes("application/json")) {
                errorData = await response.json();
            } else {
                errorData = { error: 'Unexpected response format' };
            }

            console.error('Error saving profile information:', errorData);
        }
    } catch (error) {
        console.error('Network or server error:', error);
    } finally {
        saveButton.innerText = 'Save';
        saveButton.disabled = false;
    }
});

// ============================
// SECTION: Close Modal
// ============================
document.getElementById('close-modal').addEventListener('click', () => {
    document.getElementById('profile-info-modal').style.display = 'none';
});

// ============================
// SECTION: Logout Button in Modal
// ============================
document.getElementById('modal-logout-button').addEventListener('click', async () => {
    console.log("Logging out from profile modal...");
    localStorage.removeItem('token');

    if (typeof userInfo !== 'undefined' && userInfo) {
        userInfo.textContent = '';
    }

    if (typeof logoutButton !== 'undefined' && logoutButton) {
        logoutButton.style.display = 'none';
    }

    if (typeof loginButton !== 'undefined' && loginButton) {
        loginButton.style.display = 'block';
    }

    console.log("User logged out, login button will remain visible.");

    const googleLogoutUrl = `https://accounts.google.com/Logout`;
    window.location.href = googleLogoutUrl;
});

// ============================
// SECTION: Capture Token and Store in localStorage
// ============================
document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    if (token) {
        localStorage.setItem('token', token);
        window.history.replaceState({}, document.title, "/");
        fetchUserData(token, userStatus, userInfo, logoutButton, loginButton);
    }
});
