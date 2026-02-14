// Initialize the map
const map = L.map('map').setView([20, 10], 2);

// Add OpenStreetMap tiles
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19
}).addTo(map);

// Store markers for filtering
let markers = [];
let pinsData = [];
let currentFilter = 'all';

// Custom icons for different pin types
const memoryIcon = L.divIcon({
    className: 'custom-marker',
    html: '<div style="background: #ff6b9d; width: 30px; height: 30px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>',
    iconSize: [30, 30],
    iconAnchor: [15, 15]
});

const dreamIcon = L.divIcon({
    className: 'custom-marker',
    html: '<div style="background: #9b59b6; width: 30px; height: 30px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>',
    iconSize: [30, 30],
    iconAnchor: [15, 15]
});

// Load pins from JSON + merge any saved in localStorage
async function loadPins() {
    try {
        const response = await fetch('pins.json');
        pinsData = await response.json();
    } catch (error) {
        console.error('Error loading pins:', error);
        pinsData = [];
    }
    // merge localStorage pins (added via the form)
    try {
        const saved = JSON.parse(localStorage.getItem('userPins') || '[]');
        if (saved.length > 0) {
            const existingIds = new Set(pinsData.map(p => p.id));
            saved.forEach(p => {
                p._userAdded = true; // keep flag so they get re-saved
                if (!existingIds.has(p.id)) pinsData.push(p);
            });
        }
    } catch (e) {
        console.warn('Could not load saved pins from localStorage', e);
    }
    displayPins(pinsData);
}

// Display pins on the map
function displayPins(pins) {
    // Clear existing markers
    markers.forEach(marker => map.removeLayer(marker));
    markers = [];

    // Filter pins based on current filter
    const filteredPins = currentFilter === 'all' 
        ? pins 
        : pins.filter(pin => pin.type === currentFilter);

    // Add markers for each pin
    filteredPins.forEach(pin => {
        const icon = pin.type === 'memory' ? memoryIcon : dreamIcon;
        const marker = L.marker([pin.lat, pin.lng], { icon: icon }).addTo(map);

        // Create popup content
        const popupContent = `
            <div class="popup-content">
                <h3>${pin.title}</h3>
                <p>${pin.location}</p>
                <a href="#" class="popup-link" onclick="openModal(${pin.id}); return false;">
                    View ${pin.type === 'memory' ? 'Memory' : 'Dream'} ✨
                </a>
            </div>
        `;

        marker.bindPopup(popupContent);
        markers.push(marker);
    });
}

// Open modal with pin details
function openModal(pinId) {
    const pin = pinsData.find(p => p.id === pinId);
    if (!pin) return;

    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modal-title');
    const modalLocation = document.getElementById('modal-location');
    const modalMedia = document.getElementById('modal-media');
    const modalDescription = document.getElementById('modal-description');
    const modalDate = document.getElementById('modal-date');

    // Set content
    modalTitle.textContent = pin.title;
    // show full display name in modal when available, otherwise short
    modalLocation.textContent = pin.location_full || pin.location;
    modalDescription.textContent = pin.description;
    modalDate.textContent = pin.date || '';

    // Handle media: render as a slideshow/gallery with thumbnails
    modalMedia.innerHTML = '';
    if (pin.media && pin.media.length > 0) {
        renderMediaGallery(pin.media, pin.title);
    }

    // Show modal
    modal.classList.add('show');
}

// Slideshow / gallery helpers
let galleryState = {
    mediaList: [],
    currentIndex: 0
};

