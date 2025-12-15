// ============================
// NUTRITION MODULE
// ============================

// State
let searchTimeout = null;
let currentProduct = null;
let html5QrCode = null;

// ============================
// PUBLIC FUNCTIONS
// ============================
export function initNutrition(container) {
    container.innerHTML = `
        <div class="nutrition-container">
            <!-- Search Section -->
            <div class="search-section">
                <div class="search-bar-wrapper">
                    <input type="text" id="foodSearchInput" placeholder="Nahrungsmittel suchen..." class="search-input">
                    <button id="scanBarcodeBtn" class="scan-btn">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M3 5h2V3c-1.1 0-2 .9-2 2zm0 8h2v-2H3v2zm4 8h2v-2H7v2zM3 9h2V7H3v2zm10-6h-2v2h2V3zm6 0v2h2c0-1.1-.9-2-2-2zM5 21v-2H3c0 1.1.9 2 2 2zm-2-4h2v-2H3v2zM9 3H7v2h2V3zm8 0h-2v2h2V3zm2 8h2v-2h-2v2zm0-4h2V7h-2v2zm0 8h2v-2h-2v2zm0-4h2v-2h-2v2zm2 8c1.1 0 2-.9 2-2h-2v2zm0-4h2v-2h-2v2zM13 21h-2v-2h2v2zM9 21H7v-2h2v2z"/>
                        </svg>
                    </button>
                </div>
            </div>

            <!-- Barcode Scanner Modal -->
            <div id="scannerModal" class="scanner-modal" style="display: none;">
                <div class="scanner-content">
                    <div id="reader"></div>
                    <button id="closeScannerBtn" class="close-scanner-btn">Schließen</button>
                </div>
            </div>

            <!-- Results List -->
            <div id="searchResults" class="search-results">
                <!-- Results will be injected here -->
                <div class="nutrition-placeholder">
                    <div class="placeholder-icon">🔍</div>
                    <p>Suche nach Produkten oder scanne einen Barcode</p>
                </div>
            </div>

            <!-- Detail View Modal -->
            <div id="productDetailModal" class="product-detail-modal" style="display: none;">
                <!-- Details injected via JS -->
            </div>
        </div>
    `;

    // Event Listeners
    const searchInput = document.getElementById('foodSearchInput');
    const scanBtn = document.getElementById('scanBarcodeBtn');
    const closeScannerBtn = document.getElementById('closeScannerBtn');
    const searchResults = document.getElementById('searchResults');

    // Text Search with Debounce
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        const query = e.target.value.trim();
        
        if (query.length < 3) {
            searchResults.innerHTML = `
                <div class="nutrition-placeholder">
                    <div class="placeholder-icon">🔍</div>
                    <p>Suche nach Produkten oder scanne einen Barcode</p>
                </div>
            `;
            return;
        }

        searchTimeout = setTimeout(() => {
            searchFood(query);
        }, 500);
    });

    // Barcode Scanner
    scanBtn.addEventListener('click', startScanner);
    closeScannerBtn.addEventListener('click', stopScanner);
}

// ============================
// API FUNCTIONS (Open Food Facts)
// ============================
async function searchFood(query) {
    const resultsContainer = document.getElementById('searchResults');
    resultsContainer.innerHTML = '<div class="loading-spinner">Laden...</div>';

    try {
        const response = await fetch(`https://de.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=20`);
        const data = await response.json();

        if (data.products && data.products.length > 0) {
            displayResults(data.products);
        } else {
            resultsContainer.innerHTML = '<p class="no-results">Keine Produkte gefunden.</p>';
        }
    } catch (error) {
        console.error('Search error:', error);
        resultsContainer.innerHTML = '<p class="error-msg">Fehler bei der Suche. Bitte überprüfe deine Verbindung.</p>';
    }
}

async function fetchProductByBarcode(barcode) {
    const resultsContainer = document.getElementById('searchResults');
    resultsContainer.innerHTML = '<div class="loading-spinner">Produktdaten werden geladen...</div>';

    try {
        const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
        const data = await response.json();

        if (data.status === 1) {
            showProductDetail(data.product);
        } else {
            resultsContainer.innerHTML = '<p class="no-results">Produkt nicht gefunden.</p>';
        }
    } catch (error) {
        console.error('Barcode lookup error:', error);
        resultsContainer.innerHTML = '<p class="error-msg">Fehler beim Laden des Produkts.</p>';
    }
}

