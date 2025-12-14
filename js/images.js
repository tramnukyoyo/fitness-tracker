// ============================
// Image Handling Module
// ============================

let selectedImages = [];

export function getSelectedImages() {
    return selectedImages;
}

export function clearSelectedImages() {
    selectedImages = [];
}

export function removeSelectedImage(index) {
    selectedImages.splice(index, 1);
}

export async function handleImageSelection(event, updatePreviewCallback) {
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

    if (updatePreviewCallback) {
        updatePreviewCallback();
    }
}

export function readFileAsDataURL(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (event) => resolve(event.target.result);
        reader.readAsDataURL(file);
    });
}

export function createThumbnail(imageData) {
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

export function updateImagePreview(previewElement, onRemoveCallback) {
    if (selectedImages.length === 0) {
        previewElement.innerHTML = '<p style="color: #888; font-size: 0.9rem;">Keine Bilder ausgewählt</p>';
        return;
    }

    previewElement.innerHTML = selectedImages.map((img, index) => `
        <div class="preview-thumbnail">
            <img src="${img.thumbnail}" alt="Vorschau">
            <button class="remove-image-btn" data-index="${index}">×</button>
        </div>
    `).join('');

    // Add event listeners for remove buttons
    previewElement.querySelectorAll('.remove-image-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = parseInt(e.target.dataset.index);
            removeSelectedImage(index);
            updateImagePreview(previewElement, onRemoveCallback);
            if (onRemoveCallback) onRemoveCallback();
        });
    });
}

export function showFullImage(imageData) {
    const modal = document.createElement('div');
    modal.className = 'fullscreen-modal';

    modal.innerHTML = `
        <img src="${imageData}"
             class="fullscreen-image"
             alt="Gewichtsfoto">
        <button class="close-fullscreen">Schließen</button>
    `;

    document.body.appendChild(modal);

    modal.querySelector('.close-fullscreen').addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });
}