function renderMediaGallery(mediaList, title) {
    galleryState.mediaList = mediaList;
    galleryState.currentIndex = 0;

    // main gallery container
    const gallery = document.createElement('div');
    gallery.className = 'gallery';

    const main = document.createElement('div');
    main.className = 'gallery-main';

    const leftNav = document.createElement('div');
    leftNav.className = 'gallery-nav left';
    leftNav.innerHTML = '&#8249;';
    leftNav.addEventListener('click', () => showMediaAt(galleryState.currentIndex - 1));

    const rightNav = document.createElement('div');
    rightNav.className = 'gallery-nav right';
    rightNav.innerHTML = '&#8250;';
    rightNav.addEventListener('click', () => showMediaAt(galleryState.currentIndex + 1));

    main.appendChild(leftNav);
    main.appendChild(rightNav);

    const mainHolder = document.createElement('div');
    mainHolder.className = 'gallery-main-holder';
    main.appendChild(mainHolder);

    gallery.appendChild(main);

    // thumbnails row
    const thumbRow = document.createElement('div');
    thumbRow.className = 'thumb-row';
    mediaList.forEach((m, idx) => {
        let thumb;
        if (m.type === 'image') {
            thumb = document.createElement('img');
            thumb.src = m.url;
            thumb.alt = title || '';
        } else if (m.type === 'video') {
            thumb = document.createElement('video');
            thumb.src = m.url;
        } else {
            thumb = document.createElement('img');
            thumb.src = m.url;
        }
        thumb.addEventListener('click', () => showMediaAt(idx));
        thumbRow.appendChild(thumb);
    });

    gallery.appendChild(thumbRow);

    // attach to modal media container
    const modalMedia = document.getElementById('modal-media');
    modalMedia.appendChild(gallery);

    // show first item
    showMediaAt(0);

    // keyboard navigation when modal open
    function onKey(e) {
        if (!document.getElementById('modal').classList.contains('show')) return;
        if (e.key === 'ArrowLeft') showMediaAt(galleryState.currentIndex - 1);
        if (e.key === 'ArrowRight') showMediaAt(galleryState.currentIndex + 1);
    }
    document.addEventListener('keydown', onKey);
    // store reference so we can remove if needed
    galleryState._onKey = onKey;
}

function showMediaAt(index) {
    const list = galleryState.mediaList;
    if (!list || list.length === 0) return;
    if (index < 0) index = list.length - 1;
    if (index >= list.length) index = 0;
    galleryState.currentIndex = index;

    const modalMedia = document.getElementById('modal-media');
    const mainHolder = modalMedia.querySelector('.gallery-main-holder');
    const thumbRow = modalMedia.querySelector('.thumb-row');

    // clear mainHolder
    mainHolder.innerHTML = '';

    const m = list[index];
    if (m.type === 'image') {
        const img = document.createElement('img');
        img.src = m.url;
        img.alt = '';
        img.style.cursor = 'zoom-in';
        img.addEventListener('click', () => openMediaOverlay(m.url));
        mainHolder.appendChild(img);
    } else if (m.type === 'video') {
        const video = document.createElement('video');
        video.src = m.url;
        video.controls = true;
        video.style.maxHeight = '60vh';
        mainHolder.appendChild(video);
    } else if (m.type === 'audio') {
        const audio = document.createElement('audio');
        audio.src = m.url;
        audio.controls = true;
        mainHolder.appendChild(audio);
    }

    // update thumbs active
    if (thumbRow) {
        const thumbs = Array.from(thumbRow.children);
        thumbs.forEach((t, i) => {
            if (i === index) t.classList.add('active-thumb');
            else t.classList.remove('active-thumb');
        });
    }
}

// Close modal
function closeModal() {
    const modal = document.getElementById('modal');
    modal.classList.remove('show');
    // remove gallery keyboard listener if set
    if (galleryState && galleryState._onKey) {
        document.removeEventListener('keydown', galleryState._onKey);
        delete galleryState._onKey;
    }
}

// Filter button handlers
document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        // Update active state
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // Update filter and redisplay pins
        currentFilter = btn.dataset.filter;
        displayPins(pinsData);
    });
});

// Modal close handlers
document.querySelector('.modal-close').addEventListener('click', closeModal);
document.getElementById('modal').addEventListener('click', (e) => {
    if (e.target.id === 'modal') {
        closeModal();
    }
});

// Escape key to close modal
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeModal();
    }
});

// Initialize
loadPins();

// --- Add-pin modal and media overlay logic ---

const addBtn = document.getElementById('add-btn');
const addModal = document.getElementById('add-modal');
const addForm = document.getElementById('add-form');
const addCloseButtons = document.querySelectorAll('.add-close');
const mediaOverlay = document.getElementById('media-overlay');
const mediaOverlayImg = document.getElementById('media-overlay-img');
const mediaOverlayClose = document.getElementById('media-overlay-close');

function openAddModal() {
    addModal.classList.add('show');
}

function closeAddModal() {
    addModal.classList.remove('show');
    addForm.reset();
}

addBtn.addEventListener('click', openAddModal);
addCloseButtons.forEach(btn => btn.addEventListener('click', closeAddModal));

addModal.addEventListener('click', (e) => {
    if (e.target.id === 'add-modal') closeAddModal();
});

addForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const type = document.getElementById('add-type').value;
    const title = document.getElementById('add-title').value.trim();
    // prefer the selected location short name if user picked a search result
    const selElem = document.getElementById('selected-location');
    const selectedShort = selElem && selElem.dataset && selElem.dataset.displayNameShort;
    const selectedFull = selElem && selElem.dataset && selElem.dataset.displayNameFull;
    const location = (selectedShort && selectedShort.length > 0)
        ? selectedShort
        : document.getElementById('add-location').value.trim();
    const latVal = document.getElementById('add-lat').value;
    const lngVal = document.getElementById('add-lng').value;
    const date = document.getElementById('add-date').value.trim();
    const description = document.getElementById('add-description').value.trim();
    const fileInput = document.getElementById('add-media-files');

    if (!title) {
        alert('Please provide a title.');
        return;
    }

    if (!latVal || !lngVal) {
        alert('Please search for and select a location from the results.');
        return;
    }

    const lat = parseFloat(latVal);
    const lng = parseFloat(lngVal);

    // read files (if any) as data URLs
    const files = fileInput.files ? Array.from(fileInput.files) : [];
    const media = await Promise.all(files.map(readFileAsMedia));

    const newId = pinsData.length > 0 ? Math.max(...pinsData.map(p => p.id)) + 1 : 1;

    const newPin = {
        id: newId,
        type,
        title,
        location,
        location_full: selectedFull || '',
        lat,
        lng,
        description,
        date,
        media,
        _userAdded: true
    };

    pinsData.push(newPin);

    // persist user-added pins to localStorage so they survive reload
    saveUserPins();

    displayPins(pinsData);
    closeAddModal();

    // center map and open popup for the new pin
    const icon = newPin.type === 'memory' ? memoryIcon : dreamIcon;
    const marker = L.marker([newPin.lat, newPin.lng], { icon: icon }).addTo(map);
    markers.push(marker);
    map.setView([newPin.lat, newPin.lng], 6);
});

function readFileAsMedia(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const url = reader.result;
            const mime = file.type || '';
            let type = 'image';
            if (mime.startsWith('video/')) type = 'video';
            else if (mime.startsWith('audio/')) type = 'audio';
            resolve({ type, url });
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
    });
}

// --- location search using Nominatim ---
const locResults = document.getElementById('loc-results');

// Debounce helper so we don't hammer the Nominatim API while typing
function debounce(fn, wait) {
    let t;
    return (...args) => {
        clearTimeout(t);
        t = setTimeout(() => fn(...args), wait);
    };
}

// Live search as user types (debounced)
const locInput = document.getElementById('add-location');
const debouncedSearch = debounce((q) => {
    if (q.length < 2) {
        locResults.innerHTML = '';
        return;
    }
    searchLocation(q);
}, 300);

locInput.addEventListener('input', (e) => {
    // clear any previously selected item when editing
    const sel = document.getElementById('selected-location');
    if (sel && sel.style.display === 'block') {
        sel.style.display = 'none';
        document.getElementById('selected-location-name').textContent = '';
        document.getElementById('add-lat').value = '';
        document.getElementById('add-lng').value = '';
    }
    debouncedSearch(e.target.value.trim());
});

// Keyboard navigation in results
let locActiveIndex = -1;
locInput.addEventListener('keydown', (e) => {
    const items = locResults.querySelectorAll('.loc-result-item');
    if (!items || items.length === 0) return;
    if (e.key === 'ArrowDown') {
        e.preventDefault();
        locActiveIndex = Math.min(locActiveIndex + 1, items.length - 1);
        updateLocActive(items);
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        locActiveIndex = Math.max(locActiveIndex - 1, 0);
        updateLocActive(items);
    } else if (e.key === 'Enter') {
        // if a result is highlighted, pick it
        if (locActiveIndex >= 0 && locActiveIndex < items.length) {
            e.preventDefault();
            items[locActiveIndex].click();
        }
    } else {
        locActiveIndex = -1;
    }
});

function updateLocActive(items) {
    items.forEach((it, i) => {
        if (i === locActiveIndex) it.classList.add('active');
        else it.classList.remove('active');
    });
    // ensure the active item is visible
    const active = locResults.querySelector('.loc-result-item.active');
    if (active) active.scrollIntoView({ block: 'nearest' });
}

