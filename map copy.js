// // Set your Mapbox access token here
// mapboxgl.accessToken = 'pk.eyJ1Ijoiem9oYXNhbiIsImEiOiJjbTdpYnhvcjYwMGthMmxwa2tqb2NnMmN5In0.Adr8Fg4jPXseZfZG9onnfw';

// // 🔴 Added: Initialize time filter variable
// let timeFilter = 0;

// // 🔴 Added: Select slider elements from the DOM
// const timeSlider = document.getElementById('time-slider');
// const selectedTime = document.getElementById('selected-time');
// const anyTimeLabel = document.getElementById('any-time');

// // Define new constants for filtered data
// let filteredTrips = [];
// let filteredArrivals = new Map();
// let filteredDepartures = new Map();
// let filteredStations = [];

// // 🔴 Added: Function to format minutes since midnight into HH:MM AM/PM
// function formatTime(minutes) {
//     const date = new Date(0, 0, 0, 0, minutes); // Set hours & minutes
//     return date.toLocaleString('en-US', { timeStyle: 'short' }); // Format as HH:MM AM/PM
// }
// function minutesSinceMidnight(date) {
//     return date.getHours() * 60 + date.getMinutes();
// }

// // Function to filter trips by time selection
// function filterTripsByTime() {
//     filteredTrips = timeFilter === -1
//         ? trips
//         : trips.filter((trip) => {
//             const startedMinutes = minutesSinceMidnight(trip.started_at);
//             const endedMinutes = minutesSinceMidnight(trip.ended_at);
//             return (
//               Math.abs(startedMinutes - timeFilter) <= 60 ||
//               Math.abs(endedMinutes - timeFilter) <= 60
//             );
//           });
  
//     // We need to update the station data here (explained next)
// }



// // 🔴 Added: Function to update the UI when the slider moves
// function updateTimeDisplay() {
//     timeFilter = Number(timeSlider.value); // Get slider value

//     if (timeFilter === -1) {
//         selectedTime.textContent = '';  // Clear time display
//         anyTimeLabel.style.display = 'block';  // Show "(any time)"
//     } else {
//         selectedTime.textContent = formatTime(timeFilter);  // Display formatted time
//         anyTimeLabel.style.display = 'none';  // Hide "(any time)"
//     }

//     // 🔴 Trigger filtering logic (to be implemented next)
// }

// // 🔴 Added: Listen for slider input and update time in real-time
// timeSlider.addEventListener('input', updateTimeDisplay);

// // 🔴 Added: Set initial display state
// updateTimeDisplay();

// // Initialize the map
// const map = new mapboxgl.Map({
//     container: 'map',
//     style: 'mapbox://styles/mapbox/streets-v12',
//     center: [-71.09415, 42.36027], // Boston/Cambridge area
//     zoom: 12,
//     minZoom: 5,
//     maxZoom: 18
// });

// // Add zoom and rotation controls
// map.addControl(new mapboxgl.NavigationControl());

// // Wait for the map to fully load before adding data
// map.on('load', () => {
//     // Add bike lane sources and layers (Boston & Cambridge)
//     map.addSource('boston_route', {
//         type: 'geojson',
//         data: 'https://bostonopendata-boston.opendata.arcgis.com/datasets/boston::existing-bike-network-2022.geojson?...'
//     });

//     map.addSource('cambridge_route', {
//         type: 'geojson',
//         data: 'https://raw.githubusercontent.com/cambridgegis/cambridgegis_data/main/Recreation/Bike_Facilities/RECREATION_BikeFacilities.geojson'
//     });

//     map.addLayer({
//         id: 'boston-bike-lanes',
//         type: 'line',
//         source: 'boston_route',
//         paint: {
//             'line-color': '#008000',
//             'line-width': 3,
//             'line-opacity': 0.6
//         }
//     });

//     map.addLayer({
//         id: 'cambridge-bike-lanes',
//         type: 'line',
//         source: 'cambridge_route',
//         paint: {
//             'line-color': '#008000',
//             'line-width': 3,
//             'line-opacity': 0.6
//         }
//     });

//     // Load bike station and traffic data
//     const stationUrl = "https://dsc106.com/labs/lab07/data/bluebikes-stations.json";
//     const trafficUrl = "https://dsc106.com/labs/lab07/data/bluebikes-traffic-2024-03.csv";

//     Promise.all([
//         d3.json(stationUrl),
//         d3.csv(trafficUrl)
//     ]).then(([stationData, tripData]) => {
//         let stations = stationData.data.stations;
//         let trips = tripData;

//         // Convert start and end time strings into Date objects
//         for (let trip of trips) {
//             trip.started_at = new Date(trip.start_time);
//             trip.ended_at = new Date(trip.end_time);
//         }

//         // Calculate departures and arrivals
//         const departures = d3.rollup(
//             trips,
//             (v) => v.length,
//             (d) => d.start_station_id
//         );

//         const arrivals = d3.rollup(
//             trips,
//             (v) => v.length,
//             (d) => d.end_station_id
//         );

