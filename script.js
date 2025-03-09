// Global variables
let map;
let marker;
let circle;
let zipCodesInRadius = [];
let geocoder;
let autocomplete;

// Initialize the application when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Add error handler for Google Maps
    window.gm_authFailure = function() {
        console.error('Google Maps authentication failed! Please check if:');
        console.error('1. The API key is valid');
        console.error('2. Billing is enabled on your Google Cloud Project');
        console.error('3. The required APIs are enabled (Maps JavaScript API, Places API, Geocoding API)');
        document.getElementById('map').innerHTML = '<div style="text-align: center; padding: 20px;">Error: Could not load Google Maps. Please check the console for details.</div>';
    };
    
    initializeMap();
    setupEventListeners();
    initializeAutocomplete();
});

// Initialize Google Map
function initializeMap() {
    try {
        // Default center (US center)
        const defaultCenter = { lat: 39.8283, lng: -98.5795 };
        
        // Create map instance
        map = new google.maps.Map(document.getElementById('map'), {
            center: defaultCenter,
            zoom: 4,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: true,
        });
        
        // Initialize geocoder service
        geocoder = new google.maps.Geocoder();
        
    } catch (error) {
        console.error('Error initializing Google Maps:', error);
        document.getElementById('map').innerHTML = '<div style="text-align: center; padding: 20px;">Error: ' + error.message + '</div>';
    }
}

// Initialize Places Autocomplete
function initializeAutocomplete() {
    const input = document.getElementById('address-input');
    autocomplete = new google.maps.places.Autocomplete(input, {
        types: ['address'],
        componentRestrictions: { country: 'us' }
    });

    // Prevent form submission on enter
    input.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
        }
    });

    // Handle place selection
    autocomplete.addListener('place_changed', function() {
        const place = autocomplete.getPlace();
        if (place.geometry) {
            const radius = parseInt(document.getElementById('radius-input').value) || 10;
            updateMap(place.geometry.location, radius);
            findZipCodesInRadius(place.geometry.location, radius);
        }
    });
}

// Set up event listeners
function setupEventListeners() {
    // Search button event
    document.getElementById('search-button').addEventListener('click', performSearch);
    
    // Download button event
    document.getElementById('download-btn').addEventListener('click', downloadZipCodes);
}

// Perform the search
function performSearch() {
    const address = document.getElementById('address-input').value;
    const radius = parseInt(document.getElementById('radius-input').value);
    
    if (!address) {
        alert('Please enter an address');
        return;
    }
    
    if (!radius || radius < 1 || radius > 100) {
        alert('Please enter a radius between 1 and 100 miles');
        return;
    }
    
    // Geocode the address
    geocoder.geocode({ address: address, componentRestrictions: { country: 'us' } }, (results, status) => {
        if (status === 'OK' && results[0]) {
            const location = results[0].geometry.location;
            updateMap(location, radius);
            findZipCodesInRadius(location, radius);
        } else {
            alert('Could not find that address. Please try again.');
        }
    });
}

// Update the map with new location and radius
function updateMap(location, radius) {
    // Center map on location
    map.setCenter(location);
    map.setZoom(10);
    
    // Add or update marker
    if (marker) {
        marker.setPosition(location);
    } else {
        marker = new google.maps.Marker({
            position: location,
            map: map,
            animation: google.maps.Animation.DROP
        });
    }
    
    // Add or update circle
    const radiusInMeters = radius * 1609.34; // Convert miles to meters
    if (circle) {
        circle.setCenter(location);
        circle.setRadius(radiusInMeters);
    } else {
        circle = new google.maps.Circle({
            strokeColor: '#3498db',
            strokeOpacity: 0.8,
            strokeWeight: 2,
            fillColor: '#3498db',
            fillOpacity: 0.15,
            map: map,
            center: location,
            radius: radiusInMeters
        });
    }
}

// Find ZIP codes within the radius
function findZipCodesInRadius(location, radius) {
    showLoadingState();
    
    const lat = location.lat();
    const lng = location.lng();
    
    // Create a grid of points around the center location
    const points = generateSearchPoints(lat, lng, radius);
    const uniqueZips = new Set();
    const zipDetails = new Map();
    
    // Process points in batches
    processBatchedPoints(points, uniqueZips, zipDetails, radius, lat, lng)
        .then(results => {
            displayZipCodes(results);
        })
        .catch(error => {
            console.error('Error fetching ZIP codes:', error);
            document.getElementById('zip-list').innerHTML = 
                '<p class="placeholder-text">Error fetching ZIP codes. Please try again.</p>';
        });
}

// Generate search points in a grid pattern
function generateSearchPoints(centerLat, centerLng, radiusMiles) {
    const points = [];
    const gridSize = Math.ceil(radiusMiles / 3); // One point every ~3 miles
    const latOffset = radiusMiles / 69; // Approximate miles to degrees conversion
    const lngOffset = radiusMiles / (69 * Math.cos(centerLat * (Math.PI / 180)));
    
    for (let i = -gridSize; i <= gridSize; i++) {
        for (let j = -gridSize; j <= gridSize; j++) {
            const lat = centerLat + (i * latOffset / gridSize);
            const lng = centerLng + (j * lngOffset / gridSize);
            const distance = calculateDistance(centerLat, centerLng, lat, lng);
            
            if (distance <= radiusMiles) {
                points.push({ lat, lng });
            }
        }
    }
    
    return points;
}