// ============================
// UI FUNCTIONS
// ============================
function displayResults(products) {
    const container = document.getElementById('searchResults');
    container.innerHTML = '';

    products.forEach(product => {
        if (!product.product_name) return;

        const card = document.createElement('div');
        card.className = 'product-card';
        
        // Get image or placeholder
        const imgUrl = product.image_front_small_url || 'icons/icon.png';
        const brand = product.brands || 'Unbekannt';
        const kcal = product.nutriments?.['energy-kcal_100g'] || 0;

        card.innerHTML = `
            <img src="${imgUrl}" alt="${product.product_name}" class="product-thumb" onerror="this.src='icons/icon.png'">
            <div class="product-info">
                <h4>${product.product_name}</h4>
                <p class="brand">${brand}</p>
                <div class="macros-preview">
                    <span>🔥 ${Math.round(kcal)} kcal</span>
                </div>
            </div>
        `;

        card.addEventListener('click', () => showProductDetail(product));
        container.appendChild(card);
    });
}

function showProductDetail(product) {
    const modal = document.getElementById('productDetailModal');
    const nutrients = product.nutriments || {};
    
    // Helper to get value safely
    const val = (key) => Math.round(nutrients[key + '_100g'] || 0);

    modal.innerHTML = `
        <div class="product-detail-content">
            <button class="close-detail-btn" onclick="document.getElementById('productDetailModal').style.display='none'">×</button>
            
            <div class="detail-header">
                <img src="${product.image_front_url || product.image_front_small_url || 'icons/icon.png'}" class="detail-image">
                <div>
                    <h3>${product.product_name}</h3>
                    <p class="detail-brand">${product.brands || 'Marke unbekannt'}</p>
                </div>
            </div>

            <div class="nutrition-grid">
                <div class="macro-card calories">
                    <span class="macro-val">${val('energy-kcal')}</span>
                    <span class="macro-label">kcal</span>
                </div>
                <div class="macro-card">
                    <span class="macro-val">${val('proteins')}g</span>
                    <span class="macro-label">Protein</span>
                </div>
                <div class="macro-card">
                    <span class="macro-val">${val('carbohydrates')}g</span>
                    <span class="macro-label">Carbs</span>
                </div>
                <div class="macro-card">
                    <span class="macro-val">${val('fat')}g</span>
                    <span class="macro-label">Fett</span>
                </div>
            </div>

            <div class="nutrition-table">
                <h4>Nährwerte (pro 100g)</h4>
                <div class="table-row">
                    <span>Kalorien</span>
                    <span>${val('energy-kcal')} kcal</span>
                </div>
                <div class="table-row">
                    <span>Protein</span>
                    <span>${val('proteins')} g</span>
                </div>
                <div class="table-row">
                    <span>Kohlenhydrate</span>
                    <span>${val('carbohydrates')} g</span>
                </div>
                <div class="table-row sub-row">
                    <span>davon Zucker</span>
                    <span>${val('sugars')} g</span>
                </div>
                <div class="table-row">
                    <span>Fett</span>
                    <span>${val('fat')} g</span>
                </div>
                <div class="table-row sub-row">
                    <span>davon gesättigt</span>
                    <span>${val('saturated-fat')} g</span>
                </div>
                <div class="table-row">
                    <span>Ballaststoffe</span>
                    <span>${val('fiber')} g</span>
                </div>
                <div class="table-row">
                    <span>Salz</span>
                    <span>${val('salt')} g</span>
                </div>
            </div>
        </div>
    `;
    
    modal.style.display = 'flex';
}

// ============================
// BARCODE SCANNER LOGIC
// ============================
function startScanner() {
    const modal = document.getElementById('scannerModal');
    modal.style.display = 'flex';

    if (!html5QrCode) {
        html5QrCode = new Html5Qrcode("reader");
    }

    const config = { fps: 10, qrbox: { width: 250, height: 250 } };
    
    // Prefer back camera
    html5QrCode.start({ facingMode: "environment" }, config, onScanSuccess, onScanFailure)
    .catch(err => {
        console.error("Error starting scanner", err);
        alert("Kamera konnte nicht gestartet werden. Bitte Berechtigung prüfen.");
        stopScanner();
    });
}

function stopScanner() {
    const modal = document.getElementById('scannerModal');
    modal.style.display = 'none';
    
    if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop().then(() => {
            console.log("Scanner stopped");
        }).catch(err => {
            console.error("Failed to stop scanner", err);
        });
    }
}

function onScanSuccess(decodedText, decodedResult) {
    // Handle the scanned code
    console.log(`Scan result: ${decodedText}`, decodedResult);
    
    // Stop scanning
    stopScanner();

    // Search for the product
    fetchProductByBarcode(decodedText);
}

function onScanFailure(error) {
    // handle scan failure, usually better to ignore and keep scanning.
    // console.warn(`Code scan error = ${error}`);
}
