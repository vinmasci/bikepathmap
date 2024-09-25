let map;
let photoMarkers = [];
let layerVisibility = { road: false, gravel: false, photos: false, pois: false };

document.addEventListener("DOMContentLoaded", function () {
    mapboxgl.accessToken = 'pk.eyJ1IjoidmlubWFzY2kiLCJhIjoiY20xY3B1ZmdzMHp5eDJwcHBtMmptOG8zOSJ9.Ayn_YEjOCCqujIYhY9PiiA';

    // Initialize the Mapbox map globally
    map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/streets-v11',
        center: [144.9631, -37.8136],
        zoom: 10
    });

    // Wait for the map to fully load its style before adding any layers or sources
    map.on('load', function() {
        const storedGPX = localStorage.getItem('gpxData');
        if (storedGPX) {
            const geojson = JSON.parse(storedGPX);
            map.addSource('gpx-route', {
                type: 'geojson',
                data: geojson
            });
            map.addLayer({
                id: 'gpx-route-layer',
                type: 'line',
                source: 'gpx-route',
                layout: {
                    'line-join': 'round',
                    'line-cap': 'round'
                },
                paint: {
                    'line-color': '#ff0000',
                    'line-width': 4
                }
            });
        }
    });

    // Close Modal function globally so it's accessible from anywhere
    function closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
        }
    }

    // Event listener for closing modals
    const closeButtons = document.querySelectorAll('.close');
    closeButtons.forEach(button => {
        button.addEventListener('click', function () {
            const modalId = button.parentElement.parentElement.id;
            closeModal(modalId);
        });
    });

    // Event listener for toggling the Photos layer
    document.getElementById('photos-tab').addEventListener('click', function () {
        togglePhotoLayer();
    });

    // Modal functionality for photo upload
    document.getElementById('add-photo').addEventListener('click', function() {
        const photoModal = document.getElementById('photo-modal');
        if (photoModal) {
            photoModal.style.display = 'block';
        }
    });

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
            files.forEach(file => formData.append('photoFiles', file));

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

    // Function to upload GPX files and render them
    document.getElementById('add-road-gpx').addEventListener('click', function() {
        const roadModal = document.getElementById('road-modal');
        if (roadModal) {
            roadModal.style.display = 'block';
        }
    });

    function uploadGPXFile(fileInputId) {
        const fileInput = document.getElementById(fileInputId);
        const file = fileInput.files[0];

        if (!file || !file.name.endsWith('.gpx')) {
            alert('Please select a valid GPX file');
            return;
        }

        const formData = new FormData();
        formData.append('gpxFile', file);

        fetch('/api/upload-gpx', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.message) {
                alert(data.message);
                loadGPXFromMongoDB(data.fileData.filePath);
            } else {
                alert('Error uploading GPX file');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Failed to upload GPX file');
        });
    }

    function loadGPXFromMongoDB(filePath) {
        fetch(filePath)
        .then(response => response.text())
        .then(gpxData => {
            const gpxParser = new DOMParser();
            const gpxDoc = gpxParser.parseFromString(gpxData, 'application/xml');
            const geojson = parseTrackPoints(gpxDoc);

            if (map.getSource('gpx-route')) {
                map.removeLayer('gpx-route-layer');
                map.removeSource('gpx-route');
            }

            map.addSource('gpx-route', {
                type: 'geojson',
                data: geojson
            });

            map.addLayer({
                id: 'gpx-route-layer',
                type: 'line',
                source: 'gpx-route',
                layout: {
                    'line-join': 'round',
                    'line-cap': 'round'
                },
                paint: {
                    'line-color': '#ff0000',
                    'line-width': 4
                }
            });

            alert('GPX route loaded and displayed on the map!');
            layerVisibility.road = true;
        })
        .catch(error => {
            console.error('Error loading GPX from MongoDB:', error);
        });
    }

    // Function to parse track points from GPX and convert to GeoJSON LineString
    function parseTrackPoints(gpxDoc) {
        const trackPoints = [];
        const trackPointElements = gpxDoc.getElementsByTagName('trkpt');

        for (let i = 0; i < trackPointElements.length; i++) {
            const trkpt = trackPointElements[i];
            const lat = parseFloat(trkpt.getAttribute('lat'));
            const lon = parseFloat(trkpt.getAttribute('lon'));

            if (!isNaN(lat) && !isNaN(lon)) {
                trackPoints.push([lon, lat]);
            }
        }

        return {
            type: 'Feature',
            geometry: {
                type: 'LineString',
                coordinates: trackPoints
            },
            properties: {}
        };
    }

    document.getElementById('road-tab').addEventListener('click', function () {
        toggleRoadLayer();
    });

    function toggleRoadLayer() {
        if (map.getLayer('gpx-route-layer')) {
            if (layerVisibility.road) {
                map.setLayoutProperty('gpx-route-layer', 'visibility', 'none');
                layerVisibility.road = false;
            } else {
                map.setLayoutProperty('gpx-route-layer', 'visibility', 'visible');
                layerVisibility.road = true;
            }
        } else {
            alert("No GPX route is loaded yet.");
        }

        updateTabHighlight('road-tab', layerVisibility.road);
    }

    // Function for dropdown toggle
    let addDropdownVisible = false;
    document.getElementById('add-tab').addEventListener('click', function () {
        const dropdown = document.getElementById('add-dropdown');
        if (dropdown) {
            addDropdownVisible = !addDropdownVisible;
            dropdown.classList.toggle('show', addDropdownVisible);
        }
        updateTabHighlight('add-tab', addDropdownVisible);
    });
});

// Helper function to highlight tabs
function updateTabHighlight(tabId, isActive) {
    const tab = document.getElementById(tabId);
    if (isActive) {
        tab.classList.add('active');
    } else {
        tab.classList.remove('active');
    }
}

// Helper function to remove photo markers from the map
function removePhotoMarkers() {
    photoMarkers.forEach(marker => marker.remove());
    photoMarkers = [];
}
