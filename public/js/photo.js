let photoMarkers = [];

// SECTION 1: Loading and Formatting Data
async function loadPhotoMarkers() {
    try {
        const response = await fetch('/api/get-photos');
        const photos = await response.json();

        console.log("Photos fetched:", photos);

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

        return photoGeoJSON; // Return the formatted GeoJSON
    } catch (error) {
        console.error('Error loading photo markers:', error);
    }
}

// SECTION 2: Setting Up the Map Source
function addPhotoMarkersSource(map, photoGeoJSON) {
    if (!map.getSource('photoMarkers')) {
        console.log("Adding photoMarkers source to the map...");
        map.addSource('photoMarkers', {
            type: 'geojson',
            data: photoGeoJSON,
            cluster: true,   // Enable clustering
            clusterMaxZoom: 12,  // Max zoom to cluster points on
            clusterRadius: 50   // Radius of each cluster (adjust as needed)
        });
    } else {
        console.log("Updating existing photoMarkers source...");
        map.getSource('photoMarkers').setData(photoGeoJSON);
    }
}

// SECTION 3: Adding Map Layers
function addPhotoMarkerLayers(map) {
    // Add cluster circles (for groups of photos)
    if (!map.getLayer('clusters')) {
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
    }

    // Add unclustered photo points using black dots
    if (!map.getLayer('unclustered-photo')) {
        map.addLayer({
            id: 'unclustered-photo',
            type: 'circle',
            source: 'photoMarkers',
            filter: ['!', ['has', 'point_count']],  // Show only unclustered points
            paint: {
                'circle-color': '#000000',  // Black circle color
                'circle-radius': 5,  // Size of the unclustered photo points
                'circle-stroke-width': 1,
                'circle-stroke-color': '#fff'  // White border around black dots
            }
        });
    }
}

// SECTION 4: Event Listeners
function addPhotoMarkerEventListeners(map) {
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
}

// SECTION 5: Putting It All Together
async function initializePhotoMarkers(map) {
    const photoGeoJSON = await loadPhotoMarkers();
    if (photoGeoJSON) {
        addPhotoMarkersSource(map, photoGeoJSON);
        addPhotoMarkerLayers(map);
        addPhotoMarkerEventListeners(map);
    }
}

// Function to remove all photo markers and clusters from the map
function removePhotoMarkers() {
    if (map.getLayer('clusters')) map.removeLayer('clusters');
    if (map.getLayer('cluster-count')) map.removeLayer('cluster-count');
    if (map.getLayer('unclustered-photo')) map.removeLayer('unclustered-photo');
    if (map.getSource('photoMarkers')) map.removeSource('photoMarkers');
}
