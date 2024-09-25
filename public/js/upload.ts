// /public/js/upload.js
import { addGPXLayer } from './map.js';

export function uploadGPXFile(fileInputId) {
    const fileInput = document.getElementById(fileInputId);
    const file = fileInput.files[0];

    if (!file || !file.name.endsWith('.gpx')) {
        alert('Please select a valid GPX file');
        return;
    }

    const formData = new FormData();
    formData.append('gpxFile', file);

    fetch('/api/upload-gpx', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.message) {
            alert(data.message);
            addGPXLayer(data.fileData.filePath);
        } else {
            alert('Error uploading GPX file');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Failed to upload GPX file');
    });
}
