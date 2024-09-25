let photoMarkers = [];

async function loadPhotoMarkers() {
    try {
        const response = await fetch('/api/get-photos');
        const photos = await response.json();

        removePhotoMarkers(); // Clear any previous markers

        let stackOffset = 0; // To create a stacking effect

        photos.forEach((photo, index) => {
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

                // Adjust the marker's position slightly for stacking effect
                const offset = 10 * (index % 3);  // Modify as needed for stacking effect
                markerElement.style.transform = `translate(${offset}px, ${-offset}px)`;

                // Create the marker and add it to the map
                const marker = new mapboxgl.Marker({
                    element: markerElement,
                    anchor: 'bottom' // Prevents scaling on zoom-out
                })
                    .setLngLat([photo.longitude, photo.latitude])
                    .addTo(map);

                // Add a popup with more information about the photo
                const popup = new mapboxgl.Popup({ offset: 25 })
                    .setHTML(`<h3>${photo.originalName}</h3><img src="${photo.url}" style="width:200px;">`);

                marker.setPopup(popup);  // Bind the popup to the marker
                photoMarkers.push(marker);  // Add marker to the array for future cleanup

                stackOffset += 10;  // Increment offset for the stacking effect
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
