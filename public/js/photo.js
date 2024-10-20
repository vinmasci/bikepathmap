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
                    url: photo.url  // We'll use the URL as the marker icon for unclustered points
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

            // Add cluster circles (for groups of photos)
            map.addLayer({
                id: 'clusters',
                type: 'circle',
                source: 'photoMarkers',
                filter: ['has', 'point_count'],  // Only show clusters
                paint: {
                    'circle-color': '#51bbd6',  // Cluster circle color
                    'circle-radius': [
                        'step',
                        ['get', 'point_count'],
                        20,  // Cluster size for 1 point
                        30,  // Cluster size for 100 points
                        40   // Cluster size for 750 points
                    ],
                    'circle-stroke-width': 2,
                    'circle-stroke-color': '#fff'  // White border around clusters
                }
            });

            // Add cluster text (show the number of photos in the cluster)
            map.addLayer({
                id: 'cluster-count',
                type: 'symbol',
                source: 'photoMarkers',
                filter: ['has', 'point_count'],
                layout: {
                    'text-field': '{point_count_abbreviated}',  // Show cluster count
                    'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
                    'text-size': 12,
                    'text-allow-overlap': true
                },
                paint: {
                    'text-color': '#ffffff'  // Make the text inside clusters white
                }
            });

            // Add unclustered photo points with a default marker icon
            map.addLayer({
                id: 'unclustered-photo',
                type: 'symbol',
                source: 'photoMarkers',
                filter: ['!', ['has', 'point_count']],  // Show only unclustered points
                layout: {
                    'icon-image': 'marker-15',  // Use a default marker icon to ensure visibility
                    'icon-size': 1.0,  // Adjust size as needed
                    'icon-allow-overlap': true
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
