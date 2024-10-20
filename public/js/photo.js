let photoMarkers = [];

// Function to load and display clustered photo markers with custom styling for individual markers
async function loadPhotoMarkers() {
    try {
        const response = await fetch('/api/get-photos');
        const photos = await response.json();

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
                    url: photo.url
                }
            }))
        };

        // Add a GeoJSON source for photos with clustering enabled
        if (!map.getSource('photoMarkers')) {
            map.addSource('photoMarkers', {
                type: 'geojson',
                data: photoGeoJSON,
                cluster: true,   // Enable clustering
                clusterMaxZoom: 14,  // Max zoom to cluster points on
                clusterRadius: 50   // Radius of each cluster (adjust as needed)
            });

            // Add cluster circles (for groups of photos)
            map.addLayer({
                id: 'clusters',
                type: 'circle',
                source: 'photoMarkers',
                filter: ['has', 'point_count'],  // Cluster points only
                paint: {
                    'circle-color': '#51bbd6',
                    'circle-radius': 20,
                    'circle-stroke-width': 2,
                    'circle-stroke-color': '#fff'
                }
            });

            // Add cluster text (show the number of photos in the cluster)
            map.addLayer({
                id: 'cluster-count',
                type: 'symbol',
                source: 'photoMarkers',
                filter: ['has', 'point_count'],
                layout: {
                    'text-field': '{point_count_abbreviated}',
                    'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
                    'text-size': 12
                }
            });

            // Add individual unclustered photo points with custom styling
            photos.forEach(photo => {
                if (photo.latitude && photo.longitude) {
                    // Create a custom div element for the marker
                    const markerElement = document.createElement('div');
                    markerElement.className = 'custom-photo-marker';

                    // Set the background image to the photo URL and style it
                    markerElement.style.backgroundImage = `url(${photo.url})`;
                    markerElement.style.width = '40px';  // Size of the thumbnail
                    markerElement.style.height = '40px';
                    markerElement.style.backgroundSize = 'cover';
                    markerElement.style.borderRadius = '50%';  // Make it circular
                    markerElement.style.border = '2px solid white';  // Add a white border
                    markerElement.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.5)';  // Add shadow for better visibility

                    // Create the marker and add it to the map
                    const marker = new mapboxgl.Marker(markerElement)
                        .setLngLat([photo.longitude, photo.latitude])
                        .addTo(map);

                    // Add a popup with more information about the photo
                    const popup = new mapboxgl.Popup({ offset: 25 })
                        .setHTML(`<h3>${photo.originalName}</h3><img src="${photo.url}" style="width:200px;">`);

                    marker.setPopup(popup);  // Bind the popup to the marker
                    photoMarkers.push(marker);  // Add marker to the array for future cleanup
                }
            });

            // Add click event for clusters to zoom into them
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
        } else {
            // Update existing source data if it already exists
            map.getSource('photoMarkers').setData(photoGeoJSON);
        }
    } catch (error) {
        console.error('Error loading photo markers:', error);
    }
}

// Function to remove all photo markers and clusters from the map
function removePhotoMarkers() {
    if (map.getLayer('clusters')) map.removeLayer('clusters');
    if (map.getLayer('cluster-count')) map.removeLayer('cluster-count');
    if (map.getLayer('unclustered-photo')) map.removeLayer('unclustered-photo');
    if (map.getSource('photoMarkers')) map.removeSource('photoMarkers');
}