//         // Add traffic data to each station
//         stations = stations.map((station) => {
//             let id = station.short_name; // Matching station ID
//             station.arrivals = arrivals.get(id) ?? 0;
//             station.departures = departures.get(id) ?? 0;
//             station.totalTraffic = station.arrivals + station.departures;
//             return station;
//         });

//         console.log("Updated Stations with Traffic:", stations);

//         // Define scale for marker size based on total traffic
//         const radiusScale = d3
//             .scaleSqrt()
//             .domain([0, d3.max(stations, (d) => d.totalTraffic)]) // Min-max traffic
//             .range([2, 25]); // Circle size range

//         const svg = d3.select("#map-overlay");

//         // Function to update bike station markers dynamically
//         function updateStations() {
//             const circles = svg.selectAll("circle").data(stations);

//             // Enter + Update: Bind data and set properties
//             circles.enter()
//                 .append("circle")
//                 .merge(circles)
//                 .attr("cx", (d) => map.project([d.lon, d.lat]).x) // Convert lon/lat to pixel x
//                 .attr("cy", (d) => map.project([d.lon, d.lat]).y) // Convert lon/lat to pixel y
//                 .attr("r", (d) => radiusScale(d.totalTraffic)) // Scale size by total traffic
//                 .attr("fill", "steelblue")
//                 .attr("fill-opacity", 0.6)
//                 .attr("stroke", "white")
//                 .attr("stroke-width", 1.5)

//                 .each(function(d) {  
//                     d3.select(this)
//                         .append("title") // Tooltip element
//                         .text(`${d.totalTraffic} trips (${d.departures} departures, ${d.arrivals} arrivals)`);
//                 });

//             circles.exit().remove(); // Remove old elements
//         }

//         // Initial render
//         updateStations();

//         // Reposition markers when map moves
//         map.on("move", updateStations);
//     }).catch(error => {
//         console.error("Error loading data:", error);
//     });
// });



// Set your Mapbox access token here
mapboxgl.accessToken = 'pk.eyJ1Ijoiem9oYXNhbiIsImEiOiJjbTdpYnhvcjYwMGthMmxwa2tqb2NnMmN5In0.Adr8Fg4jPXseZfZG9onnfw';

// 🔴 Added: Initialize time filter variable
let timeFilter = 0;

// 🔴 Added: Select slider elements from the DOM
const timeSlider = document.getElementById('time-slider');
const selectedTime = document.getElementById('selected-time');
const anyTimeLabel = document.getElementById('any-time');

// Define new constants for filtered data
let filteredTrips = [];
let filteredArrivals = new Map();
let filteredDepartures = new Map();
let filteredStations = [];

// 🔴 Added: Function to format minutes since midnight into HH:MM AM/PM
function formatTime(minutes) {
    const date = new Date(0, 0, 0, 0, minutes); // Set hours & minutes
    return date.toLocaleString('en-US', { timeStyle: 'short' }); // Format as HH:MM AM/PM
}

// Function to calculate minutes since midnight
function minutesSinceMidnight(date) {
    return date.getHours() * 60 + date.getMinutes();
}

// 🔴 Added: Function to compute station traffic
function computeStationTraffic(stations, trips) {
    // Compute departures
    const departures = d3.rollup(
        trips, 
        (v) => v.length, 
        (d) => d.start_station_id
    );

    // Compute arrivals
    const arrivals = d3.rollup(
        trips, 
        (v) => v.length, 
        (d) => d.end_station_id
    );

    // Update each station with arrivals and departures
    return stations.map((station) => {
        let id = station.short_name;
        station.arrivals = arrivals.get(id) ?? 0;
        station.departures = departures.get(id) ?? 0;
        station.totalTraffic = station.arrivals + station.departures;
        return station;
    });
}

// 🔴 Added: Function to filter trips by time selection
function filterTripsbyTime(trips, timeFilter) {
  return timeFilter === -1
    ? trips // If no filter is applied (-1), return all trips
    : trips.filter((trip) => {
        // Convert trip start and end times to minutes since midnight
        const startedMinutes = minutesSinceMidnight(trip.started_at);
        const endedMinutes = minutesSinceMidnight(trip.ended_at);
        
        // Include trips that started or ended within 60 minutes of the selected time
        return (
          Math.abs(startedMinutes - timeFilter) <= 60 ||
          Math.abs(endedMinutes - timeFilter) <= 60
        );
    });
}
/*
// 🔴 Added: Function to update the UI when the slider moves
function updateTimeDisplay() {
    timeFilter = Number(timeSlider.value); // Get slider value

    if (timeFilter === -1) {
        selectedTime.textContent = '';  // Clear time display
        anyTimeLabel.style.display = 'block';  // Show "(any time)"
    } else {
        selectedTime.textContent = formatTime(timeFilter);  // Display formatted time
        anyTimeLabel.style.display = 'none';  // Hide "(any time)"
    }

    // Call updateScatterPlot to reflect the changes on the map

    updateScatterPlot(timeFilter);
}

// 🔴 Added: Listen for slider input and update time in real-time
timeSlider.addEventListener('input', updateTimeDisplay);

// 🔴 Added: Set initial display state
updateTimeDisplay();*/

