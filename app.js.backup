// ============================
// STATE
// ============================
let weights = JSON.parse(localStorage.getItem('weights')) || [];
let trainingWeeks = JSON.parse(localStorage.getItem('trainingWeeks')) || [];
let currentTimeRange = 'Alle';
let swipedItemId = null;
let chart = null;
let selectedImages = [];
let currentView = 'fortschritt';
let currentWeekId = null;
let editingWeightId = null; // Für Edit-Modus

// IndexedDB
let db = null;
const DB_NAME = 'FitnessTrackerDB';
const DB_VERSION = 1;
const STORE_NAME = 'images';

// ============================
// DOM ELEMENTS
// ============================
// View Switching
const viewDropdownBtn = document.getElementById('viewDropdownBtn');
const viewDropdownMenu = document.getElementById('viewDropdownMenu');
const currentViewName = document.getElementById('currentViewName');
const dropdownItems = document.querySelectorAll('.dropdown-item');
const fortschrittView = document.getElementById('fortschrittView');
const nsunsView = document.getElementById('nsunsView');
const nsunsDetailView = document.getElementById('nsunsDetailView');

// Nsuns Elements
const weeksList = document.getElementById('weeksList');
const backToWeeksBtn = document.getElementById('backToWeeksBtn');
const workoutTabs = document.querySelectorAll('.workout-tab');
const workoutAContent = document.getElementById('workoutAContent');
const workoutBContent = document.getElementById('workoutBContent');
const rmInputA = document.getElementById('rmInputA');
const rmInputB = document.getElementById('rmInputB');
const workoutASets = document.getElementById('workoutASets');
const workoutBSets = document.getElementById('workoutBSets');

// Fortschritt Elements
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

// Bilder
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
    displayTrainingWeeks();
});

// Plus-Button initial korrekt setzen
switchView('fortschritt');

// ============================
// VIEW SWITCHING
// ============================
viewDropdownBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    viewDropdownMenu.classList.toggle('show');
    viewDropdownBtn.classList.toggle('open');
});

document.addEventListener('click', (e) => {
    if (!viewDropdownBtn.contains(e.target) && !viewDropdownMenu.contains(e.target)) {
        viewDropdownMenu.classList.remove('show');
        viewDropdownBtn.classList.remove('open');
    }
});

dropdownItems.forEach(item => {
    item.addEventListener('click', () => {
        const view = item.dataset.view;
        switchView(view);
        
        dropdownItems.forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        currentViewName.textContent = item.textContent;
        
        viewDropdownMenu.classList.remove('show');
        viewDropdownBtn.classList.remove('open');
    });
});

function switchView(view) {
    currentView = view;
    
    fortschrittView.classList.remove('active');
    nsunsView.classList.remove('active');
    nsunsDetailView.classList.remove('active');
    
    if (view === 'fortschritt') {
        fortschrittView.classList.add('active');
        addBtn.style.display = 'flex';
        addBtn.onclick = openModal;
    } else if (view === 'nsuns') {
        nsunsView.classList.add('active');
        addBtn.style.display = 'flex';
        addBtn.onclick = createNewTrainingWeek;
    }
}

// ============================
// NSUNS - TRAININGSWOCHEN
// ============================

// Workout A und B Konfiguration
const WORKOUT_A_CONFIG = [
    { reps: 8, percentage: 65 },
    { reps: 6, percentage: 75 },
    { reps: 4, percentage: 85 },
    { reps: 4, percentage: 85 },
    { reps: 4, percentage: 85 },
    { reps: 5, percentage: 80 },
    { reps: 6, percentage: 75 },
    { reps: 7, percentage: 70 },
    { reps: 8, percentage: 65 }
];

const WORKOUT_B_CONFIG = [
    { reps: 5, percentage: 75 },
    { reps: 3, percentage: 85 },
    { reps: 1, percentage: 95 },
    { reps: 3, percentage: 90 },
    { reps: 5, percentage: 85 },
    { reps: 3, percentage: 80 },
    { reps: 5, percentage: 75 },
    { reps: 3, percentage: 70 },
    { reps: 5, percentage: 65 }
];

