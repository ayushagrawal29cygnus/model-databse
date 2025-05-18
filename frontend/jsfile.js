const MOCK_BUS_DATA = [
    {
        id: 1,
        number: "42",
        route: "Downtown → Airport",
        status: "on-time",
        eta: "5 min",
        location: "2.1 km away",
        occupancy: "Medium",
        coordinates: [40.7128, -74.006]
    },
    {
        id: 2,
        number: "103",
        route: "South Side → North Station",
        status: "delayed",
        eta: "12 min",
        location: "3.7 km away",
        occupancy: "High",
        coordinates: [40.7138, -74.013]
    },
    {
        id: 3,
        number: "76",
        route: "East Park → West Terminal",
        status: "on-time",
        eta: "8 min",
        location: "1.8 km away",
        occupancy: "Low",
        coordinates: [40.7148, -74.009]
    },
    {
        id: 4,
        number: "42",
        route: "Airport → Downtown",
        status: "on-time",
        eta: "15 min",
        location: "5.2 km away",
        occupancy: "Low",
        coordinates: [40.7118, -74.015]
    },
    {
        id: 5,
        number: "29",
        route: "Central Station → University",
        status: "on-time",
        eta: "3 min",
        location: "0.9 km away",
        occupancy: "High",
        coordinates: [40.7155, -74.008]
    },
    {
        id: 6,
        number: "29",
        route: "University → Central Station",
        status: "delayed",
        eta: "18 min",
        location: "6.3 km away",
        occupancy: "Medium",
        coordinates: [40.7175, -74.022]
    },
    {
        id: 7,
        number: "55",
        route: "Harbor View → Shopping Mall",
        status: "on-time",
        eta: "7 min",
        location: "2.5 km away",
        occupancy: "Low",
        coordinates: [40.7110, -74.001]
    },
    {
        id: 8,
        number: "55",
        route: "Shopping Mall → Harbor View",
        status: "delayed",
        eta: "14 min",
        location: "4.7 km away",
        occupancy: "High",
        coordinates: [40.7095, -74.019]
    }
];

const routeNumberInput = document.getElementById('routeNumber');
const startLocationInput = document.getElementById('startLocation');
const endLocationInput = document.getElementById('endLocation');
const searchBtn = document.getElementById('searchBtn');
const resultsContainer = document.getElementById('resultsContainer');
const errorMessage = document.getElementById('errorMessage');

let map = null;
let busMarkers = [];
let activeBusCardId = null;

document.addEventListener('DOMContentLoaded', function() {
    searchBtn.addEventListener('click', handleSearch);
    
    routeNumberInput.addEventListener('input', validateInputs);
    startLocationInput.addEventListener('input', validateInputs);
    endLocationInput.addEventListener('input', validateInputs);
    
    initializeAnimations();
});

function initializeAnimations() {
    const busIllustrations = document.querySelectorAll('.bus-illustration');
    busIllustrations.forEach(illustration => {
        illustration.addEventListener('mouseenter', () => {
            illustration.style.transform = 'translateY(-10px)';
        });
        illustration.addEventListener('mouseleave', () => {
            illustration.style.transform = 'translateY(-5px)';
        });
    });
    
    animateElementsOnScroll();
}

function animateElementsOnScroll() {
    const sections = [
        document.querySelector('.welcome-section'),
        document.querySelector('.bus-illustrations'),
        document.querySelector('.how-it-works'),
        document.querySelector('.search-section')
    ];
    
    window.addEventListener('scroll', () => {
        sections.forEach(section => {
            if (isElementInViewport(section) && !section.classList.contains('animated')) {
                section.style.opacity = '0';
                section.style.transition = 'opacity 0.5s ease-in-out';
                setTimeout(() => {
                    section.style.opacity = '1';
                    section.classList.add('animated');
                }, 100);
            }
        });
    });
    
    setTimeout(() => {
        sections.forEach(section => {
            if (isElementInViewport(section) && !section.classList.contains('animated')) {
                section.style.opacity = '0';
                section.style.transition = 'opacity 0.5s ease-in-out';
                setTimeout(() => {
                    section.style.opacity = '1';
                    section.classList.add('animated');
                }, 100);
            }
        });
    }, 300);
}

function isElementInViewport(el) {
    const rect = el.getBoundingClientRect();
    return (
        rect.top <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.bottom >= 0
    );
}

function validateInputs() {
    let isValid = true;
    hideError();
    
    if (!routeNumberInput.value && !startLocationInput.value && !endLocationInput.value) {
        isValid = false;
    }
    
    searchBtn.disabled = !isValid;
    return isValid;
}

function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
    
    setTimeout(() => {
        hideError();
    }, 5000);
}

function hideError() {
    errorMessage.style.display = 'none';
}