// Process points in batches to get ZIP codes
async function processBatchedPoints(points, uniqueZips, zipDetails, radius, centerLat, centerLng) {
    const batchSize = 5;
    const results = [];
    
    for (let i = 0; i < points.length; i += batchSize) {
        const batch = points.slice(i, i + batchSize);
        await Promise.all(batch.map(point => 
            new Promise((resolve) => {
                geocoder.geocode({ location: point }, (results, status) => {
                    if (status === 'OK' && results[0]) {
                        const zipComponent = results[0].address_components.find(
                            component => component.types.includes('postal_code')
                        );
                        
                        if (zipComponent && !uniqueZips.has(zipComponent.short_name)) {
                            const zip = zipComponent.short_name;
                            uniqueZips.add(zip);
                            
                            // Get city and state
                            const cityComponent = results[0].address_components.find(
                                component => component.types.includes('locality')
                            );
                            const stateComponent = results[0].address_components.find(
                                component => component.types.includes('administrative_area_level_1')
                            );
                            
                            const distance = calculateDistance(
                                centerLat, 
                                centerLng, 
                                results[0].geometry.location.lat(),
                                results[0].geometry.location.lng()
                            );
                            
                            if (distance <= radius) {
                                zipDetails.set(zip, {
                                    zipCode: zip,
                                    city: cityComponent ? cityComponent.short_name : 'Unknown',
                                    state: stateComponent ? stateComponent.short_name : 'Unknown',
                                    distance: distance.toFixed(2),
                                    lat: results[0].geometry.location.lat(),
                                    lng: results[0].geometry.location.lng()
                                });
                            }
                        }
                    }
                    resolve();
                });
            })
        ));
        
        // Add a small delay between batches to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    // Convert Map to array and sort by distance
    return Array.from(zipDetails.values())
        .sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));
}

// Calculate distance between two points using Haversine formula
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 3959; // Earth's radius in miles
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

// Convert degrees to radians
function toRad(degrees) {
    return degrees * (Math.PI/180);
}

// Show loading state
function showLoadingState() {
    const zipList = document.getElementById('zip-list');
    zipList.innerHTML = '<p class="placeholder-text">Loading ZIP codes...</p>';
    document.getElementById('download-btn').classList.add('hidden');
}

// Display the ZIP codes in the results panel
function displayZipCodes(zipCodes) {
    zipCodesInRadius = zipCodes; // Store results for download
    
    const zipList = document.getElementById('zip-list');
    zipList.innerHTML = '';
    
    if (zipCodes.length === 0) {
        zipList.innerHTML = '<p class="placeholder-text">No ZIP codes found within the radius</p>';
        return;
    }
    
    // Add each ZIP code to the list
    zipCodes.forEach(zip => {
        const zipItem = document.createElement('div');
        zipItem.className = 'zip-item';
        zipItem.innerHTML = `
            <strong>${zip.zipCode}</strong> - ${zip.city}, ${zip.state}
            <span>(${zip.distance} miles)</span>
        `;
        
        // Add click event to center on this ZIP
        zipItem.addEventListener('click', () => {
            map.setCenter({ lat: zip.lat, lng: zip.lng });
            map.setZoom(12);
        });
        
        zipList.appendChild(zipItem);
    });
    
    // Show download button
    document.getElementById('download-btn').classList.remove('hidden');
    
    // Add markers for each ZIP code (optional)
    addZipCodeMarkers(zipCodes);
}

// Add markers for each ZIP code on the map
function addZipCodeMarkers(zipCodes) {
    // In a real application, you might want to implement this
    // For simplicity, we're not adding markers for each ZIP code in this demo
}

// Download the ZIP codes as CSV
function downloadZipCodes() {
    if (zipCodesInRadius.length === 0) return;
    
    // Create CSV content
    let csvContent = 'ZIP Code,City,State,Distance (miles)\n';
    zipCodesInRadius.forEach(zip => {
        csvContent += `${zip.zipCode},${zip.city},${zip.state},${zip.distance}\n`;
    });
    
    // Create and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'zip_codes_in_radius.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Connect to a real ZIP code API
// In a production app, you would implement this function to connect to a real API
function connectToZipCodeAPI(location, radius) {
    // API options:
    // 1. ZIP Code API (https://www.zipcodeapi.com/)
    // 2. SmartyStreets (https://smartystreets.com/)
    // 3. Google's Geocoding API (requires additional processing)
    // 4. Census.gov API (free but requires more processing)
    
    // Implementation example:
    /*
    const apiKey = 'YOUR_API_KEY';
    const lat = location.lat();
    const lng = location.lng();
    const radiusMiles = radius;
    
    fetch(`https://www.zipcodeapi.com/rest/${apiKey}/radius.json/${lat}/${lng}/${radiusMiles}/mile`)
        .then(response => response.json())
        .then(data => {
            displayZipCodes(data.zip_codes);
        })
        .catch(error => {
            console.error('Error fetching ZIP codes:', error);
            alert('Failed to fetch ZIP codes. Please try again.');
        });
    */
}
