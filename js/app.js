// ============================
// Main Application Module
// ============================

import { initIndexedDB } from './db.js';
import { handleImageSelection, updateImagePreview, clearSelectedImages, getSelectedImages } from './images.js';
import { saveWeight, deleteWeight, displayWeights, updateStats, setTimeRange, getFilteredWeights } from './weights.js';
import { updateChart } from './chart.js';
import {
    createNewTrainingWeek,
    displayTrainingWeeks,
    getTrainingWeeks,
    getCurrentWeekId,
    setCurrentWeekId,
    getWeekById,
    renderWorkoutDetail,
    toggleSetCompletion,
    updateSetData,
    saveTrainingWeeks,
    calculateNewTMs
} from './nsuns.js';
import { createBackupUI } from './backup.js';
import { initEasterEgg } from './easter-egg.js';

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
const workoutCContent = document.getElementById('workoutCContent');
const workoutDContent = document.getElementById('workoutDContent');

// Fortschritt Elements
const modal = document.getElementById('modal');
const tmModal = document.getElementById('tmModal');
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
const weightChartCanvas = document.getElementById('weightChart');

// Bilder
const imageUpload = document.getElementById('imageUpload');
const cameraBtn = document.getElementById('cameraBtn');
const galleryBtn = document.getElementById('galleryBtn');
const imagePreview = document.getElementById('imagePreview');

// Current state
let currentView = 'fortschritt';
let currentWorkout = 'a';

// ============================
// INITIALISIERUNG
// ============================
async function init() {
    initializeDatePickers();
    await initIndexedDB();

    await refreshFortschrittView();
    refreshNsunsView();

    // Setup backup UI
    const settingsContainer = document.getElementById('settingsSection');
    if (settingsContainer) {
        createBackupUI(settingsContainer);
    }

    switchView('fortschritt');

    // Initialize easter egg
    initEasterEgg();

    // Register service worker
    if ('serviceWorker' in navigator) {
        try {
            const registration = await navigator.serviceWorker.register('./sw.js');
            console.log('Service Worker registriert:', registration.scope);
        } catch (error) {
            console.log('Service Worker Registrierung fehlgeschlagen:', error);
        }
    }
}

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
    backToWeeksBtn.style.display = 'none';

    if (view === 'fortschritt') {
        fortschrittView.classList.add('active');
        addBtn.style.display = 'flex';
        addBtn.onclick = openModal;
    } else if (view === 'nsuns') {
        nsunsView.classList.add('active');
        addBtn.style.display = 'flex';
        addBtn.onclick = openTMModal;
    } else if (view === 'settings') {
        // Settings view if we add one
    }
}

// ============================
// NSUNS FUNCTIONS
// ============================
function openTMModal() {
    if (tmModal) {
        const trainingWeeks = getTrainingWeeks();
        const lastWeek = trainingWeeks.length > 0 ? trainingWeeks[trainingWeeks.length - 1] : null;

        let proposedTMs;
        if (lastWeek) {
            proposedTMs = calculateNewTMs(lastWeek);
        } else {
            proposedTMs = {
                bench: 60,
                squat: 80,
                ohp: 40,
                deadlift: 100
            };
        }

        document.getElementById('tmBench').value = proposedTMs.bench;
        document.getElementById('tmSquat').value = proposedTMs.squat;
        document.getElementById('tmOHP').value = proposedTMs.ohp;
        document.getElementById('tmDeadlift').value = proposedTMs.deadlift;

        tmModal.classList.add('show');
    } else {
        // Fallback: create week with defaults
        createNewTrainingWeek();
        refreshNsunsView();
    }
}

function closeTMModal() {
    if (tmModal) {
        tmModal.classList.remove('show');
    }
}

function refreshNsunsView() {
    displayTrainingWeeks(weeksList, openWeekDetail);
}

function openWeekDetail(weekId) {
    setCurrentWeekId(weekId);
    const week = getWeekById(weekId);

    if (!week) return;

    const date = new Date(week.startDate);
    const formattedDate = date.toLocaleDateString('de-DE', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    });

    currentViewName.textContent = formattedDate;

    nsunsView.classList.remove('active');
    nsunsDetailView.classList.add('active');
    addBtn.style.display = 'none';
    backToWeeksBtn.style.display = 'block';

    // Reset to workout A
    currentWorkout = 'a';
    workoutTabs.forEach(t => t.classList.remove('active'));
    document.querySelector('[data-workout="a"]').classList.add('active');

    renderCurrentWorkout();
}

