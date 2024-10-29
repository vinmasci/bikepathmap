let photoMarkers = [];

// Function to load and display clustered photo markers with custom styling for individual markers
async function loadPhotoMarkers() {
    try {
        const response = await fetch('/api/get-photos');
        const photos = await response.json();

        console.log("Photos fetched:", photos);

        // Clear existing markers and source
        removePhotoMarkers();

        // Convert photos into GeoJSON format
        const photoGeoJSON = {
            type: 'FeatureCollection',
            features: photos.map(photo => ({
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: [photo.longitude, photo.latitude]
                },
                properties: {
                    originalName: photo.originalName,
                    url: photo.url,  // URL to display in the popup
                    latitude: photo.latitude,
                    longitude: photo.longitude,
                    _id: photo._id  // Assuming MongoDB _id is included for deletion
                }
            }))
        };

        // Add a GeoJSON source for photos with clustering enabled
        if (!map.getSource('photoMarkers')) {
            map.addSource('photoMarkers', {
                type: 'geojson',
                data: photoGeoJSON,
                cluster: true,
                clusterMaxZoom: 12,
                clusterRadius: 50
            });

            // UNCLUSTERED PHOTO ICON
            map.loadImage('/cameraicon1.png', (error, image) => {
                if (error) throw error;
                if (!map.hasImage('camera-icon')) map.addImage('camera-icon', image);
                map.addLayer({
                    id: 'unclustered-photo',
                    type: 'symbol',
                    source: 'photoMarkers',
                    filter: ['!', ['has', 'point_count']],
                    layout: {
                        'icon-image': 'camera-icon',
                        'icon-size': 0.3,
                        'icon-allow-overlap': true
                    }
                });
            });

            // Add click event for unclustered photos
            map.on('click', 'unclustered-photo', (e) => {
                const coordinates = e.features[0].geometry.coordinates.slice();
                const { originalName, url, latitude, longitude, _id } = e.features[0].properties;

                // Popup content without heading, including location and delete button
                const popupContent = `
                    <div>
                        <img src="${url}" style="width:200px; margin-bottom: 10px;">
                        <p>Location: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}</p>
                        <button id="deletePhotoBtn" style="background-color: red; color: white; padding: 5px; border: none; cursor: pointer;">
                            Delete Photo
                        </button>
                    </div>
                `;

                const popup = new mapboxgl.Popup()
                    .setLngLat(coordinates)
                    .setHTML(popupContent)
                    .addTo(map);

                // Add event listener to the delete button
                popup.on('open', () => {
                    const deleteButton = document.getElementById('deletePhotoBtn');
                    if (deleteButton) {
                        deleteButton.addEventListener('click', () => {
                            deletePhoto(_id);  // Call delete function with photo ID
                            popup.remove();    // Close popup after deletion
                        });
                    }
                });
            });
        } else {
            map.getSource('photoMarkers').setData(photoGeoJSON);
        }
    } catch (error) {
        console.error('Error loading photo markers:', error);
    }
}

// Delete photo function
async function deletePhoto(photoId) {
    if (!confirm("Are you sure you want to delete this photo?")) return;

    try {
        const response = await fetch(`/api/delete-photo?photoId=${encodeURIComponent(photoId)}`, {
            method: 'DELETE'
        });
        const result = await response.json();

        if (result.success) {
            console.log("Photo deleted successfully.");
            loadPhotoMarkers(); // Refresh markers to remove deleted photo
        } else {
            console.error("Failed to delete photo:", result.message);
        }
    } catch (error) {
        console.error("Error deleting photo:", error);
    }
}

// Function to remove all photo markers and clusters from the map
function removePhotoMarkers() {
    if (map.getLayer('unclustered-photo')) map.removeLayer('unclustered-photo');
    if (map.getSource('photoMarkers')) map.removeSource('photoMarkers');
}