function createNewTrainingWeek() {
    const today = new Date();
    const dateString = today.toISOString().split('T')[0];
    
    // Prüfen ob vorherige Woche komplett (18/18)
    let initialRM = 0;
    if (trainingWeeks.length > 0) {
        const lastWeek = trainingWeeks[trainingWeeks.length - 1];
        if (lastWeek.completedExercises === 18 && lastWeek.oneRepMax > 0) {
            initialRM = lastWeek.oneRepMax + 2.5;
        }
    }
    
    const newWeek = {
        id: Date.now(),
        startDate: dateString,
        completedExercises: 0,
        totalExercises: 18,
        percentage: 0,
        oneRepMax: initialRM,
        workoutA: {
            completed: Array(9).fill(false)
        },
        workoutB: {
            completed: Array(9).fill(false)
        }
    };
    
    trainingWeeks.push(newWeek);
    saveTrainingWeeks();
    displayTrainingWeeks();
}

function openWeekDetail(weekId) {
    currentWeekId = weekId;
    const week = trainingWeeks.find(w => w.id === weekId);
    
    if (!week) return;
    
    const date = new Date(week.startDate);
    const formattedDate = date.toLocaleDateString('de-DE', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    });
    
    // Dropdown Text ändern zu Datum
    currentViewName.textContent = formattedDate;
    
    // Views wechseln
    nsunsView.classList.remove('active');
    nsunsDetailView.classList.add('active');
    addBtn.style.display = 'none';
    
    // Zurück-Button anzeigen
    backToWeeksBtn.style.display = 'block';
    
    // 1RM Inputs setzen und Workouts rendern
    rmInputA.value = week.oneRepMax || '';
    rmInputB.value = week.oneRepMax || '';
    renderWorkout('A');
    renderWorkout('B');
}

// 1RM Input Handler
rmInputA.addEventListener('input', () => {
    const week = getCurrentWeek();
    if (!week) return;
    
    const value = parseFloat(rmInputA.value) || 0;
    week.oneRepMax = value;
    rmInputB.value = value; // Sync
    saveTrainingWeeks();
    renderWorkout('A');
    renderWorkout('B');
});

rmInputB.addEventListener('input', () => {
    const week = getCurrentWeek();
    if (!week) return;
    
    const value = parseFloat(rmInputB.value) || 0;
    week.oneRepMax = value;
    rmInputA.value = value; // Sync
    saveTrainingWeeks();
    renderWorkout('A');
    renderWorkout('B');
});

function getCurrentWeek() {
    return trainingWeeks.find(w => w.id === currentWeekId);
}

// ============================
// GEWICHTSBERECHNUNG
// ============================

function calculateWorkingWeight(oneRM, percentage) {
    if (!oneRM || oneRM <= 0) return 0;
    
    const rawWeight = (oneRM * percentage) / 100;
    
    // Auf nächstes darstellbares Gewicht runden (2.5kg Schritte)
    // Minimum: 20kg (nur Stange)
    const rounded = Math.round(rawWeight / 2.5) * 2.5;
    
    return Math.max(20, rounded);
}

function calculatePlates(weight) {
    if (weight < 20) return "Nicht möglich";
    
    const plateWeight = (weight - 20) / 2; // Pro Seite
    
    if (plateWeight === 0) return "Nur Stange";
    
    const plates = [20, 15, 10, 5, 2.5, 1.25];
    let remaining = plateWeight;
    let combination = [];
    
    for (const plate of plates) {
        const count = Math.floor(remaining / plate);
        if (count > 0) {
            combination.push(`${count}×${plate}kg`);
            remaining -= count * plate;
        }
    }
    
    if (Math.abs(remaining) > 0.01) {
        return "Fehler bei Berechnung";
    }
    
    return `[2×${combination.join(' + 2×')}]`;
}

// ============================
// WORKOUT RENDERING
// ============================

function renderWorkout(workout) {
    const week = getCurrentWeek();
    if (!week) return;
    
    const config = workout === 'A' ? WORKOUT_A_CONFIG : WORKOUT_B_CONFIG;
    const container = workout === 'A' ? workoutASets : workoutBSets;
    const completed = workout === 'A' ? week.workoutA.completed : week.workoutB.completed;
    
    container.innerHTML = config.map((set, index) => {
        const weight = calculateWorkingWeight(week.oneRepMax, set.percentage);
        const plates = calculatePlates(weight);
        const isCompleted = completed[index];
        
        return `
            <div class="set-card ${isCompleted ? 'completed' : ''}" 
                 onclick="toggleSet('${workout}', ${index})">
                <div class="set-main-info">
                    <div class="set-text">
                        Satz ${index + 1}: ${set.reps} Wiederholungen mit ${weight}kg
                    </div>
                    <div class="set-checkmark">✓</div>
                </div>
                <div class="set-details">
                    <span class="set-plates">${plates}</span>
                    <span class="set-percentage">${set.percentage}% 1RM</span>
                </div>
            </div>
        `;
    }).join('');
}

