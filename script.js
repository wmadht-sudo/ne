// استرجاع البيانات المحفوظة من الـ LocalStorage
let rawMaterials = JSON.parse(localStorage.getItem('rawMaterials')) || [];
let products = JSON.parse(localStorage.getItem('products')) || [];

// تشغيل المؤثر الصوتي للماء
function playWaterSound() {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(450, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(850, ctx.currentTime + 0.12);
        osc.frequency.exponentialRampToValueAtTime(250, ctx.currentTime + 0.25);

        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
    } catch (e) {
        console.log('Audio Context Ready');
    }
}

// تهيئة الشاشة الافتتاحية وعرض البيانات
window.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        const splash = document.getElementById('splashScreen');
        if (splash) {
            splash.style.opacity = '0';
            setTimeout(() => splash.style.display = 'none', 800);
        }
    }, 2800);

    renderRawList();
    renderSavedRecipes();
});

// التنقل بين الشاشات
function openScreen(screenId, title) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    
    const target = document.getElementById(screenId);
    target.classList.add('active');

    document.getElementById('headerTitle').innerText = title;
    document.getElementById('backBtn').style.visibility = 'visible';

    if (screenId === 'addProductScreen') prepareProductForm();
    if (screenId === 'manufactureScreen') prepareManufactureScreen();
}

function goToMain() {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById('mainScreen').classList.add('active');
    document.getElementById('headerTitle').innerText = 'منظفاتي Pro';
    document.getElementById('backBtn').style.visibility = 'hidden';
    renderSavedRecipes();
}

// --- 1. عرض الخلطات المحفوظة ---
function renderSavedRecipes() {
    const container = document.getElementById('savedRecipesList');
    const countBadge = document.getElementById('productCount');
    
    if (!container) return;
    
    countBadge.innerText = `${products.length} خلطة`;
    container.innerHTML = '';

    if (products.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; color: var(--text-muted); padding: 20px; font-size: 13px;">
                لا توجد خلطات محفوظة حتى الآن.<br>قم بإنشاء خلطة جديدة لرؤيتها هنا.
            </div>
        `;
        return;
    }

    products.forEach(item => {
        container.innerHTML += `
            <div class="recipe-card">
                <div class="recipe-info">
                    <h4>${item.name}</h4>
                    <span>مرجع الخلطة: ${item.baseVol} لتر</span>
                </div>
                <div class="recipe-actions">
                    <button class="mini-btn btn-use" onclick="quickManufacture(${item.id})">
                        <i class="fa-solid fa-play"></i> تصنيع
                    </button>
                    <button class="mini-btn btn-delete" onclick="deleteProduct(${item.id})">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    });
}

function deleteProduct(id) {
    if (confirm('هل أنت تأكد من حذف هذه الخلطة المحفوظة؟')) {
        products = products.filter(p => p.id !== id);
        localStorage.setItem('products', JSON.stringify(products));
        renderSavedRecipes();
    }
}

function quickManufacture(productId) {
    openScreen('manufactureScreen', 'معايرة الوجبة');
    document.getElementById('selectProduct').value = productId;
}

// --- 2. إدارة المواد الخام ---
function saveRawMaterial(e) {
    e.preventDefault();
    const name = document.getElementById('rawName').value.trim();
    const price = parseFloat(document.getElementById('rawPrice').value);

    if (name && !isNaN(price)) {
        rawMaterials.push({ id: Date.now(), name, price });
        localStorage.setItem('rawMaterials', JSON.stringify(rawMaterials));
        document.getElementById('rawForm').reset();
        renderRawList();
        playWaterSound();
    }
}

function renderRawList() {
    const list = document.getElementById('rawMaterialsList');
    if (!list) return;
    list.innerHTML = '';
    rawMaterials.forEach((item) => {
        list.innerHTML += `
            <div class="recipe-card" style="margin-bottom:8px;">
                <div class="recipe-info">
                    <h4>${item.name}</h4>
                    <span style="color: #38bdf8;">${item.price} جنيه / كجم</span>
                </div>
                <button class="mini-btn btn-delete" onclick="deleteRaw(${item.id})"><i class="fa-solid fa-trash"></i></button>
            </div>
        `;
    });
}

function deleteRaw(id) {
    rawMaterials = rawMaterials.filter(r => r.id !== id);
    localStorage.setItem('rawMaterials', JSON.stringify(rawMaterials));
    renderRawList();
}

// --- 3. إنشاء التركيبات ---
function prepareProductForm() {
    const container = document.getElementById('rawRowsContainer');
    container.innerHTML = '';
    addRawRowToProduct();
}

