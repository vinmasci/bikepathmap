// /public/js/main.js

import { initMap, toggleRoadLayer } from './map.js';
import { initModals, openModal, closeModal } from './modal.js';
import { uploadGPXFile } from './upload.js';

document.addEventListener("DOMContentLoaded", function () {
    const map = initMap(); // Initialize the map

    // Initialize modals
    initModals();

    // Tab and modal interaction
    document.getElementById('road-tab').addEventListener('click', toggleRoadLayer);
    document.getElementById('add-road-gpx').addEventListener('click', () => openModal('road-modal'));
    document.getElementById('photo-upload-button').addEventListener('click', () => uploadGPXFile('road-file'));
});