// Initialize the map
const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v12',
    center: [-71.09415, 42.36027], // Boston/Cambridge area
    zoom: 12,
    minZoom: 5,
    maxZoom: 18
});

// Add zoom and rotation controls
map.addControl(new mapboxgl.NavigationControl());

let trips = []; // Declare trips at a higher scope
let stations = []; // Declare stations at a higher scope

// Wait for the map to fully load before adding data
map.on('load', () => {
    const radiusScale = d3
            .scaleSqrt()
            .domain([0, d3.max(stations, (d) => d.totalTraffic)]) // Min-max traffic
            .range([2, 25]); // Circle size range
    
    const svg = d3.select("#map-overlay");
    // Add bike lane sources and layers (Boston & Cambridge)
    map.addSource('boston_route', {
        type: 'geojson',
        data: 'https://bostonopendata-boston.opendata.arcgis.com/datasets/boston::existing-bike-network-2022.geojson?...'
    });

    map.addSource('cambridge_route', {
        type: 'geojson',
        data: 'https://raw.githubusercontent.com/cambridgegis/cambridgegis_data/main/Recreation/Bike_Facilities/RECREATION_BikeFacilities.geojson'
    });

    map.addLayer({
        id: 'boston-bike-lanes',
        type: 'line',
        source: 'boston_route',
        paint: {
            'line-color': '#008000',
            'line-width': 3,
            'line-opacity': 0.6
        }
    });

    map.addLayer({
        id: 'cambridge-bike-lanes',
        type: 'line',
        source: 'cambridge_route',
        paint: {
            'line-color': '#008000',
            'line-width': 3,
            'line-opacity': 0.6
        }
    });

    // Load bike station and traffic data
    const stationUrl = "https://dsc106.com/labs/lab07/data/bluebikes-stations.json";
    const trafficUrl = "https://dsc106.com/labs/lab07/data/bluebikes-traffic-2024-03.csv";

    Promise.all([
        d3.json(stationUrl),
        d3.csv(trafficUrl)
    ]).then(([stationData, tripData]) => {
        stations = stationData;
        trips = tripData;

        // Convert start and end time strings into Date objects
        for (let trip of trips) {
            trip.started_at = new Date(trip.started_at);
            trip.ended_at = new Date(trip.ended_at);
        }
        

        // Function to update bike station markers dynamically
        function updateStations() {
            const circles = svg.selectAll("circle").data(stations, (d) => d.short_name);
            console.log(circles)

            console.log(radiusScale)
            // Enter + Update: Bind data and set properties
            circles.enter()
                .append("circle")
                .merge(circles)
                .attr("cx", (d) => map.project([d.lon, d.lat]).x) // Convert lon/lat to pixel x
                .attr("cy", (d) => map.project([d.lon, d.lat]).y) // Convert lon/lat to pixel y
                .attr("r", (d) => radiusScale(d.totalTraffic)) // Scale size by total traffic
                .attr("fill", "steelblue")
                .attr("fill-opacity", 0.6)
                .attr("stroke", "white")
                .attr("stroke-width", 1.5)

                .each(function(d) {  
                    d3.select(this)
                        .append("title") // Tooltip element
                        .text(`${d.totalTraffic} trips (${d.departures} departures, ${d.arrivals} arrivals)`);
                });

            circles.exit().remove(); // Remove old elements
        }

        // Initial render
        updateStations();

        // Reposition markers when map moves
        map.on("move", updateStations);

    }).catch(error => {
        console.error("Error loading data:", error);
    });


    // 🔴 Added: Function to dynamically update the scatterplot based on the time filter
    function updateScatterPlot(timeFilter) {
    // Get only the trips that match the selected time filter
        const filteredTrips = filterTripsbyTime(trips, timeFilter);

    // Recompute station traffic based on the filtered trips
        const filteredStations = computeStationTraffic(stations, filteredTrips);

    // Adjust the circle size range based on time filter
        timeFilter === -1 ? radiusScale.range([0, 25]) : radiusScale.range([3, 50]);

    // Update the scatterplot by adjusting the radius of circles
        const circles = svg.selectAll('circle').data(filteredStations, (d) => d.short_name);

        circles
        .data(filteredStations, (d) => d.short_name)  // Ensure D3 tracks elements correctly
        .join('circle')
        .attr('r', (d) => radiusScale(d.totalTraffic));

    }

    function updateTimeDisplay() {
        timeFilter = Number(timeSlider.value); // Get slider value
    
        if (timeFilter === -1) {
            selectedTime.textContent = '';  // Clear time display
            anyTimeLabel.style.display = 'block';  // Show "(any time)"
        } else {
            selectedTime.textContent = formatTime(timeFilter);  // Display formatted time
            anyTimeLabel.style.display = 'none';  // Hide "(any time)"
        }
    
        // Call updateScatterPlot to reflect the changes on the map
    
        updateScatterPlot(timeFilter);
    }

    timeSlider.addEventListener('input', updateTimeDisplay);
    updateTimeDisplay();

});