function addRawRowToProduct() {
    if (rawMaterials.length === 0) {
        alert('الرجاء تسجيل بعض المواد الخام أولاً!');
        return;
    }
    const container = document.getElementById('rawRowsContainer');
    const rowId = Date.now() + Math.random();
    
    let options = rawMaterials.map(r => `<option value="${r.id}">${r.name}</option>`).join('');

    const rowHTML = `
        <div class="raw-input-row" id="row-${rowId}">
            <select class="form-control raw-select">${options}</select>
            <input type="number" step="0.001" class="form-control raw-qty" placeholder="الكمية" required>
            <select class="form-control raw-unit">
                <option value="kg">كجم</option>
                <option value="g">جرام</option>
            </select>
            <span class="remove-row-btn" onclick="document.getElementById('row-${rowId}').remove()"><i class="fa-solid fa-xmark"></i></span>
        </div>
    `;
    container.insertAdjacentHTML('beforeend', rowHTML);
}

function saveProduct(e) {
    e.preventDefault();
    const name = document.getElementById('productName').value.trim();
    const baseVol = parseFloat(document.getElementById('baseVolume').value);
    
    const rows = document.querySelectorAll('.raw-input-row');
    let formula = [];

    rows.forEach(row => {
        const rawId = parseFloat(row.querySelector('.raw-select').value);
        const qty = parseFloat(row.querySelector('.raw-qty').value);
        const unit = row.querySelector('.raw-unit').value;
        const qtyInKg = unit === 'g' ? qty / 1000 : qty;

        if (!isNaN(qtyInKg)) {
            formula.push({ rawId, qtyInKg });
        }
    });

    if (formula.length > 0) {
        products.push({ id: Date.now(), name, baseVol, formula });
        localStorage.setItem('products', JSON.stringify(products));
        playWaterSound();
        goToMain();
    }
}

// --- 4. حساب وتصنيع الوجبات مع الملاحظات ---
function prepareManufactureScreen() {
    const select = document.getElementById('selectProduct');
    select.innerHTML = '<option value="">-- اختر الخلطة --</option>';
    products.forEach(p => {
        select.innerHTML += `<option value="${p.id}">${p.name} (مرجع: ${p.baseVol}L)</option>`;
    });
    document.getElementById('calculationResult').innerHTML = '';
}

function calculateBatch() {
    const productId = parseFloat(document.getElementById('selectProduct').value);
    const targetVol = parseFloat(document.getElementById('targetVolume').value);
    const notes = document.getElementById('batchNotes').value.trim();
    const resultDiv = document.getElementById('calculationResult');

    if (!productId || !targetVol || targetVol <= 0) {
        resultDiv.innerHTML = '';
        return;
    }

    const product = products.find(p => p.id === productId);
    if (!product) return;

    const ratio = targetVol / product.baseVol;
    let totalPrice = 0;
    let rowsHTML = '';

    product.formula.forEach(item => {
        const raw = rawMaterials.find(r => r.id === item.rawId);
        const rawName = raw ? raw.name : 'خامة غير معروفة';
        const rawPrice = raw ? raw.price : 0;

        const requiredKg = item.qtyInKg * ratio;
        const cost = requiredKg * rawPrice;
        totalPrice += cost;

        let displayQty = requiredKg >= 1 
            ? requiredKg.toFixed(2) + ' كجم' 
            : (requiredKg * 1000).toFixed(0) + ' جرام';

        rowsHTML += `
            <tr>
                <td><strong>${rawName}</strong></td>
                <td>${displayQty}</td>
                <td style="color:#38bdf8">${cost.toFixed(2)} ج.م</td>
            </tr>
        `;
    });

    const costPerLiter = totalPrice / targetVol;

    // طباعة الملاحظات إن وجدت
    const notesHTML = notes ? `
        <div class="notes-display-box">
            <strong><i class="fa-solid fa-clipboard-list"></i> ملاحظات التشغيل:</strong>
            ${notes.replace(/\n/g, '<br>')}
        </div>
    ` : '';

    resultDiv.innerHTML = `
        <div class="result-box">
            <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--border); padding-bottom:10px;">
                <div>
                    <h3 style="color:#38bdf8;">${product.name}</h3>
                    <small style="color:var(--text-muted)">الكمية المطلوبة: ${targetVol} لتر</small>
                </div>
                <div style="text-align:left;">
                    <span style="font-size:18px; font-weight:800; color:#34d399;">${totalPrice.toFixed(2)} ج.م</span><br>
                    <small style="color:var(--text-muted)">التكلفة/لتر: ${costPerLiter.toFixed(2)} ج.م</small>
                </div>
            </div>

            <table class="result-table">
                <thead>
                    <tr>
                        <th>الخامة</th>
                        <th>المقدار المطلوب</th>
                        <th>التكلفة</th>
                    </tr>
                </thead>
                <tbody>
                    ${rowsHTML}
                </tbody>
            </table>

            ${notesHTML}

            <button class="btn btn-success" onclick="window.print()" style="margin-top:15px;">
                <i class="fa-solid fa-print"></i> طباعة أمر الإنتاج
            </button>
        </div>
    `;
}