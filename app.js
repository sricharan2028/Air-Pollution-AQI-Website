// ==========================================================================
//  Breathe — Air Quality Intelligence | app.js
// ==========================================================================

// --------------------------------------------------------------------------
// DOM Elements
// --------------------------------------------------------------------------
const searchInput    = document.getElementById('searchInput');
const clearSearchBtn = document.getElementById('clearSearch');
const suggestionsList = document.getElementById('suggestionsList');
const searchLoader   = document.getElementById('searchLoader');

const mainContent = document.getElementById('mainContent');
const emptyState  = document.getElementById('emptyState');
const errorState  = document.getElementById('errorState');
const backBtn     = document.getElementById('backBtn');
const retryBtn    = document.getElementById('retryBtn');

const cityNameEl  = document.getElementById('cityName');
const timestampEl = document.getElementById('timestamp');

const aqiValueEl      = document.getElementById('aqiValue');
const aqiStatusEl     = document.getElementById('aqiStatus');
const aqiMessageEl    = document.getElementById('aqiMessage');
const aqiStatusBadge  = document.getElementById('aqiStatusBadge');
const aqiRing         = document.getElementById('aqiRing');

// Pollutant value elements
const pm25ValueEl = document.getElementById('pm25Value');
const pm10ValueEl = document.getElementById('pm10Value');
const no2ValueEl  = document.getElementById('no2Value');
const o3ValueEl   = document.getElementById('o3Value');
const so2ValueEl  = document.getElementById('so2Value');
const coValueEl   = document.getElementById('coValue');

// Pollutant bar elements
const pm25Bar = document.getElementById('pm25Bar');
const pm10Bar = document.getElementById('pm10Bar');
const no2Bar  = document.getElementById('no2Bar');
const o3Bar   = document.getElementById('o3Bar');
const so2Bar  = document.getElementById('so2Bar');
const coBar   = document.getElementById('coBar');

// Share / Bookmark
const shareBtn    = document.getElementById('shareBtn');
const bookmarkBtn = document.getElementById('bookmarkBtn');

// --------------------------------------------------------------------------
// State
// --------------------------------------------------------------------------
let searchTimeout   = null;
let lastSearchedCity = null;  // { lat, lon, name }
let savedLocations  = JSON.parse(localStorage.getItem('breathe_saved') || '[]');

// Pollutant WHO safe thresholds (µg/m³) used for bar scaling
const POLLUTANT_MAX = {
  pm2_5:            250,
  pm10:             430,
  nitrogen_dioxide: 400,
  ozone:            240,
  sulphur_dioxide:  500,
  carbon_monoxide:  30000
};

// Global hotspot cities
const HOTSPOT_CITIES = [
  { name: 'Delhi',    country: 'India',          lat: 28.6139, lon: 77.2090 },
  { name: 'Beijing',  country: 'China',          lat: 39.9042, lon: 116.4074 },
  { name: 'Lahore',   country: 'Pakistan',       lat: 31.5204, lon: 74.3587 },
  { name: 'Jakarta',  country: 'Indonesia',      lat: -6.2088, lon: 106.8456 },
  { name: 'Cairo',    country: 'Egypt',          lat: 30.0444, lon: 31.2357 },
  { name: 'London',   country: 'United Kingdom', lat: 51.5074, lon: -0.1278 },
  { name: 'New York', country: 'United States',  lat: 40.7128, lon: -74.0060 },
  { name: 'Sydney',   country: 'Australia',      lat: -33.8688, lon: 151.2093 },
];

// --------------------------------------------------------------------------
// AQI Ring Setup
// --------------------------------------------------------------------------
const RING_RADIUS = 100;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;
if (aqiRing) {
  aqiRing.style.strokeDasharray  = `${RING_CIRCUMFERENCE}`;
  aqiRing.style.strokeDashoffset = `${RING_CIRCUMFERENCE}`;
}

// --------------------------------------------------------------------------
// Event Listeners
// --------------------------------------------------------------------------
searchInput.addEventListener('input', handleSearchInput);
clearSearchBtn.addEventListener('click', clearSearch);
document.addEventListener('click', closeSuggestionsOnClickOutside);
backBtn.addEventListener('click', goHome);
retryBtn.addEventListener('click', () => {
  if (lastSearchedCity) {
    fetchAirQualityData(lastSearchedCity.lat, lastSearchedCity.lon, lastSearchedCity.name);
  }
});
shareBtn.addEventListener('click', handleShare);
bookmarkBtn.addEventListener('click', handleBookmark);

