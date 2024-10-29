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
                    url: photo.url,
                    _id: photo._id
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
                console.log("Loaded cluster icon.");

                if (!map.hasImage('camera-icon-cluster')) {
                    map.addImage('camera-icon-cluster', image);
                    console.log("Added cluster icon to map.");
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
                console.log("Added cluster layer to map.");
            });

            // Unclustered Photo Icon Layer
            map.loadImage('/cameraicon1.png', (error, image) => {
                if (error) throw error;
                console.log("Loaded unclustered photo icon.");

                if (!map.hasImage('camera-icon')) {
                    map.addImage('camera-icon', image);
                    console.log("Added unclustered photo icon to map.");
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
                console.log("Added unclustered photo layer to map.");
            });

            // Click event for clusters to zoom into them
            map.on('click', 'clusters', (e) => {
                const features = map.queryRenderedFeatures(e.point, {
                    layers: ['clusters']
                });
                const clusterId = features[0].properties.cluster_id;
                console.log("Cluster clicked, expanding cluster:", clusterId);

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
                const { originalName, url, _id: photoId } = e.features[0].properties;

                console.log("Unclustered photo clicked:", photoId);

                // Create popup content displaying photoId
                const popupContent = `
                    <div style="text-align: center;">
                        <p id="photoIdText" style="font-size: small; color: gray;">Photo ID: ${photoId}</p>
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

                // Add event listener for delete button within the popup
                popup.on('open', () => {
                    console.log("Popup opened with delete button for photo ID:", photoId);
                    const deleteButton = document.getElementById('deletePhotoBtn');

                    if (deleteButton) {
                        deleteButton.onclick = async () => {
                            const photoId = document.getElementById('photoIdText').innerText.replace('Photo ID: ', '').trim();
                            console.log("Delete button clicked, deleting photo ID:", photoId);

                            if (photoId) {
                                await deletePhoto(photoId);  // Call delete function with photo ID
                                popup.remove();              // Close popup after deletion
                                console.log("Popup closed after deletion.");
                            } else {
                                console.error("No photo ID found for deletion.");
                            }
                        };
                    } else {
                        console.error("Delete button not found within popup.");
                    }
                });
            });

        } else {
            map.getSource('photoMarkers').setData(photoGeoJSON);
            console.log("Updated photoMarkers source data.");
        }
    } catch (error) {
        console.error('Error loading photo markers:', error);
    }
}

// Delete photo function
async function deletePhoto(photoId) {
    if (!confirm("Are you sure you want to delete this photo?")) return;

    try {
        console.log("Sending delete request for photo ID:", photoId);
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
    console.log("Removed all photo markers and clusters from the map.");
}
