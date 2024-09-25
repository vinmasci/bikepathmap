let photoMarkers = [];

async function loadPhotoMarkers() {
    try {
        const response = await fetch('/api/get-photos');
        const photos = await response.json();

        removePhotoMarkers();

        photos.forEach(photo => {
            if (photo.latitude && photo.longitude) {
                const markerElement = document.createElement('div');
                markerElement.className = 'custom-marker';
                markerElement.innerHTML = '<i class="fas fa-camera"></i>';

                const marker = new mapboxgl.Marker(markerElement)
                    .setLngLat([photo.longitude, photo.latitude])
                    .addTo(map);  // map needs to be globally available

                const popup = new mapboxgl.Popup({ offset: 25 })
                    .setHTML(`<h3>${photo.originalName}</h3><img src="${photo.url}" style="width:200px;">`);

                marker.setPopup(popup);
                photoMarkers.push(marker);
            }
        });
    } catch (error) {
        console.error('Error loading photo markers:', error);
    }
}

function removePhotoMarkers() {
    photoMarkers.forEach(marker => marker.remove());
    photoMarkers = [];
}
