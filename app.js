// ============================
// STATE
// ============================
let weights = JSON.parse(localStorage.getItem('weights')) || [];
let currentTimeRange = 'Alle';
let swipedItemId = null;
let chart = null;
let selectedImages = []; // Neue Bilder für aktuellen Eintrag

// IndexedDB Datenbank
let db = null;
const DB_NAME = 'FitnessTrackerDB';
const DB_VERSION = 1;
const STORE_NAME = 'images';

// ============================
// DOM ELEMENTS
// ============================
const modal = document.getElementById('modal');
const addBtn = document.getElementById('addBtn');
const cancelBtn = document.getElementById('cancelBtn');
const saveBtn = document.getElementById('saveBtn');
const weightInput = document.getElementById('weightInput');
const dayPicker = document.getElementById('dayPicker');
const monthPicker = document.getElementById('monthPicker');
const yearPicker = document.getElementById('yearPicker');
const weightHistory = document.getElementById('weightHistory');
const timeRangeSelect = document.getElementById('timeRangeSelect');
const statsDisplay = document.getElementById('statsDisplay');
const emptyState = document.getElementById('emptyState');

// Neue Elemente für Bilder
const imageUpload = document.getElementById('imageUpload');
const cameraBtn = document.getElementById('cameraBtn');
const galleryBtn = document.getElementById('galleryBtn');
const imagePreview = document.getElementById('imagePreview');

// ============================
// INITIALISIERUNG
// ============================
initializeDatePickers();
initIndexedDB().then(() => {
    displayWeights();
    updateChart();
    updateStats();
});

// ============================
// EVENT LISTENER
// ============================
addBtn.addEventListener('click', openModal);
cancelBtn.addEventListener('click', closeModal);
saveBtn.addEventListener('click', saveWeight);
modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
});

timeRangeSelect.addEventListener('change', (e) => {
    currentTimeRange = e.target.value;
    updateChart();
    updateStats();
});

// Bild-Buttons
cameraBtn.addEventListener('click', () => {
    imageUpload.setAttribute('capture', 'environment');
    imageUpload.click();
});

galleryBtn.addEventListener('click', () => {
    imageUpload.removeAttribute('capture');
    imageUpload.click();
});

imageUpload.addEventListener('change', handleImageSelection);

// ============================
// INDEXEDDB FUNKTIONEN
// ============================

function initIndexedDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        
        request.onerror = (event) => {
            console.error('IndexedDB Fehler:', event.target.error);
            alert('IndexedDB konnte nicht geladen werden. Bilder können nicht gespeichert werden.');
            resolve();
        };
        
        request.onsuccess = (event) => {
            db = event.target.result;
            console.log('IndexedDB geladen');
            resolve();
        };
        
        request.onupgradeneeded = (event) => {
            db = event.target.result;
            
            // Images Store erstellen
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                store.createIndex('entryId', 'entryId', { unique: false });
                console.log('Images Store erstellt');
            }
        };
    });
}

// Bild in IndexedDB speichern
async function saveImageToDB(entryId, imageIndex, imageData) {
    return new Promise((resolve, reject) => {
        if (!db) {
            resolve(null);
            return;
        }
        
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        
        const imageId = `${entryId}_${imageIndex}`;
        
        const request = store.put({
            id: imageId,
            entryId: entryId,
            imageIndex: imageIndex,
            data: imageData,
            timestamp: Date.now()
        });
        
        request.onsuccess = () => resolve(imageId);
        request.onerror = (event) => {
            console.error('Bild speichern fehlgeschlagen:', event.target.error);
            reject(event.target.error);
        };
    });
}

// Bilder für einen Eintrag laden
async function loadImagesForEntry(entryId) {
    return new Promise((resolve) => {
        if (!db) {
            resolve([]);
            return;
        }
        
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const index = store.index('entryId');
        
        const request = index.getAll(entryId);
        
        request.onsuccess = (event) => {
            const images = event.target.result
                .sort((a, b) => a.imageIndex - b.imageIndex)
                .map(img => ({
                    id: img.id,
                    data: img.data,
                    thumbnail: createThumbnailFromData(img.data)
                }));
            resolve(images);
        };
        
        request.onerror = () => resolve([]);
    });
}

// Bild aus IndexedDB löschen
async function deleteImagesForEntry(entryId) {
    return new Promise((resolve) => {
        if (!db) {
            resolve();
            return;
        }
        
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const index = store.index('entryId');
        
        const request = index.openCursor(entryId);
        
        request.onsuccess = (event) => {
            const cursor = event.target.result;
            if (cursor) {
                cursor.delete();
                cursor.continue();
            } else {
                resolve();
            }
        };
        
        request.onerror = () => resolve();
    });
}

