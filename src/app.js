import mapboxgl from 'mapbox-gl';

mapboxgl.accessToken = 'pk.eyJ1IjoidmlubWFzY2kiLCJhIjoiY20xYmhmempzMG9jdzJpcTN2ZjJ4b3RodyJ9.18y5ZQPBFTIn6mOIcttJnA'; // Replace with your token

const map = new mapboxgl.Map({
    container: 'app',
    style: 'mapbox://styles/mapbox/streets-v11',
    center: [144.9631, -37.8136], // Starting position [longitude, latitude]
    zoom: 10
});