async function searchLocation(query) {
    locResults.innerHTML = '<div class="loc-result-item">Searching…</div>';
    try {
        // Nominatim public API - keep requests reasonable
        const url = `https://nominatim.openstreetmap.org/search?format=json&limit=6&q=${encodeURIComponent(query)}`;
        const res = await fetch(url, {
            headers: {
                'Accept-Language': 'en'
            }
        });
        const data = await res.json();
        if (!Array.isArray(data) || data.length === 0) {
            locResults.innerHTML = '<div class="loc-result-item">No results</div>';
            return;
        }
        locResults.innerHTML = '';
        data.forEach(item => {
            const div = document.createElement('div');
            div.className = 'loc-result-item';
            div.textContent = item.display_name;
            div.tabIndex = 0;
            // mouseover sets active index for keyboard UX
            div.addEventListener('mouseover', () => {
                const items = Array.from(locResults.querySelectorAll('.loc-result-item'));
                locActiveIndex = items.indexOf(div);
                updateLocActive(items);
            });
            div.addEventListener('click', () => selectLocationResult(item));
            locResults.appendChild(div);
        });
        // reset keyboard index
        locActiveIndex = -1;
    } catch (err) {
        locResults.innerHTML = '<div class="loc-result-item">Error searching</div>';
        console.error('Location search error', err);
    }
}

function selectLocationResult(item) {
    // Do not overwrite the user's search input. Show the chosen display name (short) and store coords.
    const sel = document.getElementById('selected-location');
    const selName = document.getElementById('selected-location-name');
    const full = item.display_name;
    const short = (item.display_name || '').split(',')[0];
    sel.dataset.displayNameFull = full;
    sel.dataset.displayNameShort = short;
    sel.dataset.lat = item.lat;
    sel.dataset.lng = item.lon;
    selName.textContent = short;
    selName.title = full; // hover shows full
    sel.style.display = 'block';

    document.getElementById('add-lat').value = item.lat;
    document.getElementById('add-lng').value = item.lon;

    locResults.innerHTML = '';
}

// clear selection and allow editing the search input again
const clearSelectionBtn = document.getElementById('clear-selection');
clearSelectionBtn.addEventListener('click', () => {
    const sel = document.getElementById('selected-location');
    const selName = document.getElementById('selected-location-name');
    sel.style.display = 'none';
    selName.textContent = '';
    delete sel.dataset.displayNameFull;
    delete sel.dataset.displayNameShort;
    delete sel.dataset.lat;
    delete sel.dataset.lng;
    document.getElementById('add-lat').value = '';
    document.getElementById('add-lng').value = '';
    document.getElementById('add-location').focus();
});

// allow Enter to trigger a search in the location input (fallback)
document.getElementById('add-location').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        const q = document.getElementById('add-location').value.trim();
        if (q) searchLocation(q);
    }
});

function openMediaOverlay(url) {
    mediaOverlayImg.src = url;
    mediaOverlay.style.display = 'flex';
}

function closeMediaOverlay() {
    mediaOverlay.style.display = 'none';
    mediaOverlayImg.src = '';
}

mediaOverlayClose.addEventListener('click', closeMediaOverlay);
mediaOverlay.addEventListener('click', (e) => {
    if (e.target.id === 'media-overlay') closeMediaOverlay();
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeMediaOverlay();
    }
});

// --- localStorage persistence ---
// Save only user-added pins (those not in pins.json originally)
function saveUserPins() {
    try {
        // user-added pins have ids higher than anything from the original fetch
        // simplest approach: save everything that's not in the original JSON
        // We'll just save pins whose id > 100 or those added this session
        // Better: just save all pinsData and reload from localStorage on next load
        localStorage.setItem('userPins', JSON.stringify(
            pinsData.filter(p => p._userAdded)
        ));
    } catch (e) {
        console.warn('Could not save pins to localStorage', e);
    }
}