function toggleSet(workout, setIndex) {
    const week = getCurrentWeek();
    if (!week) return;
    
    const completedArray = workout === 'A' ? week.workoutA.completed : week.workoutB.completed;
    
    // Toggle
    completedArray[setIndex] = !completedArray[setIndex];
    
    // Zähle abgeschlossene Übungen
    const totalCompleted = week.workoutA.completed.filter(c => c).length + 
                          week.workoutB.completed.filter(c => c).length;
    
    week.completedExercises = totalCompleted;
    week.percentage = Math.round((totalCompleted / 18) * 100);
    
    saveTrainingWeeks();
    renderWorkout(workout);
    displayTrainingWeeks(); // Update Prozent in Liste
}

function displayTrainingWeeks() {
    if (trainingWeeks.length === 0) {
        weeksList.innerHTML = '<p class="empty-state">Noch keine Trainingswochen.<br/>Tippe auf + um zu starten.</p>';
        return;
    }
    
    // Neueste zuerst
    const sortedWeeks = [...trainingWeeks].sort((a, b) => b.id - a.id);
    
    weeksList.innerHTML = sortedWeeks.map(week => {
        const date = new Date(week.startDate);
        const formattedDate = date.toLocaleDateString('de-DE', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });
        
        return `
            <div class="week-card-wrapper" data-week-id="${week.id}">
                <div class="week-delete-bg">
                    <button class="week-delete-btn" onclick="deleteTrainingWeek(${week.id})">Löschen</button>
                </div>
                <div class="week-card" onclick="openWeekDetail(${week.id})">
                    <div class="week-date">${formattedDate}</div>
                    <div class="week-progress">
                        <div class="progress-bar-container">
                            <div class="progress-bar-fill" style="width: ${week.percentage}%"></div>
                        </div>
                        <div class="progress-text">${week.percentage}%</div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    // Swipe Events hinzufügen
    addWeekSwipeEvents();
}

function addWeekSwipeEvents() {
    document.querySelectorAll('.week-card-wrapper').forEach(wrapper => {
        const weekCard = wrapper.querySelector('.week-card');
        
        let startX = 0;
        let currentX = 0;
        let translateX = 0;
        let isSwiping = false;
        
        const handleTouchStart = (e) => {
            if (e.touches.length !== 1) return;
            startX = e.touches[0].clientX;
            currentX = startX;
            isSwiping = true;
            weekCard.classList.add('swiping');
        };
        
        const handleTouchMove = (e) => {
            if (!isSwiping) return;
            currentX = e.touches[0].clientX;
            translateX = Math.min(0, currentX - startX);
            weekCard.style.transform = `translateX(${translateX}px)`;
        };
        
        const handleTouchEnd = () => {
            if (!isSwiping) return;
            isSwiping = false;
            weekCard.classList.remove('swiping');
            
            if (translateX < -80) {
                weekCard.style.transition = 'transform 0.2s ease-out';
                weekCard.style.transform = 'translateX(-100px)';
            } else {
                weekCard.style.transition = 'transform 0.2s ease-out';
                weekCard.style.transform = 'translateX(0)';
            }
        };
        
        weekCard.addEventListener('touchstart', handleTouchStart, { passive: true });
        weekCard.addEventListener('touchmove', handleTouchMove, { passive: true });
        weekCard.addEventListener('touchend', handleTouchEnd);
    });
}

function deleteTrainingWeek(weekId) {
    trainingWeeks = trainingWeeks.filter(w => w.id !== weekId);
    saveTrainingWeeks();
    displayTrainingWeeks();
}

function openWeekDetail(weekId) {
    currentWeekId = weekId;
    const week = trainingWeeks.find(w => w.id === weekId);
    
    if (!week) return;
    
    const date = new Date(week.startDate);
    const formattedDate = date.toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit'
    });
    
    // Dropdown Text ändern zu Datum
    currentViewName.textContent = formattedDate;
    
    // Dropdown-Menü neu aufbauen mit Trainingswochen
    updateWeekDropdown();
    
    // Views wechseln
    nsunsView.classList.remove('active');
    nsunsDetailView.classList.add('active');
    addBtn.style.display = 'none';
    
    // Zurück-Button anzeigen
    backToWeeksBtn.style.display = 'block';
    
    // 1RM Inputs setzen und Workouts rendern
    rmInputA.value = week.oneRepMax || '';
    rmInputB.value = week.oneRepMax || '';
    renderWorkout('A');
    renderWorkout('B');
}

function updateWeekDropdown() {
    // Nur Trainingswochen anzeigen, sortiert nach Datum
    const sortedWeeks = [...trainingWeeks].sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
    
    if (sortedWeeks.length <= 1) {
        // Bei nur 1 Woche: Dropdown-Pfeil verstecken
        document.querySelector('.dropdown-arrow').style.display = 'none';
        viewDropdownBtn.style.cursor = 'default';
        viewDropdownBtn.onclick = null;
        return;
    }
    
    // Dropdown-Pfeil anzeigen
    document.querySelector('.dropdown-arrow').style.display = 'inline';
    viewDropdownBtn.style.cursor = 'pointer';
    
    // Menü neu aufbauen
    viewDropdownMenu.innerHTML = sortedWeeks.map(week => {
        const date = new Date(week.startDate);
        const formattedDate = date.toLocaleDateString('de-DE', {
            day: '2-digit',
            month: '2-digit',
            year: '2-digit'
        });
        
        const isActive = week.id === currentWeekId ? 'active' : '';
        
        return `<div class="dropdown-item ${isActive}" data-week-id="${week.id}">${formattedDate}</div>`;
    }).join('');
    
    // Event Listeners für Wochen-Wechsel
    viewDropdownMenu.querySelectorAll('.dropdown-item').forEach(item => {
        item.addEventListener('click', () => {
            const weekId = parseInt(item.dataset.weekId);
            openWeekDetail(weekId);
            viewDropdownMenu.classList.remove('show');
            viewDropdownBtn.classList.remove('open');
        });
    });
}

backToWeeksBtn.addEventListener('click', () => {
    nsunsDetailView.classList.remove('active');
    nsunsView.classList.add('active');
    addBtn.style.display = 'flex';
    currentWeekId = null;
    
    // Zurück-Button verstecken
    backToWeeksBtn.style.display = 'none';
    
    // Dropdown zurück zu original (Fortschritt/Nsuns)
    currentViewName.textContent = 'Nsuns';
    document.querySelector('.dropdown-arrow').style.display = 'inline';
    viewDropdownBtn.style.cursor = 'pointer';
    
    // Original Dropdown wiederherstellen
    viewDropdownMenu.innerHTML = `
        <div class="dropdown-item" data-view="fortschritt">Fortschritt</div>
        <div class="dropdown-item active" data-view="nsuns">Nsuns</div>
    `;
    
    // Original Event Listeners
    dropdownItems.forEach(item => {
        const newItem = viewDropdownMenu.querySelector(`[data-view="${item.dataset.view}"]`);
        if (newItem) {
            newItem.addEventListener('click', () => {
                const view = newItem.dataset.view;
                switchView(view);
                
                viewDropdownMenu.querySelectorAll('.dropdown-item').forEach(i => i.classList.remove('active'));
                newItem.classList.add('active');
                currentViewName.textContent = newItem.textContent;
                
                viewDropdownMenu.classList.remove('show');
                viewDropdownBtn.classList.remove('open');
            });
        }
    });
    
    // Inputs zurücksetzen
    rmInputA.value = '';
    rmInputB.value = '';
});

// Workout Tabs
workoutTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        const workout = tab.dataset.workout;
        
        // Tabs aktualisieren
        workoutTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        // Content wechseln
        workoutAContent.classList.remove('active');
        workoutBContent.classList.remove('active');
        
        if (workout === 'a') {
            workoutAContent.classList.add('active');
        } else {
            workoutBContent.classList.add('active');
        }
    });
});

function saveTrainingWeeks() {
    localStorage.setItem('trainingWeeks', JSON.stringify(trainingWeeks));
}

// ============================
// FORTSCHRITT - EVENT LISTENER
// ============================
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
// INDEXEDDB
// ============================
function initIndexedDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        
        request.onerror = (event) => {
            console.error('IndexedDB Fehler:', event.target.error);
            resolve();
        };
        
        request.onsuccess = (event) => {
            db = event.target.result;
            console.log('IndexedDB geladen');
            resolve();
        };
        
        request.onupgradeneeded = (event) => {
            db = event.target.result;
            
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                store.createIndex('entryId', 'entryId', { unique: false });
                console.log('Images Store erstellt');
            }
        };
    });
}

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
                    thumbnail: img.data
                }));
            resolve(images);
        };
        
        request.onerror = () => resolve([]);
    });
}

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
        if (file.size > 5 * 1024 * 1024) {
            alert(`Bild "${file.name}" ist zu groß (max. 5MB)`);
            continue;
        }
        
        const imageData = await readFileAsDataURL(file);
        
        selectedImages.push({
            id: Date.now() + Math.random(),
            file: file,
            data: imageData,
            thumbnail: await createThumbnail(imageData)
        });
    }
    
    updateImagePreview();
    imageUpload.value = '';
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
            
            const size = 150;
            canvas.width = size;
            canvas.height = size;
            
            const scale = Math.max(size / img.width, size / img.height);
            const x = (size - img.width * scale) / 2;
            const y = (size - img.height * scale) / 2;
            
            ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
            resolve(canvas.toDataURL('image/jpeg', 0.8));
        };
        
        img.onerror = () => resolve(imageData);
    });
}

function updateImagePreview() {
    if (selectedImages.length === 0) {
        imagePreview.innerHTML = '<p style="color: #888; font-size: 0.9rem;">Keine Bilder ausgewählt</p>';
        return;
    }
    
    imagePreview.innerHTML = selectedImages.map((img, index) => `
        <div class="preview-thumbnail">
            <img src="${img.thumbnail}" alt="Vorschau">
            <button class="remove-image-btn" onclick="event.stopPropagation(); removeSelectedImage(${index})">×</button>
        </div>
    `).join('');
}

function removeSelectedImage(index) {
    selectedImages.splice(index, 1);
    updateImagePreview();
}

// ============================
// GEWICHT SPEICHERN
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
    
    if (editingWeightId) {
        // EDIT-MODUS: Bestehendes Gewicht aktualisieren
        const entry = weights.find(w => w.id === editingWeightId);
        if (!entry) return;
        
        // Alte Bilder löschen die entfernt wurden
        const existingImages = selectedImages.filter(img => img.isExisting);
        const removedImages = (await loadImagesForEntry(editingWeightId))
            .filter(oldImg => !existingImages.find(newImg => newImg.id === oldImg.id));
        
        for (const img of removedImages) {
            await deleteImageFromDB(img.id);
        }
        
        // Neue Bilder speichern
        const newImages = selectedImages.filter(img => !img.isExisting);
        let imageCount = existingImages.length;
        
        if (newImages.length > 0) {
            if (!db) await initIndexedDB();
            
            for (let i = 0; i < newImages.length; i++) {
                const imageIndex = imageCount + i;
                await saveImageToDB(editingWeightId, imageIndex, newImages[i].data);
            }
            imageCount += newImages.length;
        }
        
        // Entry aktualisieren
        entry.weight = weight;
        entry.date = dateString;
        entry.hasImages = imageCount > 0;
        entry.imageCount = imageCount;
        
    } else {
        // NEU-MODUS: Neues Gewicht erstellen
        const entryId = Date.now();
        
        let imageIds = [];
        
        if (selectedImages.length > 0) {
            try {
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
                alert('Fehler beim Speichern der Bilder.');
                return;
            }
        }
        
        const entry = {
            id: entryId,
            weight: weight,
            date: dateString,
            hasImages: imageIds.length > 0,
            imageCount: imageIds.length
        };
        
        weights.push(entry);
    }
    
    weights.sort((a, b) => new Date(a.date) - new Date(b.date));
    localStorage.setItem('weights', JSON.stringify(weights));
    
    displayWeights();
    updateChart();
    updateStats();
    closeModal();
}

async function deleteImageFromDB(imageId) {
    return new Promise((resolve) => {
        if (!db) {
            resolve();
            return;
        }
        
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        
        const request = store.delete(imageId);
        
        request.onsuccess = () => resolve();
        request.onerror = () => resolve();
    });
}

async function deleteWeight(id) {
    await deleteImagesForEntry(id);
    
    weights = weights.filter(w => w.id !== id);
    
    localStorage.setItem('weights', JSON.stringify(weights));
    swipedItemId = null;
    displayWeights();
    updateChart();
    updateStats();
}

// ============================
// ANZEIGE
// ============================
async function displayWeights() {
    if (weights.length === 0) {
        weightHistory.innerHTML = '<p class="empty-state">Noch keine Einträge vorhanden</p>';
        return;
    }

    const reversed = [...weights].reverse();
    
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
                <div class="weight-entry" onclick="openEditModal(${w.id})">
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
        let swipeStartTime = 0;

        const handleTouchStart = (e) => {
            if (e.touches.length !== 1) return;
            startX = e.touches[0].clientX;
            currentX = startX;
            isSwiping = true;
            swipeStartTime = Date.now();
            entryDiv.style.transition = 'none';
        };

        const handleTouchMove = (e) => {
            if (!isSwiping) return;
            currentX = e.touches[0].clientX;
            translateX = Math.min(0, currentX - startX);
            
            // Nur nach links erlauben
            if (translateX < 0) {
                entryDiv.style.transform = `translateX(${translateX}px)`;
            }
        };

        const handleTouchEnd = (e) => {
            if (!isSwiping) return;
            isSwiping = false;
            
            const swipeDuration = Date.now() - swipeStartTime;
            const swipeDistance = Math.abs(translateX);

            // Wenn Swipe minimal war und schnell → Klick (Edit öffnen)
            if (swipeDistance < 10 && swipeDuration < 300) {
                entryDiv.style.transition = 'transform 0.2s ease-out';
                entryDiv.style.transform = 'translateX(0)';
                // Klick wird vom onclick auf entryDiv behandelt
                return;
            }

            // Swipe Logic
            if (translateX < -80) {
                entryDiv.style.transition = 'transform 0.2s ease-out';
                entryDiv.style.transform = 'translateX(-100px)';
            } else {
                entryDiv.style.transition = 'transform 0.2s ease-out';
                entryDiv.style.transform = 'translateX(0)';
            }
        };

        entryDiv.addEventListener('touchstart', handleTouchStart, { passive: true });
        entryDiv.addEventListener('touchmove', handleTouchMove, { passive: true });
        entryDiv.addEventListener('touchend', handleTouchEnd);
    });
}

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
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    };
}

function openModal() {
    modal.classList.add('show');
    weightInput.value = '';
    weightInput.focus();
    selectedImages = [];
    updateImagePreview();
    
    // Modal-Titel ändern je nach Modus
    const modalTitle = document.querySelector('.modal-header h2');
    modalTitle.textContent = editingWeightId ? 'Gewicht bearbeiten' : 'Gewicht hinzufügen';
}

function openEditModal(weightId) {
    editingWeightId = weightId;
    const entry = weights.find(w => w.id === weightId);
    
    if (!entry) return;
    
    // Datum setzen
    const date = new Date(entry.date);
    dayPicker.value = date.getDate();
    monthPicker.value = date.getMonth() + 1;
    yearPicker.value = date.getFullYear();
    
    // Gewicht setzen
    weightInput.value = entry.weight;
    
    // Bilder laden
    loadImagesForEntry(entry.id).then(images => {
        selectedImages = images.map(img => ({
            id: img.id,
            data: img.data,
            thumbnail: img.thumbnail,
            isExisting: true // Markieren als existierend
        }));
        updateImagePreview();
    });
    
    modal.classList.add('show');
    
    // Modal-Titel ändern
    const modalTitle = document.querySelector('.modal-header h2');
    modalTitle.textContent = 'Gewicht bearbeiten';
}

function closeModal() {
    modal.classList.remove('show');
    selectedImages = [];
    imagePreview.innerHTML = '';
    imageUpload.value = '';
    editingWeightId = null;
    
    // Modal-Titel zurücksetzen
    const modalTitle = document.querySelector('.modal-header h2');
    modalTitle.textContent = 'Gewicht hinzufügen';
}

function initializeDatePickers() {
    const today = new Date();
    
    for (let i = 1; i <= 31; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = i;
        dayPicker.appendChild(option);
    }
    dayPicker.value = today.getDate();
    
    const monthNames = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
    for (let i = 1; i <= 12; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = monthNames[i - 1];
        monthPicker.appendChild(option);
    }
    monthPicker.value = today.getMonth() + 1;
    
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