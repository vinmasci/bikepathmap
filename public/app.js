document.addEventListener("DOMContentLoaded", function () {
    mapboxgl.accessToken = 'pk.eyJ1IjoidmlubWFzY2kiLCJhIjoiY20xY3B1ZmdzMHp5eDJwcHBtMmptOG8zOSJ9.Ayn_YEjOCCqujIYhY9PiiA';

    const map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/streets-v11',
        center: [144.9631, -37.8136],
        zoom: 10
    });

    let layerVisibility = { road: false, gravel: false, photos: false, pois: false };
    let photoMarkers = [];

    // Function to load photo markers from the database
    async function loadPhotoMarkers() {
        try {
            const response = await fetch('/api/get-photos');
            const photos = await response.json();

            // Clear previous markers to avoid duplicates
            removePhotoMarkers();

            photos.forEach(photo => {
                if (photo.latitude && photo.longitude) {
                    // Create a custom pin with the camera icon inside
                    const markerElement = document.createElement('div');
                    markerElement.className = 'custom-marker';
                    markerElement.innerHTML = `
                        <div style="position: relative; width: 40px; height: 40px; background: url('https://upload.wikimedia.org/wikipedia/commons/e/ec/Red_pin.svg') no-repeat center center; background-size: contain;">
                            <i class="fas fa-camera" style="font-size: 18px; position: absolute; top: 5px; left: 10px; color: white;"></i>
                        </div>
                    `;

                    const marker = new mapboxgl.Marker(markerElement)
                        .setLngLat([photo.longitude, photo.latitude])
                        .addTo(map);

                    const popup = new mapboxgl.Popup({ offset: 25 })
                        .setHTML(`
                            <h3>${photo.originalName}</h3>
                            <img src="${photo.url}" style="width:200px;">
                            <div>
                                <input type="text" id="caption-input-${photo._id}" placeholder="Enter caption" value="${photo.caption || ''}">
                                <button onclick="saveCaption('${photo._id}')">Save Caption</button>
                            </div>
                        `);

                    marker.setPopup(popup);
                    photoMarkers.push(marker);
                }
            });
        } catch (error) {
            console.error('Error loading photo markers:', error);
        }
    }

    // Remove all photo markers from the map
    function removePhotoMarkers() {
        photoMarkers.forEach(marker => marker.remove());
        photoMarkers = [];
    }

    // Toggle photo layer on and off
    function togglePhotoLayer() {
        if (layerVisibility.photos) {
            removePhotoMarkers();
            layerVisibility.photos = false;
        } else {
            loadPhotoMarkers();
            layerVisibility.photos = true;
        }

        updateTabHighlight('photos-tab', layerVisibility.photos);
    }

    // Utility to visually highlight the active tab
    function updateTabHighlight(tabId, isActive) {
        const tab = document.getElementById(tabId);
        if (isActive) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    }

    // Event listener for toggling the Photos layer
    document.getElementById('photos-tab').addEventListener('click', function () {
        togglePhotoLayer();
    });

    // Add Tab functionality: toggle dropdown
    document.getElementById('add-tab').addEventListener('click', function () {
        const dropdown = document.getElementById('add-dropdown');
        dropdown.classList.toggle('show');
    });

    // Modal functionality for photo upload
    document.getElementById('add-photo').addEventListener('click', function() {
        const photoModal = document.getElementById('photo-modal');
        if (photoModal) {
            photoModal.style.display = 'block';
        }
    });

    // Close modal functionality
    const closeButtons = document.querySelectorAll('.close');
    closeButtons.forEach(button => {
        button.addEventListener('click', function () {
            const modalId = button.parentElement.parentElement.id;
            document.getElementById(modalId).style.display = 'none';
        });
    });

    function closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
        }
    }

    // Image Preview, File Validation, and Drag-and-Drop functionality
    const photoFileInput = document.getElementById('photoFiles');
    const previewContainer = document.getElementById('preview-container');
    const dragDropArea = document.getElementById('drag-drop-area');
    const uploadProgressBar = document.getElementById('upload-progress');

    let files = [];

    dragDropArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        dragDropArea.classList.add('drag-over');
    });

    dragDropArea.addEventListener('dragleave', () => {
        dragDropArea.classList.remove('drag-over');
    });

    dragDropArea.addEventListener('drop', (e) => {
        e.preventDefault();
        dragDropArea.classList.remove('drag-over');
        handleFiles(e.dataTransfer.files);
    });

    photoFileInput.addEventListener('change', (e) => {
        handleFiles(e.target.files);
    });

    function handleFiles(selectedFiles) {
        for (let file of selectedFiles) {
            if (validateFile(file)) {
                files.push(file);
                const reader = new FileReader();
                reader.onload = (e) => {
                    const img = document.createElement('img');
                    img.src = e.target.result;
                    img.style.width = '100px';
                    img.style.margin = '5px';
                    previewContainer.appendChild(img);
                };
                reader.readAsDataURL(file);
            }
        }
    }

    function validateFile(file) {
        const validTypes = ['image/jpeg', 'image/png'];
        if (!validTypes.includes(file.type)) {
            alert('Only JPEG and PNG files are allowed.');
            return false;
        }
        return true;
    }

    const uploadPhotoButton = document.getElementById('photo-upload-button');
    if (uploadPhotoButton) {
        uploadPhotoButton.addEventListener('click', function() {
            if (files.length === 0) {
                alert('Please select photos to upload');
                return;
            }

            const formData = new FormData();
            files.forEach(file => formData.append('photoFiles', file));  // Use correct field name here

            const xhr = new XMLHttpRequest();
            xhr.open('POST', '/api/upload-photo');
            xhr.upload.addEventListener('progress', function(e) {
                if (e.lengthComputable) {
                    const percentage = (e.loaded / e.total) * 100;
                    uploadProgressBar.style.width = `${percentage}%`;
                }
            });
            xhr.onload = function () {
                if (xhr.status === 200) {
                    alert('Photos uploaded successfully');
                    previewContainer.innerHTML = ''; // Clear preview
                    files = []; // Reset files
                    closeModal('photo-modal'); // Close modal
                    uploadProgressBar.style.width = '0%'; // Reset progress bar

                    // Reload photo markers after a successful upload
                    if (layerVisibility.photos) {
                        loadPhotoMarkers();  // Load new markers immediately
                    }
                } else {
                    alert('Error uploading photos');
                }
            };
            xhr.send(formData);
        });
    }

    // Function to save the caption when user clicks "Save Caption" button
    async function saveCaption(photoId) {
        const captionInput = document.getElementById(`caption-input-${photoId}`);
        const caption = captionInput.value;

        if (!caption) {
            alert('Please enter a caption');
            return;
        }

        try {
            const response = await fetch(`/api/save-caption`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    id: photoId,
                    caption: caption
                })
            });

            if (response.ok) {
                alert('Caption saved successfully');
                loadPhotoMarkers(); // Refresh the markers with updated captions
            } else {
                alert('Failed to save caption');
            }
        } catch (error) {
            console.error('Error saving caption:', error);
            alert('Error saving caption');
        }
    }
});
