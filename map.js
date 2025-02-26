// Set your Mapbox access token here
mapboxgl.accessToken = 'pk.eyJ1Ijoiem9oYXNhbiIsImEiOiJjbTdpYnhvcjYwMGthMmxwa2tqb2NnMmN5In0.Adr8Fg4jPXseZfZG9onnfw';
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

function minutesSinceMidnight(date) {
    return date.getHours() * 60 + date.getMinutes();
}

let stationFlow = d3.scaleQuantize().domain([0, 1]).range([0, 0.5, 1]);
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

const stationUrl = "https://dsc106.com/labs/lab07/data/bluebikes-stations.json";
const trafficUrl = "https://dsc106.com/labs/lab07/data/bluebikes-traffic-2024-03.csv";

// Wait for the map to fully load before adding data
map.on('load', async () => {
    let jsonData;
    try {
        const jsonurl = "https://dsc106.com/labs/lab07/data/bluebikes-stations.json";
        
        // Await JSON fetch
        jsonData = await d3.json(jsonurl);
        console.log('Loaded JSON Data:', jsonData); // Log to verify structure
    } catch (error) {
        console.error('Error loading JSON:', error); // Handle errors
    }
    // console.log(jsonData)
    let trips = await d3.csv(trafficUrl);
    const stations = computeStationTraffic(jsonData.data.stations, trips);
    


    // console.log(stations)

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

    for (let trip of trips) {
        trip.started_at = new Date(trip.started_at);
        trip.ended_at = new Date(trip.ended_at);
    }
        

    function updateStations() {
        const circles = svg.selectAll("circle").data(stations, (d) => d.short_name) ;

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
            })
            .style("--departure-ratio", d => stationFlow(d.departures / d.totalTraffic));

        circles.exit().remove(); // Remove old elements
    }

        // Initial render
        updateStations();

        // Reposition markers when map moves
        map.on("move", updateStations);

    


  
    function updateScatterPlot(timeFilter) {
        const filteredTrips = filterTripsbyTime(trips, timeFilter);
        const filteredStations = computeStationTraffic(stations, filteredTrips);
        timeFilter === -1 ? radiusScale.range([0, 25]) : radiusScale.range([3, 50]);
        const circles = svg.selectAll('circle').data(filteredStations, (d) => d.short_name);

        circles
        .data(filteredStations, (d) => d.short_name)  
        .join('circle')
        .attr('r', (d) => radiusScale(d.totalTraffic))
        .style('--departure-ratio', (d) =>
            stationFlow(d.departures / d.totalTraffic),
        );
    }

    function updateTimeDisplay() {
        timeFilter = Number(timeSlider.value); 
    
        if (timeFilter === -1) {
            selectedTime.textContent = '';  
            anyTimeLabel.style.display = 'block';  
        } else {
            selectedTime.textContent = formatTime(timeFilter);  
            anyTimeLabel.style.display = 'none';  
        }
        updateScatterPlot(timeFilter);
    }

    timeSlider.addEventListener('input', updateTimeDisplay);
    updateTimeDisplay();

});