// --- Export pins as downloadable JSON ---
function exportPins() {
    const data = JSON.stringify(pinsData, null, 4);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pins.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// wire up export button
const exportBtn = document.getElementById('export-btn');
if (exportBtn) exportBtn.addEventListener('click', exportPins);

// ===============================================
// "Where are we?" — Dual-location distance feature
// ===============================================

let floMarker = null;
let mariaMarker = null;
let distanceLine = null;

const locateBtn = document.getElementById('locate-btn');
const whoModal = document.getElementById('who-modal');

// Two different coloured pulsing markers
function makePersonIcon(color, rgbaColor) {
    return L.divIcon({
        className: 'custom-marker',
        html: `<div class="you-marker-dot">
                   <div class="dot-pulse" style="background:${rgbaColor};"></div>
                   <div class="dot-core" style="background:${color};"></div>
               </div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 15]
    });
}

const floIcon = makePersonIcon('#3498db', 'rgba(52,152,219,0.3)');
const mariaIcon = makePersonIcon('#ff6b9d', 'rgba(255,107,157,0.3)');

// --- localStorage helpers ---
function getSavedLocation(who) {
    try {
        const data = JSON.parse(localStorage.getItem('loveMapLocations') || '{}');
        return data[who] || null;
    } catch { return null; }
}

function saveLocation(who, lat, lng) {
    try {
        const data = JSON.parse(localStorage.getItem('loveMapLocations') || '{}');
        data[who] = { lat, lng, timestamp: Date.now() };
        localStorage.setItem('loveMapLocations', JSON.stringify(data));
    } catch (e) {
        console.warn('Could not save location', e);
    }
}

// --- Button click → open "Who are you?" modal ---
locateBtn.addEventListener('click', () => {
    whoModal.classList.add('show');
});

// Close the who-modal
document.querySelectorAll('.who-close').forEach(btn => {
    btn.addEventListener('click', () => whoModal.classList.remove('show'));
});
whoModal.addEventListener('click', (e) => {
    if (e.target === whoModal) whoModal.classList.remove('show');
});

// Person selection handlers
document.getElementById('who-flo').addEventListener('click', () => requestLocation('flo'));
document.getElementById('who-maria').addEventListener('click', () => requestLocation('maria'));

function requestLocation(who) {
    whoModal.classList.remove('show');

    if (!navigator.geolocation) {
        alert('Geolocation is not supported by your browser 😢');
        return;
    }

    locateBtn.innerHTML = '⏳ Locating…';
    locateBtn.disabled = true;

    navigator.geolocation.getCurrentPosition(
        (pos) => {
            saveLocation(who, pos.coords.latitude, pos.coords.longitude);
            locateBtn.innerHTML = '<span class="icon">💕</span> Where are we?';
            locateBtn.disabled = false;
            renderLocations();
        },
        (err) => {
            console.warn('Geolocation error:', err);
            alert('Could not get your location. Please allow location access and try again.');
            locateBtn.innerHTML = '<span class="icon">�</span> Where are we?';
            locateBtn.disabled = false;
        },
        { enableHighAccuracy: true, timeout: 15000 }
    );
}

// --- Render whatever locations we have ---
function renderLocations() {
    // Clean up old markers & line
    if (floMarker) { map.removeLayer(floMarker); floMarker = null; }
    if (mariaMarker) { map.removeLayer(mariaMarker); mariaMarker = null; }
    if (distanceLine) { map.removeLayer(distanceLine); distanceLine = null; }

    const flo = getSavedLocation('flo');
    const maria = getSavedLocation('maria');

    if (!flo && !maria) return; // nothing saved

    // Place Flo's marker
    if (flo) {
        floMarker = L.marker([flo.lat, flo.lng], { icon: floIcon, zIndexOffset: 1000 }).addTo(map);
        floMarker.bindPopup('<div class="popup-content"><h3>Flo 💙</h3></div>');
    }

    // Place Maria's marker
    if (maria) {
        mariaMarker = L.marker([maria.lat, maria.lng], { icon: mariaIcon, zIndexOffset: 1000 }).addTo(map);
        mariaMarker.bindPopup('<div class="popup-content"><h3>Maria �</h3></div>');
    }

    // Both shared → show distance!
    if (flo && maria) {
        document.getElementById('waiting-banner').style.display = 'none';

        // Draw dashed line
        distanceLine = L.polyline(
            [[flo.lat, flo.lng], [maria.lat, maria.lng]],
            { color: '#ff6b9d', weight: 2, dashArray: '8, 8', opacity: 0.7 }
        ).addTo(map);

        // Fit map to show both
        const bounds = L.latLngBounds([[flo.lat, flo.lng], [maria.lat, maria.lng]]);
        map.fitBounds(bounds, { padding: [60, 60] });

        const km = haversineDistance(flo.lat, flo.lng, maria.lat, maria.lng);
        showDistanceBanner(km);
    } else {
        // Only one person shared
        document.getElementById('distance-banner').style.display = 'none';
        const who = flo ? 'Flo' : 'Maria';
        const other = flo ? 'Maria' : 'Flo';
        const waitText = document.getElementById('waiting-text');
        waitText.textContent = `${who}'s location saved! Waiting for ${other} to share theirs…`;
        document.getElementById('waiting-banner').style.display = 'block';

        // Center on the single marker
        const loc = flo || maria;
        map.setView([loc.lat, loc.lng], 6);
    }
}

// --- Haversine formula — returns distance in km ---
function haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 +
              Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
              Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(deg) { return deg * Math.PI / 180; }

// --- Distance banner with meaningful stats ---
function showDistanceBanner(km) {
    const banner = document.getElementById('distance-banner');
    const valueEl = document.getElementById('distance-value');
    const subtextEl = document.getElementById('distance-subtext');
    const statsEl = document.getElementById('cute-stats');

    const roundKm = Math.round(km);

    valueEl.textContent = `${roundKm.toLocaleString()} km`;

    // Pick a sweet sub-text based on distance
    if (roundKm < 1) {
        subtextEl.textContent = `That's basically the same room — get off your phone and hug! 🤗`;
    } else if (roundKm < 10) {
        subtextEl.textContent = `So close! That's about a ${Math.round(km * 12)} minute bike ride apart 🚲`;
    } else if (roundKm < 100) {
        subtextEl.textContent = `Just a short road trip away — about ${Math.round(km / 80 * 60)} minutes by car 🚗`;
    } else if (roundKm < 1000) {
        subtextEl.textContent = `A few hours of missing each other — but so worth the wait 💕`;
    } else {
        subtextEl.textContent = `Across the world, but never out of each other's hearts 🌍`;
    }

    // Real, meaningful distance equivalents
    const walkHours = km / 5;                      // average walk ~5 km/h
    const handHoldSteps = Math.round(km * 1312);   // ~1312 steps per km
    const flightMins = Math.round(km / 900 * 60);  // cruising speed ~900 km/h
    const marathons = (km / 42.195).toFixed(1);     // marathon = 42.195 km
    const eiffelTowers = Math.round(km * 1000 / 330); // 330m tall
    const hugLength = km * 1000;                   // distance in metres → "that many metres of one long hug"

    const stats = [];

    if (roundKm < 1) {
        // Very close — show cute tiny-distance stats
        const metres = Math.round(km * 1000);
        stats.push(
            { emoji: '👣', number: `${metres}`, label: 'metres between us' },
            { emoji: '🤗', number: `${Math.ceil(metres / 0.5)}`, label: 'tiny steps to reach you' },
            { emoji: '💋', number: '∞', label: 'kisses — you\'re RIGHT HERE' }
        );
    } else if (roundKm < 50) {
        stats.push(
            { emoji: '🚶‍♂️', number: formatDuration(walkHours), label: 'walking to you non-stop' },
            { emoji: '👣', number: handHoldSteps.toLocaleString(), label: 'steps hand-in-hand to meet' },
            { emoji: '🚲', number: `${Math.round(km / 15 * 60)} min`, label: 'by bike to your arms' },
            { emoji: '🏃', number: `${marathons}`, label: 'marathons of missing you' },
            { emoji: '🗼', number: eiffelTowers.toLocaleString(), label: 'Eiffel Towers stacked between us' },
            { emoji: '💌', number: `${Math.round(km * 1000 / 21.5)}`, label: 'love letters laid end to end' }
        );
    } else {
        stats.push(
            { emoji: '✈️', number: `${flightMins} min`, label: 'by plane to be together' },
            { emoji: '🚶‍♂️', number: formatDuration(walkHours), label: 'walking to you non-stop' },
            { emoji: '👣', number: handHoldSteps.toLocaleString(), label: 'steps hand-in-hand to meet' },
            { emoji: '🏃', number: `${marathons}`, label: 'marathons of missing you' },
            { emoji: '🗼', number: eiffelTowers.toLocaleString(), label: 'Eiffel Towers stacked between us' },
            { emoji: '💌', number: `${Math.round(hugLength / 21.5).toLocaleString()}`, label: 'love letters laid end to end' }
        );
    }

    statsEl.innerHTML = stats.map(s => `
        <div class="stat-card">
            <span class="stat-emoji">${s.emoji}</span>
            <span class="stat-number">${s.number}</span>
            <span class="stat-label">${s.label}</span>
        </div>
    `).join('');

    banner.style.display = 'block';
    banner.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function formatDuration(hours) {
    if (hours < 1) return `${Math.round(hours * 60)} min`;
    const d = Math.floor(hours / 24);
    const h = Math.round(hours % 24);
    if (d > 0) return `${d}d ${h}h`;
    return `${h}h`;
}

// Close banners
document.getElementById('distance-close').addEventListener('click', () => {
    document.getElementById('distance-banner').style.display = 'none';
});
document.getElementById('waiting-close').addEventListener('click', () => {
    document.getElementById('waiting-banner').style.display = 'none';
});

// On page load, restore any saved locations
renderLocations();