function handleSearch() {
    if (!validateInputs()) {
        showError('Please enter at least one search criteria.');
        return;
    }
    
    showLoading();
    
    setTimeout(() => {
        const routeNumber = routeNumberInput.value.trim();
        const startLocation = startLocationInput.value.trim();
        const endLocation = endLocationInput.value.trim();
        
        let filteredResults = MOCK_BUS_DATA;
        
        if (routeNumber) {
            filteredResults = filteredResults.filter(bus => 
                bus.number.toLowerCase() === routeNumber.toLowerCase()
            );
        }
        
        if (startLocation && endLocation) {
            filteredResults = filteredResults.filter(bus => 
                bus.route.toLowerCase().includes(startLocation.toLowerCase()) &&
                bus.route.toLowerCase().includes(endLocation.toLowerCase())
            );
        } else if (startLocation) {
            filteredResults = filteredResults.filter(bus => 
                bus.route.toLowerCase().includes(startLocation.toLowerCase())
            );
        } else if (endLocation) {
            filteredResults = filteredResults.filter(bus => 
                bus.route.toLowerCase().includes(endLocation.toLowerCase())
            );
        }
        
        displayResults(filteredResults);
    }, 1500);
}

function showLoading() {
    resultsContainer.innerHTML = `
        <div class="loading">
            <div class="loading-spinner"></div>
        </div>
    `;
}

function displayResults(buses) {
    if (buses.length === 0) {
        resultsContainer.innerHTML = `
            <div class="no-results">
                <h3>No buses found</h3>
                <p>Please try different search criteria.</p>
            </div>
        `;
        return;
    }
    
    resultsContainer.innerHTML = '';
    
    buses.forEach(bus => {
        const busCard = document.createElement('div');
        busCard.classList.add('bus-card');
        busCard.dataset.busId = bus.id;
        
        busCard.innerHTML = `
            <div class="bus-info">
                <div>
                    <div class="bus-number">Bus ${bus.number}</div>
                    <div class="bus-route">${bus.route}</div>
                </div>
                <div class="bus-status">
                    <div class="status-item">
                        <div class="status-label">Status</div>
                        <div class="status-value ${bus.status}">${bus.status === 'on-time' ? 'On Time' : 'Delayed'}</div>
                    </div>
                    <div class="status-item">
                        <div class="status-label">ETA</div>
                        <div class="status-value">${bus.eta}</div>
                    </div>
                    <div class="status-item">
                        <div class="status-label">Location</div>
                        <div class="status-value">${bus.location}</div>
                    </div>
                    <div class="status-item">
                        <div class="status-label">Occupancy</div>
                        <div class="status-value">${bus.occupancy}</div>
                    </div>
                </div>
            </div>
            <div class="map-container" id="map-${bus.id}"></div>
        `;
        
        busCard.addEventListener('click', function() {
            const busId = this.dataset.busId;
            toggleBusMap(busId, bus);
        });
        
        resultsContainer.appendChild(busCard);
    });
}

function toggleBusMap(busId, busData) {
    const mapContainer = document.getElementById(`map-${busId}`);
    
    if (activeBusCardId && activeBusCardId !== busId) {
        const activeMapContainer = document.getElementById(`map-${activeBusCardId}`);
        if (activeMapContainer) {
            activeMapContainer.style.display = 'none';
        }
    }
    
    if (mapContainer.style.display === 'block') {
        mapContainer.style.display = 'none';
        activeBusCardId = null;
    } else {
        mapContainer.style.display = 'block';
        activeBusCardId = busId;
        initializeMap(mapContainer, busData);
    }
}

function initializeMap(container, busData) {
    if (map) {
        map.remove();
    }
    
    map = L.map(container).setView(busData.coordinates, 13);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);
    
    const busIcon = L.divIcon({
        html: `<div style="background-color: #3494e6; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white;"></div>`,
        className: 'bus-marker',
        iconSize: [20, 20]
    });
    
    const marker = L.marker(busData.coordinates, { icon: busIcon }).addTo(map);
    marker.bindPopup(`<b>Bus ${busData.number}</b><br>${busData.route}`).openPopup();
    
    simulateBusMovement(marker, busData);
    
    setTimeout(() => {
        map.invalidateSize();
    }, 100);
}

function simulateBusMovement(marker, busData) {
    setInterval(() => {
        if (map && marker) {
            const lat = busData.coordinates[0] + (Math.random() - 0.5) * 0.001;
            const lng = busData.coordinates[1] + (Math.random() - 0.5) * 0.001;
            
            marker.setLatLng([lat, lng]);
            
            busData.coordinates = [lat, lng];
        }
    }, 3000);
}

const formInputs = document.querySelectorAll('input');
formInputs.forEach(input => {
    input.addEventListener('focus', function() {
        this.parentElement.style.boxShadow = '0 0 0 2px rgba(52, 148, 230, 0.2)';
    });
    
    input.addEventListener('blur', function() {
        this.parentElement.style.boxShadow = 'none';
    });
});

validateInputs();