// Active nav link highlighting
document.querySelectorAll('.nav-links a').forEach(link => {
  if (link.href === window.location.href) link.classList.add('active');
});

// --------------------------------------------------------------------------
// Initialisation
// --------------------------------------------------------------------------
window.addEventListener('DOMContentLoaded', () => {
  initHotspots();
  updateBookmarkBtn();
});

// --------------------------------------------------------------------------
// Hotspot Cards
// --------------------------------------------------------------------------
async function initHotspots() {
  const grid = document.getElementById('hotspotsGrid');
  if (!grid) return;

  // Fetch AQI for all cities concurrently
  const results = await Promise.allSettled(
    HOTSPOT_CITIES.map(city =>
      fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${city.lat}&longitude=${city.lon}&current=us_aqi&timezone=auto`)
        .then(r => r.json())
        .then(data => ({ ...city, aqi: Math.round(data.current?.us_aqi ?? 0) }))
    )
  );

  grid.innerHTML = '';

  results.forEach((result, i) => {
    const city = result.status === 'fulfilled' ? result.value : { ...HOTSPOT_CITIES[i], aqi: null };
    const info = city.aqi !== null ? getAQIInfo(city.aqi) : { status: 'Unknown', theme: 'default' };
    const colorVar = `var(--color-${info.theme === 'default' ? 'moderate' : info.theme})`;

    const card = document.createElement('div');
    card.className = 'hotspot-card glass-panel';
    card.innerHTML = `
      <div class="hotspot-header">
        <div>
          <div class="hotspot-city">${city.name}</div>
          <div class="hotspot-country">${city.country}</div>
        </div>
        <span class="hotspot-badge" style="background:${colorVar}1a; color:${colorVar}; border:1px solid ${colorVar}40">${info.status}</span>
      </div>
      <div class="hotspot-aqi">
        <span class="hotspot-aqi-val" style="color:${colorVar}">${city.aqi ?? '--'}</span>
        <span class="hotspot-aqi-unit">AQI</span>
      </div>
      <div class="hotspot-bar">
        <div class="hotspot-bar-fill" style="width:${city.aqi ? Math.min((city.aqi / 500) * 100, 100) : 0}%; background:${colorVar}"></div>
      </div>
    `;
    card.addEventListener('click', () => {
      searchInput.value = city.name;
      fetchAirQualityData(city.lat, city.lon, `${city.name}, ${city.country}`);
    });
    grid.appendChild(card);
  });
}

// --------------------------------------------------------------------------
// Search / Suggestions
// --------------------------------------------------------------------------
function handleSearchInput(e) {
  const query = e.target.value.trim();
  if (query.length > 0) {
    clearSearchBtn.classList.remove('hidden');
  } else {
    clearSearchBtn.classList.add('hidden');
    hideSuggestions();
    return;
  }
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    if (query.length >= 2) fetchCitySuggestions(query);
  }, 400);
}

function clearSearch() {
  searchInput.value = '';
  clearSearchBtn.classList.add('hidden');
  hideSuggestions();
  searchInput.focus();
}

function hideSuggestions() {
  suggestionsList.classList.add('hidden');
  suggestionsList.innerHTML = '';
}

function closeSuggestionsOnClickOutside(e) {
  if (!searchInput.contains(e.target) && !suggestionsList.contains(e.target)) {
    hideSuggestions();
  }
}

async function fetchCitySuggestions(query) {
  try {
    searchLoader.classList.remove('hidden');
    const response = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=6&language=en&format=json`
    );
    if (!response.ok) throw new Error('Failed to fetch cities');
    const data = await response.json();
    renderSuggestions(data.results || []);
  } catch (error) {
    console.error('Error fetching suggestions:', error);
  } finally {
    searchLoader.classList.add('hidden');
  }
}