// ============================
// BILDER FUNKTIONEN
// ============================

async function handleImageSelection(event) {
    const files = Array.from(event.target.files);
    
    for (const file of files) {
        // Größenlimit: 5MB
        if (file.size > 5 * 1024 * 1024) {
            alert(`Bild "${file.name}" ist zu groß (max. 5MB)`);
            continue;
        }
        
        // Bild als Base64 lesen
        const imageData = await readFileAsDataURL(file);
        
        selectedImages.push({
            id: Date.now() + Math.random(),
            file: file,
            data: imageData,
            thumbnail: await createThumbnail(imageData)
        });
    }
    
    updateImagePreview();
    imageUpload.value = ''; // Reset für nächste Auswahl
}

function readFileAsDataURL(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (event) => resolve(event.target.result);
        reader.readAsDataURL(file);
    });
}

function createThumbnail(imageData) {
    return new Promise((resolve) => {
        const img = new Image();
        img.src = imageData;
        
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // Miniatur: 150x150px (größer für bessere Qualität)
            const size = 150;
            canvas.width = size;
            canvas.height = size;
            
            // Bild zentriert skalieren
            const scale = Math.max(size / img.width, size / img.height);
            const x = (size - img.width * scale) / 2;
            const y = (size - img.height * scale) / 2;
            
            ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
            resolve(canvas.toDataURL('image/jpeg', 0.8));
        };
        
        img.onerror = () => resolve(imageData); // Fallback
    });
}

function createThumbnailFromData(imageData) {
    // Einfache Miniatur (kann später optimiert werden)
    return imageData; // Für jetzt: Original als Miniatur
}

function updateImagePreview() {
    if (selectedImages.length === 0) {
        imagePreview.innerHTML = '<p style="color: #888; font-size: 0.9rem;">Keine Bilder ausgewählt</p>';
        return;
    }
    
    imagePreview.innerHTML = selectedImages.map((img, index) => `
        <div class="preview-thumbnail">
            <img src="${img.thumbnail}" alt="Vorschau">
            <button class="remove-image-btn" onclick="removeSelectedImage(${index})">×</button>
        </div>
    `).join('');
}

function removeSelectedImage(index) {
    selectedImages.splice(index, 1);
    updateImagePreview();
}

// ============================
// GEWICHT SPEICHERN MIT BILDERN
// ============================

async function saveWeight() {
    const weight = parseFloat(weightInput.value);
    const day = dayPicker.value;
    const month = monthPicker.value;
    const year = yearPicker.value;
    
    if (!weight || weight <= 0) {
        alert('Bitte gib ein gültiges Gewicht ein');
        return;
    }
    
    const dateString = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const entryId = Date.now();
    
    // 1. Bilder speichern
    let imageIds = [];
    
    if (selectedImages.length > 0) {
        try {
            // Init DB falls noch nicht geschehen
            if (!db) await initIndexedDB();
            
            for (let i = 0; i < selectedImages.length; i++) {
                const imageId = await saveImageToDB(entryId, i, selectedImages[i].data);
                if (imageId) {
                    imageIds.push({
                        id: imageId,
                        thumbnail: selectedImages[i].thumbnail
                    });
                }
            }
        } catch (error) {
            console.error('Fehler beim Speichern der Bilder:', error);
            alert('Fehler beim Speichern der Bilder. Versuche es erneut.');
            return;
        }
    }
    
    // 2. Eintrag erstellen
    const entry = {
        id: entryId,
        weight: weight,
        date: dateString,
        hasImages: imageIds.length > 0,
        imageCount: imageIds.length
    };
    
    // 3. Lokal speichern
    weights.push(entry);
    weights.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    localStorage.setItem('weights', JSON.stringify(weights));
    
    // 4. Alles aktualisieren
    displayWeights();
    updateChart();
    updateStats();
    closeModal();
}

async function deleteWeight(id) {
    // Bilder aus IndexedDB löschen
    await deleteImagesForEntry(id);
    
    // Eintrag aus Liste löschen
    weights = weights.filter(w => w.id !== id);
    
    localStorage.setItem('weights', JSON.stringify(weights));
    swipedItemId = null;
    displayWeights();
    updateChart();
    updateStats();
}

// ============================
// ANZEIGE MIT BILDERN
// ============================

