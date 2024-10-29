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
                    _id: photo._id   // Assuming MongoDB _id is included for deletion
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

            // Clustered Icon Layer
            map.loadImage('/cameraiconexpand.png', (error, image) => {
                if (error) throw error;

                if (!map.hasImage('camera-icon-cluster')) {
                    map.addImage('camera-icon-cluster', image);
                }

                map.addLayer({
                    id: 'clusters',
                    type: 'symbol',
                    source: 'photoMarkers',
                    filter: ['has', 'point_count'],
                    layout: {
                        'icon-image': 'camera-icon-cluster',
                        'icon-size': 0.4,
                        'icon-allow-overlap': true
                    }
                });
            });

            // Unclustered Photo Icon Layer
            map.loadImage('/cameraicon1.png', (error, image) => {
                if (error) throw error;

                if (!map.hasImage('camera-icon')) {
                    map.addImage('camera-icon', image);
                }

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

            // Click event for clusters to zoom into them
            map.on('click', 'clusters', (e) => {
                const features = map.queryRenderedFeatures(e.point, {
                    layers: ['clusters']
                });
                const clusterId = features[0].properties.cluster_id;
                map.getSource('photoMarkers').getClusterExpansionZoom(clusterId, (err, zoom) => {
                    if (err) return;

                    map.easeTo({
                        center: features[0].geometry.coordinates,
                        zoom: zoom
                    });
                });
            });

            // Click event for unclustered photos
            map.on('click', 'unclustered-photo', (e) => {
                const coordinates = e.features[0].geometry.coordinates.slice();
                const { originalName, url, _id } = e.features[0].properties;

                // Create popup content without heading and with a centered delete button
                const popupContent = `
                    <div style="text-align: center;">
                        <img src="${url}" style="width:200px; margin-bottom: 10px;">
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
            console.log("Updating existing photoMarkers source...");
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
    if (map.getLayer('clusters')) map.removeLayer('clusters');
    if (map.getLayer('unclustered-photo')) map.removeLayer('unclustered-photo');
    if (map.getSource('photoMarkers')) map.removeSource('photoMarkers');
}
