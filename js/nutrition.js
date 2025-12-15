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
                    <button id="createProductBtn" class="scan-btn" style="width: auto; padding: 0 10px;">
                        +
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
                <div class="nutrition-placeholder">
                    <div class="placeholder-icon">🔍</div>
                    <p>Suche nach Produkten oder scanne einen Barcode</p>
                </div>
            </div>

            <!-- Detail View Modal -->
            <div id="productDetailModal" class="product-detail-modal" style="display: none;">
                <!-- Details injected via JS -->
            </div>

            <!-- Create Custom Product Modal -->
            <div id="createProductModal" class="product-detail-modal" style="display: none;">
                <div class="product-detail-content">
                    <div class="modal-header">
                        <h2>Eigenes Produkt erstellen</h2>
                        <button class="close-detail-btn" id="closeCreateModalBtn">×</button>
                    </div>
                    <div class="modal-body">
                        <div class="input-group">
                            <label>Name</label>
                            <input type="text" id="customName" placeholder="z.B. Mein Müsli">
                        </div>
                        <div class="input-group">
                            <label>Marke (Optional)</label>
                            <input type="text" id="customBrand" placeholder="z.B. Eigenmarke">
                        </div>
                        <div class="input-group">
                            <label>Barcode (Optional)</label>
                            <input type="text" id="customBarcode" placeholder="Scannen oder eingeben">
                        </div>
                        
                        <h4>Nährwerte (pro 100g)</h4>
                        <div class="nutrition-grid-input">
                            <div class="input-group">
                                <label>Kcal</label>
                                <input type="number" id="customKcal" placeholder="0">
                            </div>
                            <div class="input-group">
                                <label>Protein</label>
                                <input type="number" id="customProtein" placeholder="0">
                            </div>
                            <div class="input-group">
                                <label>Carbs</label>
                                <input type="number" id="customCarbs" placeholder="0">
                            </div>
                            <div class="input-group">
                                <label>Fett</label>
                                <input type="number" id="customFat" placeholder="0">
                            </div>
                        </div>

                        <button id="saveCustomProductBtn" class="save-custom-btn">Speichern</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Event Listeners
    const searchInput = document.getElementById('foodSearchInput');
    const scanBtn = document.getElementById('scanBarcodeBtn');
    const closeScannerBtn = document.getElementById('closeScannerBtn');
    const createProductBtn = document.getElementById('createProductBtn');
    const closeCreateModalBtn = document.getElementById('closeCreateModalBtn');
    const saveCustomProductBtn = document.getElementById('saveCustomProductBtn');

    // Text Search
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        const query = e.target.value.trim();
        
        if (query.length < 3) {
            document.getElementById('searchResults').innerHTML = `
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

    // Custom Product
    createProductBtn.addEventListener('click', () => openCreateProductModal());
    closeCreateModalBtn.addEventListener('click', () => {
        document.getElementById('createProductModal').style.display = 'none';
    });
    saveCustomProductBtn.addEventListener('click', saveCustomProduct);
}

// ============================
// DATA & API FUNCTIONS
// ============================
async function searchFood(query) {
    const resultsContainer = document.getElementById('searchResults');
    resultsContainer.innerHTML = '<div class="loading-spinner">Laden...</div>';

    // 1. Local Search
    const localProducts = getCustomProducts().filter(p => 
        p.product_name.toLowerCase().includes(query.toLowerCase()) || 
        (p.brands && p.brands.toLowerCase().includes(query.toLowerCase()))
    );

    // 2. API Search (using Open Food Facts API v2 search endpoint)
    try {
        const response = await fetch(`https://world.openfoodfacts.org/api/v2/search?q=${encodeURIComponent(query)}&fields=product_name,brands,image_front_small_url,nutriments,code&page_size=20`, {
            headers: {
                'User-Agent': 'FitnessTrackerApp - Web - 1.0.0' // Identify your application
            }
        });
        const data = await response.json();
        const apiProducts = data.products || [];

        // Merge results (Local first)
        const allProducts = [...localProducts, ...apiProducts];

        if (allProducts.length > 0) {
            displayResults(allProducts);
        } else {
            resultsContainer.innerHTML = `
                <div class="no-results-container">
                    <p class="no-results">Keine Produkte gefunden.</p>
                    <button class="create-custom-btn-inline" id="inlineCreateBtn">
                        "${query}" erstellen
                    </button>
                </div>
            `;
            document.getElementById('inlineCreateBtn').onclick = () => openCreateProductModal(null, query);
        }
    } catch (error) {
        console.error('Search error:', error);
        // Show local results even if API fails
        if (localProducts.length > 0) {
            displayResults(localProducts);
        } else {
            resultsContainer.innerHTML = '<p class="error-msg">Fehler bei der Suche.</p>';
        }
    }
}