async function displayWeights() {
    if (weights.length === 0) {
        weightHistory.innerHTML = '<p class="empty-state">Noch keine Einträge vorhanden</p>';
        return;
    }

    const reversed = [...weights].reverse();
    
    // Alle Bilder parallel laden für bessere Performance
    const entriesWithImages = await Promise.all(
        reversed.map(async (w) => {
            let images = [];
            if (w.hasImages) {
                images = await loadImagesForEntry(w.id);
            }
            return { ...w, loadedImages: images };
        })
    );

    weightHistory.innerHTML = entriesWithImages.map(w => {
        const date = new Date(w.date);
        const formattedDate = date.toLocaleDateString('de-DE', { 
            day: '2-digit', 
            month: 'short', 
            year: 'numeric' 
        });

        // Bilder für diesen Eintrag
        let imagesHTML = '';
        if (w.loadedImages && w.loadedImages.length > 0) {
            imagesHTML = `
                <div class="entry-images">
                    ${w.loadedImages.map((img, index) => `
                        <img src="${img.thumbnail}" 
                             class="entry-image-thumb"
                             onclick="showFullImage('${img.id}')"
                             alt="Bild ${index + 1}"
                             loading="lazy">
                    `).join('')}
                </div>
            `;
        }

        return `
            <div class="weight-entry-wrapper" data-id="${w.id}">
                <div class="delete-bg">
                    <button class="delete-btn" onclick="deleteWeight(${w.id})">Löschen</button>
                </div>
                <div class="weight-entry">
                    <div>
                        <div class="weight-info">
                            <div class="weight">
                                ${w.weight} kg
                                ${w.hasImages ? ` 📷 (${w.imageCount})` : ''}
                            </div>
                            <div class="date">${formattedDate}</div>
                        </div>
                        ${imagesHTML}
                    </div>
                </div>
            </div>
        `;
    }).join('');

    // Swipe-Events wieder hinzufügen
    addSwipeEvents();
}

function addSwipeEvents() {
    document.querySelectorAll('.weight-entry-wrapper').forEach(wrapper => {
        const entryId = Number(wrapper.getAttribute('data-id'));
        const entryDiv = wrapper.querySelector('.weight-entry');

        let startX = 0;
        let currentX = 0;
        let translateX = 0;
        let isSwiping = false;

        const handleTouchStart = (e) => {
            if (e.touches.length !== 1) return;
            startX = e.touches[0].clientX;
            currentX = startX;
            isSwiping = true;
            entryDiv.style.transition = 'none';
        };

        const handleTouchMove = (e) => {
            if (!isSwiping) return;
            currentX = e.touches[0].clientX;
            translateX = Math.min(0, currentX - startX);
            entryDiv.style.transform = `translateX(${translateX}px)`;
        };

        const handleTouchEnd = () => {
            if (!isSwiping) return;
            isSwiping = false;

            if (translateX < -80) {
                entryDiv.style.transition = 'transform 0.2s ease-out';
                entryDiv.style.transform = 'translateX(-100px)';
            } else {
                entryDiv.style.transition = 'transform 0.2s ease-out';
                entryDiv.style.transform = 'translateX(0)';
            }
        };

        entryDiv.addEventListener('touchstart', handleTouchStart);
        entryDiv.addEventListener('touchmove', handleTouchMove);
        entryDiv.addEventListener('touchend', handleTouchEnd);
    });
}

// Vollbild-Anzeige
async function showFullImage(imageId) {
    if (!db) return;
    
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    
    const request = store.get(imageId);
    
    request.onsuccess = (event) => {
        const imageData = event.target.result;
        if (!imageData) return;
        
        const modal = document.createElement('div');
        modal.className = 'fullscreen-modal';
        
        modal.innerHTML = `
            <img src="${imageData.data}" 
                 class="fullscreen-image"
                 alt="Gewichtsfoto">
            <button class="close-fullscreen" onclick="this.parentElement.remove()">
                Schließen
            </button>
        `;
        
        document.body.appendChild(modal);
        
        // Mit Klick auf Hintergrund schließen
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    };
}

// ============================
// RESTLICHE FUNKTIONEN
// ============================

function openModal() {
    modal.classList.add('show');
    weightInput.value = '';
    weightInput.focus();
    selectedImages = []; // Reset für neuen Eintrag
    updateImagePreview();
}

function closeModal() {
    modal.classList.remove('show');
    selectedImages = [];
    imagePreview.innerHTML = '';
    imageUpload.value = '';
}

