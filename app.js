// State
let weights = JSON.parse(localStorage.getItem('weights')) || [];
let currentTimeRange = 'Alle';
let swipedItemId = null;
let chart = null;

// DOM Elements
const modal = document.getElementById('modal');
const addBtn = document.getElementById('addBtn');
const cancelBtn = document.getElementById('cancelBtn');
const saveBtn = document.getElementById('saveBtn');
const weightInput = document.getElementById('weightInput');
const dayPicker = document.getElementById('dayPicker');
const monthPicker = document.getElementById('monthPicker');
const yearPicker = document.getElementById('yearPicker');
const weightHistory = document.getElementById('weightHistory');
const rangeBtns = document.querySelectorAll('.range-btn');
const statsDisplay = document.getElementById('statsDisplay');
const emptyState = document.getElementById('emptyState');

// Initialize
initializeDatePickers();
displayWeights();
updateChart();
updateStats();

// Event Listeners
addBtn.addEventListener('click', openModal);
cancelBtn.addEventListener('click', closeModal);
saveBtn.addEventListener('click', saveWeight);
modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
});

timeRangeSelect. addEventListener('change', (e) => {
    currentTimeRange = e.target.value;
    updateChart();
    updateStats();
});

// Functions
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

function openModal() {
    modal.classList.add('show');
    weightInput.value = '';
    weightInput.focus();
}

function closeModal() {
    modal.classList.remove('show');
}

function saveWeight() {
    const weight = parseFloat(weightInput.value);
    const day = dayPicker.value;
    const month = monthPicker.value;
    const year = yearPicker.value;
    
    if (!weight || weight <= 0) {
        alert('Bitte gib ein gültiges Gewicht ein');
        return;
    }
    
    const dateString = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    const entry = {
        id: Date.now(),
        weight: weight,
        date: dateString
    };
    
    weights.push(entry);
    weights.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    localStorage.setItem('weights', JSON.stringify(weights));
    
    displayWeights();
    updateChart();
    updateStats();
    closeModal();
}

function deleteWeight(id) {
    weights = weights.filter(w => w.id !== id);
    localStorage.setItem('weights', JSON.stringify(weights));
    swipedItemId = null;
    displayWeights();
    updateChart();
    updateStats();
}

function displayWeights() {
    if (weights.length === 0) {
        weightHistory.innerHTML = '';
        return;
    }
    
    weightHistory.innerHTML = weights.map(w => {
        const date = new Date(w.date);
        const formattedDate = date.toLocaleDateString('de-DE', { day: '2-digit', month: 'short', year: 'numeric' });
        const isSwiped = swipedItemId === w.id;
        
        return `
            <div class="weight-entry-wrapper" data-id="${w.id}">
                <div class="weight-entry ${isSwiped ? 'swiped' : ''}" onclick="toggleSwipe(${w.id})">
                    <div class="entry-date">${formattedDate}</div>
                    <div class="entry-weight">${w.weight} kg</div>
                </div>
                <button class="delete-btn" onclick="deleteWeight(${w.id})">Löschen</button>
            </div>
        `;
    }).join('');

    // Touch-Events für Swipe hinzufügen
    document.querySelectorAll('.weight-entry-wrapper').forEach(wrapper => {
        const entryId = Number(wrapper.getAttribute('data-id'));
        const entryDiv = wrapper.querySelector('.weight-entry');

        let localStartX = null;
        let localCurrentX = null;

        entryDiv.addEventListener('touchstart', (e) => {
            if (e.touches.length !== 1) return;
            localStartX = e.touches[0].clientX;
            localCurrentX = localStartX;
            entryDiv.classList.add('swiping');
        });

        entryDiv.addEventListener('touchmove', (e) => {
            if (localStartX === null) return;
            localCurrentX = e.touches[0].clientX;
            let deltaX = localCurrentX - localStartX;
            if (deltaX < 0) {
                entryDiv.style.transform = `translateX(${deltaX}px)`;
            }
        });

        entryDiv.addEventListener('touchend', (e) => {
            if (localStartX === null) return;
            let deltaX = localCurrentX - localStartX;
            entryDiv.classList.remove('swiping');
            if (deltaX < -80) {
                swipedItemId = entryId;
                entryDiv.style.transform = 'translateX(-100px)';
            } else {
                entryDiv.style.transform = '';
            }
            localStartX = null;
            localCurrentX = null;
        });
    });
}

function toggleSwipe(id) {
    swipedItemId = swipedItemId === id ? null : id;
    displayWeights();
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