async function fetchProductByBarcode(barcode) {
    const resultsContainer = document.getElementById('searchResults');
    resultsContainer.innerHTML = '<div class="loading-spinner">Produktdaten werden geladen...</div>';

    // 1. Check Local Storage
    const localProduct = getCustomProducts().find(p => p.code === barcode);
    if (localProduct) {
        showProductDetail(localProduct);
        return;
    }

    // 2. Check API
    try {
        const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
        const data = await response.json();

        if (data.status === 1) {
            showProductDetail(data.product);
        } else {
            resultsContainer.innerHTML = `
                <div class="no-results-container">
                    <p class="no-results">Produkt nicht gefunden (Barcode: ${barcode})</p>
                    <button class="create-custom-btn-inline" id="inlineCreateBarcodeBtn">
                        Produkt erstellen
                    </button>
                </div>
            `;
            document.getElementById('inlineCreateBarcodeBtn').onclick = () => openCreateProductModal(barcode);
        }
    } catch (error) {
        console.error('Barcode lookup error:', error);
        resultsContainer.innerHTML = '<p class="error-msg">Fehler beim Laden des Produkts.</p>';
    }
}

// ============================
// CUSTOM PRODUCT FUNCTIONS
// ============================
function getCustomProducts() {
    return JSON.parse(localStorage.getItem('customFoods')) || [];
}

function openCreateProductModal(barcode = null, name = null) {
    const modal = document.getElementById('createProductModal');
    
    // Reset inputs
    document.getElementById('customName').value = name || '';
    document.getElementById('customBrand').value = '';
    document.getElementById('customBarcode').value = barcode || '';
    document.getElementById('customKcal').value = '';
    document.getElementById('customProtein').value = '';
    document.getElementById('customCarbs').value = '';
    document.getElementById('customFat').value = '';

    modal.style.display = 'flex';
}

function saveCustomProduct() {
    const name = document.getElementById('customName').value.trim();
    if (!name) {
        alert('Bitte einen Namen eingeben.');
        return;
    }

    const newProduct = {
        code: document.getElementById('customBarcode').value.trim() || `local_${Date.now()}`,
        product_name: name,
        brands: document.getElementById('customBrand').value.trim(),
        image_front_small_url: null, // No image for local products
        nutriments: {
            'energy-kcal_100g': parseFloat(document.getElementById('customKcal').value) || 0,
            'proteins_100g': parseFloat(document.getElementById('customProtein').value) || 0,
            'carbohydrates_100g': parseFloat(document.getElementById('customCarbs').value) || 0,
            'fat_100g': parseFloat(document.getElementById('customFat').value) || 0,
            // Add derived values for detail view compatibility
            'energy-kcal': parseFloat(document.getElementById('customKcal').value) || 0,
            'proteins': parseFloat(document.getElementById('customProtein').value) || 0,
            'carbohydrates': parseFloat(document.getElementById('customCarbs').value) || 0,
            'fat': parseFloat(document.getElementById('customFat').value) || 0
        },
        source: 'local'
    };

    const customFoods = getCustomProducts();
    customFoods.push(newProduct);
    localStorage.setItem('customFoods', JSON.stringify(customFoods));

    // Close modal and show product
    document.getElementById('createProductModal').style.display = 'none';
    showProductDetail(newProduct);
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
        const isLocal = product.source === 'local';

        card.innerHTML = `
            <img src="${imgUrl}" alt="${product.product_name}" class="product-thumb" onerror="this.src='icons/icon.png'">
            <div class="product-info">
                <h4>${product.product_name} ${isLocal ? '<span class="local-badge">Eigen</span>' : ''}</h4>
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
                <img src="${product.image_front_url || product.image_front_small_url || 'icons/icon.png'}" class="detail-image" onerror="this.src='icons/icon.png'">
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
                <div class="table-row">
                    <span>Fett</span>
                    <span>${val('fat')} g</span>
                </div>
                <!-- Only show detailed rows if data exists -->
                ${val('sugars') ? `<div class="table-row sub-row"><span>davon Zucker</span><span>${val('sugars')} g</span></div>` : ''}
                ${val('saturated-fat') ? `<div class="table-row sub-row"><span>davon gesättigt</span><span>${val('saturated-fat')} g</span></div>` : ''}
                ${val('fiber') ? `<div class="table-row"><span>Ballaststoffe</span><span>${val('fiber')} g</span></div>` : ''}
                ${val('salt') ? `<div class="table-row"><span>Salz</span><span>${val('salt')} g</span></div>` : ''}
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