function initializeDatePickers() {
    const today = new Date();
    
    // Days
    for (let i = 1; i <= 31; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = i;
        dayPicker.appendChild(option);
    }
    dayPicker.value = today.getDate();
    
    // Months
    const monthNames = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
    for (let i = 1; i <= 12; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = monthNames[i - 1];
        monthPicker.appendChild(option);
    }
    monthPicker.value = today.getMonth() + 1;
    
    // Years
    for (let i = today.getFullYear() - 5; i <= today.getFullYear() + 5; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = i;
        yearPicker.appendChild(option);
    }
    yearPicker.value = today.getFullYear();
}

function getFilteredWeights() {
    if (weights.length === 0) return [];
    
    const now = new Date();
    now.setHours(23, 59, 59, 999);
    const sorted = [...weights].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    if (currentTimeRange === 'Alle' || currentTimeRange === 'Seit Anfang') {
        return sorted;
    }
    
    const cutoffDate = new Date();
    cutoffDate.setHours(0, 0, 0, 0);
    
    switch(currentTimeRange) {
        case '1 Woche':
            cutoffDate.setDate(cutoffDate.getDate() - 7);
            break;
        case '1 Monat':
            cutoffDate.setDate(cutoffDate.getDate() - 30);
            break;
        case '2 Monate':
            cutoffDate.setDate(cutoffDate.getDate() - 60);
            break;
        case '3 Monate':
            cutoffDate.setDate(cutoffDate.getDate() - 90);
            break;
        case '6 Monate':
            cutoffDate.setDate(cutoffDate.getDate() - 180);
            break;
        case '1 Jahr':
            cutoffDate.setDate(cutoffDate.getDate() - 365);
            break;
    }
    
    return sorted.filter(w => {
        const weightDate = new Date(w.date);
        return weightDate >= cutoffDate && weightDate <= now;
    });
}

function updateChart() {
    const filtered = getFilteredWeights();
    const canvas = document.getElementById('weightChart');
    const ctx = canvas.getContext('2d');
    
    if (filtered.length === 0) {
        if (chart) {
            chart.destroy();
            chart = null;
        }
        emptyState.style.display = 'block';
        canvas.style.display = 'none';
        return;
    }
    
    emptyState.style.display = 'none';
    canvas.style.display = 'block';
    
    const chartData = filtered.map(w => ({
        x: new Date(w.date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' }),
        y: w.weight
    }));
    
    if (chart) {
        chart.destroy();
    }
    
    chart = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: [{
                label: 'Gewicht',
                data: chartData,
                borderColor: '#30d158',
                backgroundColor: 'rgba(48, 209, 88, 0.1)',
                borderWidth: 2,
                pointBackgroundColor: '#30d158',
                pointRadius: 4,
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            parsing: {
                xAxisKey: 'x',
                yAxisKey: 'y'
            },
            scales: {
                x: {
                    grid: {
                        color: '#333'
                    },
                    ticks: {
                        color: '#888',
                        font: {
                            size: 11
                        }
                    }
                },
                y: {
                    grid: {
                        color: '#333'
                    },
                    ticks: {
                        color: '#888',
                        font: {
                            size: 11
                        }
                    },
                    suggestedMin: Math.min(...filtered.map(w => w.weight)) - 2,
                    suggestedMax: Math.max(...filtered.map(w => w.weight)) + 2
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: '#2c2c2e',
                    titleColor: '#888',
                    bodyColor: '#fff',
                    borderColor: '#444',
                    borderWidth: 1
                }
            }
        }
    });
}

function updateStats() {
    const filtered = getFilteredWeights();
    
    if (filtered.length === 0) {
        statsDisplay.style.display = 'none';
        return;
    }
    
    statsDisplay.style.display = 'grid';
    
    const start = filtered[0].weight;
    const current = filtered[filtered.length - 1].weight;
    const diff = current - start;
    const percent = ((diff / start) * 100).toFixed(1);
    const isPositive = diff > 0;
    
    document.getElementById('startWeight').textContent = `${start} kg`;
    document.getElementById('currentWeight').textContent = `${current} kg`;
    
    const diffElement = document.getElementById('diffWeight');
    const symbol = isPositive ? '📈' : '📉';
    const color = isPositive ? '#ff453a' : '#30d158';
    
    diffElement.innerHTML = `<span style="font-size: 1rem;">${symbol}</span> ${diff > 0 ? '+' : ''}${diff.toFixed(1)} kg`;
    diffElement.style.color = color;
    
    document.getElementById('diffLabel').textContent = `Unterschied (${percent > 0 ? '+' : ''}${percent}%)`;
}