function renderSuggestions(results) {
  suggestionsList.innerHTML = '';
  if (results.length === 0) {
    const li = document.createElement('li');
    li.innerHTML = `<span class="suggestion-text no-results">No locations found</span>`;
    suggestionsList.appendChild(li);
  } else {
    results.forEach(city => {
      const li = document.createElement('li');
      const parts = [city.name];
      if (city.admin1 && city.admin1 !== city.name) parts.push(city.admin1);
      if (city.country) parts.push(city.country);
      const locationName = parts.join(', ');

      li.innerHTML = `
        <i class="ph ph-map-pin suggestion-icon"></i>
        <div class="suggestion-text">
          <span class="suggestion-name">${city.name}</span>
          <span class="suggestion-country">${city.admin1 ? city.admin1 + ', ' : ''}${city.country || ''}</span>
        </div>
        <i class="ph ph-arrow-up-left suggestion-arrow"></i>
      `;
      li.addEventListener('click', () => {
        searchInput.value = city.name;
        hideSuggestions();
        fetchAirQualityData(city.latitude, city.longitude, locationName);
      });
      suggestionsList.appendChild(li);
    });
  }
  suggestionsList.classList.remove('hidden');
}

// --------------------------------------------------------------------------
// Air Quality Data Fetch
// --------------------------------------------------------------------------
async function fetchAirQualityData(lat, lon, locationName) {
  lastSearchedCity = { lat, lon, name: locationName };

  mainContent.classList.add('hidden');
  emptyState.classList.add('hidden');
  errorState.classList.add('hidden');
  searchLoader.classList.remove('hidden');

  try {
    const params = new URLSearchParams({
      latitude:  lat,
      longitude: lon,
      current:   'us_aqi,pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone',
      timezone:  'auto'
    });
    const response = await fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?${params.toString()}`);
    if (!response.ok) throw new Error('Failed to fetch air quality data');
    const data = await response.json();
    updateUI(data.current, locationName);
  } catch (error) {
    console.error('Error fetching air quality:', error);
    document.getElementById('errorTitle').textContent   = 'Data Unavailable';
    document.getElementById('errorMessage').textContent = 'Could not load air quality data for this location. Please try again.';
    errorState.classList.remove('hidden');
  } finally {
    searchLoader.classList.add('hidden');
  }
}

// --------------------------------------------------------------------------
// UI Update
// --------------------------------------------------------------------------
function updateUI(currentData, locationName) {
  // Location & timestamp
  cityNameEl.textContent = locationName;
  const date = new Date(currentData.time);
  const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const dateStr = date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  timestampEl.textContent = `Last updated: ${dateStr}, ${timeStr} (Local Time)`;

  // AQI
  const aqi = Math.round(currentData.us_aqi ?? 0);
  aqiValueEl.textContent = aqi;

  const aqiInfo = getAQIInfo(aqi);
  aqiStatusEl.textContent       = aqiInfo.status;
  aqiMessageEl.textContent      = aqiInfo.message;
  aqiStatusBadge.textContent    = aqiInfo.status;
  aqiStatusBadge.style.background = `var(--color-${aqiInfo.theme === 'default' ? 'moderate' : aqiInfo.theme})`;

  // Apply theme to body
  document.body.className = `theme-${aqiInfo.theme}`;

  // Animate ring
  animateAQIRing(aqi);

  // Pollutants
  const pollutants = [
    { el: pm25ValueEl, bar: pm25Bar, key: 'pm2_5',            max: POLLUTANT_MAX.pm2_5 },
    { el: pm10ValueEl, bar: pm10Bar, key: 'pm10',             max: POLLUTANT_MAX.pm10 },
    { el: no2ValueEl,  bar: no2Bar,  key: 'nitrogen_dioxide', max: POLLUTANT_MAX.nitrogen_dioxide },
    { el: o3ValueEl,   bar: o3Bar,   key: 'ozone',            max: POLLUTANT_MAX.ozone },
    { el: so2ValueEl,  bar: so2Bar,  key: 'sulphur_dioxide',  max: POLLUTANT_MAX.sulphur_dioxide },
    { el: coValueEl,   bar: coBar,   key: 'carbon_monoxide',  max: POLLUTANT_MAX.carbon_monoxide },
  ];

  pollutants.forEach(({ el, bar, key, max }) => {
    const val = currentData[key];
    updatePollutantValue(el, val);
    updatePollutantBar(bar, val, max);
  });

  // Bookmark button state
  updateBookmarkBtn();

  // Show content with animation
  mainContent.classList.remove('hidden');

  // Scroll to content
  mainContent.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function animateAQIRing(aqi) {
  if (!aqiRing) return;
  // AQI 0–500 → fill 0–100%
  const pct    = Math.min(aqi / 500, 1);
  const offset = RING_CIRCUMFERENCE - pct * RING_CIRCUMFERENCE;
  // Use RAF to allow transition to play
  requestAnimationFrame(() => {
    aqiRing.style.strokeDashoffset = offset;
  });
}

function updatePollutantValue(element, value) {
  if (value === undefined || value === null) {
    element.textContent = '--';
  } else {
    element.textContent = Number.isInteger(value) ? value : value.toFixed(1);
  }
}

function updatePollutantBar(barEl, value, max) {
  if (!barEl) return;
  const pct = value != null ? Math.min((value / max) * 100, 100) : 0;
  barEl.style.width = `${pct}%`;
}

// --------------------------------------------------------------------------
// Navigation
// --------------------------------------------------------------------------
function goHome() {
  mainContent.classList.add('hidden');
  errorState.classList.add('hidden');
  emptyState.classList.remove('hidden');
  document.body.className = 'theme-default';
  searchInput.value = '';
  clearSearchBtn.classList.add('hidden');
  // Reset ring
  if (aqiRing) aqiRing.style.strokeDashoffset = RING_CIRCUMFERENCE;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// --------------------------------------------------------------------------
// Share
// --------------------------------------------------------------------------
async function handleShare() {
  if (!lastSearchedCity) return;
  const shareData = {
    title: `Air Quality in ${lastSearchedCity.name} | Breathe`,
    text:  `Check the live AQI for ${lastSearchedCity.name} on Breathe – Real-time Air Quality Intelligence.`,
    url:   window.location.href
  };
  try {
    if (navigator.share) {
      await navigator.share(shareData);
    } else {
      await navigator.clipboard.writeText(`${shareData.text}\n${shareData.url}`);
      showToast('📋 Link copied to clipboard!');
    }
  } catch (err) {
    console.error('Share failed:', err);
  }
}

// --------------------------------------------------------------------------
// Bookmark / Save Location
// --------------------------------------------------------------------------
function handleBookmark() {
  if (!lastSearchedCity) return;
  const { name, lat, lon } = lastSearchedCity;
  const idx = savedLocations.findIndex(l => l.name === name);
  if (idx >= 0) {
    savedLocations.splice(idx, 1);
    showToast('🗑️ Location removed from saved.');
  } else {
    savedLocations.push({ name, lat, lon });
    showToast('🔖 Location saved!');
  }
  localStorage.setItem('breathe_saved', JSON.stringify(savedLocations));
  updateBookmarkBtn();
}

function updateBookmarkBtn() {
  if (!bookmarkBtn || !lastSearchedCity) return;
  const isSaved = savedLocations.some(l => l.name === lastSearchedCity?.name);
  const icon = bookmarkBtn.querySelector('i');
  if (icon) {
    icon.className = isSaved ? 'ph ph-bookmark-simple-fill' : 'ph ph-bookmark-simple';
  }
  bookmarkBtn.title = isSaved ? 'Remove saved location' : 'Save location';
}

// --------------------------------------------------------------------------
// Toast Notification
// --------------------------------------------------------------------------
function showToast(message) {
  let toast = document.getElementById('toastNotification');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toastNotification';
    toast.className = 'toast-notification';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add('toast-show');
  setTimeout(() => toast.classList.remove('toast-show'), 3000);
}

// --------------------------------------------------------------------------
// AQI Info Helper
// --------------------------------------------------------------------------
function getAQIInfo(aqi) {
  if (aqi <= 50)  return { status: 'Good',                        message: 'Air quality is satisfactory, and air pollution poses little or no risk.',                                                                             theme: 'good' };
  if (aqi <= 100) return { status: 'Moderate',                    message: 'Air quality is acceptable. However, there may be a risk for some people, particularly those who are unusually sensitive to air pollution.',           theme: 'moderate' };
  if (aqi <= 150) return { status: 'Unhealthy for Sensitive Groups', message: 'Members of sensitive groups may experience health effects. The general public is not likely to be affected.',                                       theme: 'sensitive' };
  if (aqi <= 200) return { status: 'Unhealthy',                   message: 'Some members of the general public may experience health effects; members of sensitive groups may experience more serious health effects.',            theme: 'unhealthy' };
  if (aqi <= 300) return { status: 'Very Unhealthy',              message: 'Health alert: The risk of health effects is increased for everyone.',                                                                                   theme: 'very-unhealthy' };
  return            { status: 'Hazardous',                        message: 'Health warning of emergency conditions: everyone is more likely to be affected.',                                                                       theme: 'hazardous' };
}
