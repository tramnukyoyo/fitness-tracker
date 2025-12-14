// ============================
// Weights Module
// ============================

import { saveImageToDB, loadImagesForEntry, deleteImagesForEntry, getImageById, initIndexedDB, getDB } from './db.js';
import { getSelectedImages, clearSelectedImages, updateImagePreview, showFullImage } from './images.js';

let weights = JSON.parse(localStorage.getItem('weights')) || [];
let currentTimeRange = 'Alle';

export function getWeights() {
    return weights;
}

export function setTimeRange(range) {
    currentTimeRange = range;
}

export function getTimeRange() {
    return currentTimeRange;
}

export function getFilteredWeights() {
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

export async function saveWeight(weightValue, dateString) {
    if (!weightValue || weightValue <= 0) {
        alert('Bitte gib ein gültiges Gewicht ein');
        return false;
    }

    const entryId = Date.now();
    const selectedImages = getSelectedImages();
    let imageIds = [];

    if (selectedImages.length > 0) {
        try {
            const db = getDB();
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
            return false;
        }
    }

    const entry = {
        id: entryId,
        weight: weightValue,
        date: dateString,
        hasImages: imageIds.length > 0,
        imageCount: imageIds.length
    };

    weights.push(entry);
    weights.sort((a, b) => new Date(a.date) - new Date(b.date));

    localStorage.setItem('weights', JSON.stringify(weights));
    clearSelectedImages();

    return true;
}

export async function deleteWeight(id) {
    await deleteImagesForEntry(id);

    weights = weights.filter(w => w.id !== id);

    localStorage.setItem('weights', JSON.stringify(weights));
}

export async function displayWeights(historyElement, onDisplayComplete) {
    if (weights.length === 0) {
        historyElement.innerHTML = '<p class="empty-state">Noch keine Einträge vorhanden</p>';
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

    historyElement.innerHTML = entriesWithImages.map(w => {
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
                             data-image-id="${img.id}"
                             alt="Bild ${index + 1}"
                             loading="lazy">
                    `).join('')}
                </div>
            `;
        }

        return `
            <div class="weight-entry-wrapper" data-id="${w.id}">
                <div class="delete-bg">
                    <button class="delete-btn" data-id="${w.id}">Löschen</button>
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

    // Add event listeners
    addSwipeEvents(historyElement);
    addImageClickEvents(historyElement);

    if (onDisplayComplete) onDisplayComplete();
}

function addSwipeEvents(container) {
    container.querySelectorAll('.weight-entry-wrapper').forEach(wrapper => {
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

function addImageClickEvents(container) {
    container.querySelectorAll('.entry-image-thumb').forEach(img => {
        img.addEventListener('click', async (e) => {
            const imageId = e.target.dataset.imageId;
            const imageData = await getImageById(imageId);
            if (imageData) {
                showFullImage(imageData.data);
            }
        });
    });
}

export function updateStats(statsDisplay, diffLabel) {
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

    diffLabel.textContent = `Unterschied (${percent > 0 ? '+' : ''}${percent}%)`;
}

// For backup/restore
export function setWeights(newWeights) {
    weights = newWeights;
    localStorage.setItem('weights', JSON.stringify(weights));
}

export function exportWeights() {
    return weights;
}
