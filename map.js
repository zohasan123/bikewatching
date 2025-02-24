// Set your Mapbox access token here
mapboxgl.accessToken = 'pk.eyJ1Ijoiem9oYXNhbiIsImEiOiJjbTdpYnhvcjYwMGthMmxwa2tqb2NnMmN5In0.Adr8Fg4jPXseZfZG9onnfw';

// Initialize the map
const map = new mapboxgl.Map({
    container: 'map', // ID of the div where the map will render
    style: 'mapbox://styles/mapbox/streets-v12', // Map style
    center: [-71.09415, 42.36027], // [longitude, latitude] - Example: Boston, MA
    zoom: 12, // Initial zoom level
    minZoom: 5, // Minimum allowed zoom
    maxZoom: 18 // Maximum allowed zoom
});

// Add zoom and rotation controls to the map
map.addControl(new mapboxgl.NavigationControl());
