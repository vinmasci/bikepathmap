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
                    url: photo.url  // We'll use the URL in popups, but not as an icon
                }
            }))
        };

        console.log("GeoJSON formatted photos:", photoGeoJSON);

        // Add a GeoJSON source for photos with clustering enabled
        if (!map.getSource('photoMarkers')) {
            console.log("Adding photoMarkers source to the map...");

            map.addSource('photoMarkers', {
                type: 'geojson',
                data: photoGeoJSON,
                cluster: true,   // Enable clustering
                clusterMaxZoom: 12,  // Max zoom to cluster points on
                clusterRadius: 50   // Radius of each cluster (adjust as needed)
            });


// CLUSTER
// Load the camera icon for the cluster expansion from the public folder
map.loadImage('/cameraiconexpand.png', (error, image) => {
    if (error) {
        console.error('Error loading camera icon for clusters:', error);
        return;
    }

    // Add the camera icon for clusters to the map
    if (!map.hasImage('camera-icon-cluster')) {
        map.addImage('camera-icon-cluster', image);
    }

    // Add cluster points using the camera icon
    map.addLayer({
        id: 'clusters',
        type: 'symbol',
        source: 'photoMarkers',
        filter: ['has', 'point_count'],  // Only show clusters
        layout: {
            'icon-image': 'camera-icon-cluster',  // Use the loaded camera icon for clusters
            'icon-size': 0.4,  // Adjust size as needed for clusters
            'icon-allow-overlap': true,
            'icon-pitch-alignment': 'map',
            'icon-rotation-alignment': 'map'
        }
    });


});


// UNCLUSTER
// Load the camera icon from the public folder
map.loadImage('/cameraicon1.png', (error, image) => {
    if (error) {
        console.error('Error loading camera icon:', error);
        return;
    }

    // Add the camera icon to the map
    if (!map.hasImage('camera-icon')) {
        map.addImage('camera-icon', image);
    }

    // Add unclustered photo points using the camera icon
    map.addLayer({
        id: 'unclustered-photo',
        type: 'symbol',
        source: 'photoMarkers',
        filter: ['!', ['has', 'point_count']],  // Show only unclustered points
        layout: {
            'icon-image': 'camera-icon',  // Use the loaded camera icon
            'icon-size': 0.3,  // Adjust size as needed
            'icon-allow-overlap': true,
            'icon-pitch-alignment': 'map',  // Ensure icon faces the map
            'icon-rotation-alignment': 'map'  // Prevent upside-down icons
        }
    });
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

            // Add click event for unclustered photos
            map.on('click', 'unclustered-photo', (e) => {
                const coordinates = e.features[0].geometry.coordinates.slice();
                const { originalName, url } = e.features[0].properties;

                // Create a popup with photo information
                new mapboxgl.Popup()
                    .setLngLat(coordinates)
                    .setHTML(`<h3>${originalName}</h3><img src="${url}" style="width:200px;">`)
                    .addTo(map);
            });

            console.log("Photo markers and clusters successfully added.");

        } else {
            console.log("Updating existing photoMarkers source...");
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