function renderCurrentWorkout() {
    const weekId = getCurrentWeekId();
    const week = getWeekById(weekId);
    if (!week) return;

    // Hide all workout contents
    [workoutAContent, workoutBContent, workoutCContent, workoutDContent].forEach(c => {
        if (c) c.classList.remove('active');
    });

    // Get current container
    let container;
    switch(currentWorkout) {
        case 'a': container = workoutAContent; break;
        case 'b': container = workoutBContent; break;
        case 'c': container = workoutCContent; break;
        case 'd': container = workoutDContent; break;
    }

    if (container) {
        container.classList.add('active');
        renderWorkoutDetail(week, currentWorkout, container,
            (exIdx, setIdx) => {
                toggleSetCompletion(weekId, currentWorkout, exIdx, setIdx);
                renderCurrentWorkout();
                refreshNsunsView();
            },
            (exIdx, setIdx, reps, weight) => {
                updateSetData(weekId, currentWorkout, exIdx, setIdx, reps, weight);
            }
        );
    }
}

backToWeeksBtn.addEventListener('click', () => {
    nsunsDetailView.classList.remove('active');
    nsunsView.classList.add('active');
    addBtn.style.display = 'flex';
    setCurrentWeekId(null);
    backToWeeksBtn.style.display = 'none';
    currentViewName.textContent = 'Nsuns';
    refreshNsunsView();
});

// Workout Tabs
workoutTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        currentWorkout = tab.dataset.workout;

        workoutTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        renderCurrentWorkout();
    });
});

// TM Modal handlers
if (tmModal) {
    const tmCancelBtn = document.getElementById('tmCancelBtn');
    const tmSaveBtn = document.getElementById('tmSaveBtn');

    if (tmCancelBtn) {
        tmCancelBtn.addEventListener('click', closeTMModal);
    }

    if (tmSaveBtn) {
        tmSaveBtn.addEventListener('click', () => {
            const bench = parseFloat(document.getElementById('tmBench')?.value) || 60;
            const squat = parseFloat(document.getElementById('tmSquat')?.value) || 80;
            const ohp = parseFloat(document.getElementById('tmOHP')?.value) || 40;
            const deadlift = parseFloat(document.getElementById('tmDeadlift')?.value) || 100;

            createNewTrainingWeek({ bench, squat, ohp, deadlift });
            refreshNsunsView();
            closeTMModal();
        });
    }

    tmModal.addEventListener('click', (e) => {
        if (e.target === tmModal) closeTMModal();
    });
}

// ============================
// FORTSCHRITT FUNCTIONS
// ============================
async function refreshFortschrittView() {
    await displayWeights(weightHistory, null);
    updateChart(weightChartCanvas, emptyState);
    updateStats(statsDisplay, document.getElementById('diffLabel'));
}

cancelBtn.addEventListener('click', closeModal);
saveBtn.addEventListener('click', handleSaveWeight);
modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
});

timeRangeSelect.addEventListener('change', (e) => {
    setTimeRange(e.target.value);
    updateChart(weightChartCanvas, emptyState);
    updateStats(statsDisplay, document.getElementById('diffLabel'));
});

cameraBtn.addEventListener('click', () => {
    imageUpload.setAttribute('capture', 'environment');
    imageUpload.click();
});

galleryBtn.addEventListener('click', () => {
    imageUpload.removeAttribute('capture');
    imageUpload.click();
});

imageUpload.addEventListener('change', (e) => {
    handleImageSelection(e, () => updateImagePreview(imagePreview));
});

// Delete button handlers (event delegation)
weightHistory.addEventListener('click', async (e) => {
    if (e.target.classList.contains('delete-btn')) {
        const id = parseInt(e.target.dataset.id);
        await deleteWeight(id);
        await refreshFortschrittView();
    }
});

async function handleSaveWeight() {
    const weight = parseFloat(weightInput.value);
    const day = dayPicker.value;
    const month = monthPicker.value;
    const year = yearPicker.value;

    const dateString = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    const success = await saveWeight(weight, dateString);
    if (success) {
        await refreshFortschrittView();
        closeModal();
    }
}

function openModal() {
    modal.classList.add('show');
    weightInput.value = '';
    weightInput.focus();
    clearSelectedImages();
    updateImagePreview(imagePreview);
}

function closeModal() {
    modal.classList.remove('show');
    clearSelectedImages();
    imagePreview.innerHTML = '';
    imageUpload.value = '';
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

// Start the app
init();
