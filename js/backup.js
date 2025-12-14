// ============================
// Backup/Restore Module
// ============================

import { exportWeights, setWeights } from './weights.js';
import { exportTrainingWeeks, setTrainingWeeks } from './nsuns.js';
import { getAllImages, importImages } from './db.js';

export async function exportAllData() {
    const weights = exportWeights();
    const trainingWeeks = exportTrainingWeeks();
    const images = await getAllImages();

    const exportData = {
        version: 2,
        exportDate: new Date().toISOString(),
        data: {
            weights,
            trainingWeeks,
            images
        }
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `fitness-tracker-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    return true;
}

export async function importAllData(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = async (e) => {
            try {
                const importData = JSON.parse(e.target.result);

                // Validate structure
                if (!importData.data) {
                    throw new Error('Ungültiges Backup-Format');
                }

                const { weights, trainingWeeks, images } = importData.data;

                // Confirm with user
                const weightsCount = weights?.length || 0;
                const weeksCount = trainingWeeks?.length || 0;
                const imagesCount = images?.length || 0;

                const confirmed = confirm(
                    `Backup importieren?\n\n` +
                    `${weightsCount} Gewichtseinträge\n` +
                    `${weeksCount} Trainingswochen\n` +
                    `${imagesCount} Bilder\n\n` +
                    `ACHTUNG: Bestehende Daten werden überschrieben!`
                );

                if (!confirmed) {
                    resolve(false);
                    return;
                }

                // Import data
                if (weights) {
                    setWeights(weights);
                }

                if (trainingWeeks) {
                    setTrainingWeeks(trainingWeeks);
                }

                if (images && images.length > 0) {
                    await importImages(images);
                }

                resolve(true);
            } catch (error) {
                console.error('Import-Fehler:', error);
                reject(new Error('Fehler beim Importieren: ' + error.message));
            }
        };

        reader.onerror = () => reject(new Error('Datei konnte nicht gelesen werden'));
        reader.readAsText(file);
    });
}

export function createBackupUI(container) {
    const backupSection = document.createElement('div');
    backupSection.className = 'backup-section';
    backupSection.innerHTML = `
        <h3>Daten-Backup</h3>
        <div class="backup-buttons">
            <button id="exportBtn" class="backup-btn export">
                📤 Exportieren
            </button>
            <button id="importBtn" class="backup-btn import">
                📥 Importieren
            </button>
            <input type="file" id="importFile" accept=".json" style="display: none;">
        </div>
        <p class="backup-info">
            Sichere deine Daten regelmäßig, um Datenverlust zu vermeiden.
        </p>
    `;

    container.appendChild(backupSection);

    // Event listeners
    document.getElementById('exportBtn').addEventListener('click', async () => {
        try {
            await exportAllData();
            alert('Backup erfolgreich erstellt!');
        } catch (error) {
            alert('Fehler beim Exportieren: ' + error.message);
        }
    });

    document.getElementById('importBtn').addEventListener('click', () => {
        document.getElementById('importFile').click();
    });

    document.getElementById('importFile').addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            const success = await importAllData(file);
            if (success) {
                alert('Backup erfolgreich importiert! Die Seite wird neu geladen.');
                window.location.reload();
            }
        } catch (error) {
            alert(error.message);
        }

        e.target.value = '';
    });
}
