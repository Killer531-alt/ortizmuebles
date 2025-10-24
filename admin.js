// Constantes
const API_BASE = 'https://sofasback.onrender.com/api';
let isLoggedIn = false;

// Al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    initializeAdminUI();
    setupEventListeners();
    checkAuthStatus();
});

// Inicialización de UI
function initializeAdminUI() {
    updateAdminVisibility();
    setupAdminTabs();
    setupFormOverlays();
}

// Actualizar visibilidad de elementos admin
function updateAdminVisibility() {
    document.querySelectorAll('.hidden-admin').forEach(el => {
        el.classList.toggle('hidden-admin', !isLoggedIn);
    });
}

// Configurar pestañas admin
function setupAdminTabs() {
    const adminTabs = document.querySelectorAll('.admin-tab');
    adminTabs.forEach(tab => {
        tab.addEventListener('click', () => switchAdminTab(tab));
    });
}

// Cambiar pestaña activa
function switchAdminTab(tab) {
    // Desactivar todas las pestañas
    document.querySelectorAll('.admin-tab').forEach(t => 
        t.classList.remove('active')
    );
    
    // Activar la pestaña clickeada
    tab.classList.add('active');

    // Ocultar todos los paneles
    document.querySelectorAll('.admin-panel').forEach(panel => 
        panel.style.display = 'none'
    );

    // Mostrar el panel correspondiente
    const panelId = `${tab.dataset.tab}-panel`;
    const panel = document.getElementById(panelId);
    if (panel) {
        panel.style.display = 'block';
        refreshPanelData(tab.dataset.tab);
    }
}

// Refrescar datos del panel activo
function refreshPanelData(tabName) {
    switch(tabName) {
        case 'inventario':
            fetchInventario();
            break;
        case 'facturacion':
            fetchFacturas();
            break;
        case 'pedidos':
            fetchPedidos();
            break;
    }
}

// Configurar overlays de formularios
function setupFormOverlays() {
    // Mostrar formulario de nuevo material
    const btnNuevoMaterial = document.getElementById('btn-nuevo-material');
    if (btnNuevoMaterial) {
        btnNuevoMaterial.addEventListener('click', () => {
            showFormOverlay('form-overlay');
        });
    }

    // Mostrar formulario de nueva factura
    const btnNuevaFactura = document.getElementById('btn-nueva-factura');
    if (btnNuevaFactura) {
        btnNuevaFactura.addEventListener('click', () => {
            showFormOverlay('factura-form-overlay');
        });
    }

    // Cerrar overlays al hacer clic fuera
    document.querySelectorAll('.form-overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                hideFormOverlay(overlay.id);
            }
        });
    });
}

// Mostrar overlay de formulario
function showFormOverlay(overlayId) {
    const overlay = document.getElementById(overlayId);
    if (overlay) {
        overlay.style.display = 'flex';
        const form = overlay.querySelector('form');
        if (form) form.reset();
    }
}

// Ocultar overlay de formulario
function hideFormOverlay(overlayId) {
    const overlay = document.getElementById(overlayId);
    if (overlay) {
        overlay.style.display = 'none';
    }
}

// Verificar estado de autenticación
function checkAuthStatus() {
    const token = localStorage.getItem('authToken');
    if (token) {
        isLoggedIn = true;
        updateLoginButton(true);
        updateAdminVisibility();
        refreshAllData();
    }
}

// Actualizar botón de login
function updateLoginButton(loggedIn) {
    const loginButton = document.getElementById('login-button');
    if (loginButton) {
        loginButton.textContent = loggedIn ? 'Panel Admin' : 'Iniciar Sesión';
        loginButton.style.backgroundColor = loggedIn ? '#556B2F' : '';
    }
}

// Refrescar todos los datos
function refreshAllData() {
    Promise.all([
        fetchInventario(),
        fetchFacturas(),
        fetchPedidos()
    ]).catch(err => console.error('Error cargando datos:', err));
}

// Configurar event listeners
function setupEventListeners() {
    setupLoginForm();
    setupInventarioForm();
    setupFacturaForm();
    setupSearchFilters();
}

// === FUNCIONES DE API ===

// Fetch con autenticación
async function fetchWithAuth(url, options = {}) {
    const token = localStorage.getItem('authToken');
    if (token) {
        options.headers = {
            ...options.headers,
            'Authorization': `Bearer ${token}`
        };
    }
    return fetch(url, options);
}

// Manejo de errores de fetch
async function handleFetchError(response) {
    if (!response.ok) {
        const error = await response.json().catch(() => ({
            error: 'Error de red'
        }));
        throw new Error(error.message || 'Error en la solicitud');
    }
    return response.json();
}

// Cargar inventario
async function fetchInventario() {
    try {
        const res = await fetchWithAuth(`${API_BASE}/inventario`);
        const items = await handleFetchError(res);
        renderInventarioTable(items);
    } catch (err) {
        console.error('Error al cargar inventario:', err);
        alert('Error al cargar inventario');
    }
}

// Cargar facturas
async function fetchFacturas() {
    try {
        const res = await fetchWithAuth(`${API_BASE}/factura`);
        const facturas = await handleFetchError(res);
        renderFacturasTable(facturas);
    } catch (err) {
        console.error('Error al cargar facturas:', err);
        alert('Error al cargar facturas');
    }
}

// Cargar pedidos
async function fetchPedidos() {
    try {
        const res = await fetchWithAuth(`${API_BASE}/pedido`);
        const pedidos = await handleFetchError(res);
        renderPedidosTable(pedidos);
    } catch (err) {
        console.error('Error al cargar pedidos:', err);
        alert('Error al cargar pedidos');
    }
}

// === RENDERIZADO DE TABLAS ===

// Renderizar tabla de inventario
function renderInventarioTable(items) {
    const tbody = document.getElementById('inventario-table-body');
    if (!tbody) return;

    tbody.innerHTML = items.map(item => `
        <tr>
            <td>${item.nombre}</td>
            <td>${item.categoria}</td>
            <td>${item.cantidad} ${item.unidad || 'unidades'}</td>
            <td>$${item.precio?.toLocaleString()}</td>
            <td>
                <button class="admin-action-btn" data-id="${item._id}" data-action="edit">
                    ✏️
                </button>
                <button class="admin-action-btn" data-id="${item._id}" data-action="delete" style="background:#dc3545">
                    🗑️
                </button>
            </td>
        </tr>
    `).join('');
}

// Renderizar tabla de facturas
function renderFacturasTable(facturas) {
    const tbody = document.getElementById('factura-table-body');
    if (!tbody) return;

    tbody.innerHTML = facturas.map(factura => `
        <tr>
            <td>#${factura._id.slice(-6)}</td>
            <td>${factura.cliente}</td>
            <td>${new Date(factura.fecha).toLocaleDateString()}</td>
            <td>$${factura.total?.toLocaleString()}</td>
            <td><span class="badge ${factura.estado}">${factura.estado}</span></td>
            <td>
                <button class="admin-action-btn" data-id="${factura._id}" data-action="view">👁️</button>
                <button class="admin-action-btn" data-id="${factura._id}" data-action="pdf">📄</button>
                ${factura.estado === 'pendiente' ? `
                    <button class="admin-action-btn" data-id="${factura._id}" data-action="estado">✓</button>
                    <button class="admin-action-btn" data-id="${factura._id}" data-action="delete" style="background:#dc3545">🗑️</button>
                ` : ''}
            </td>
        </tr>
    `).join('');
}

// Renderizar tabla de pedidos
function renderPedidosTable(pedidos) {
    const tbody = document.getElementById('pedidos-table-body');
    if (!tbody) return;

    tbody.innerHTML = pedidos.map(pedido => `
        <tr>
            <td>#${pedido._id.slice(-6)}</td>
            <td>${pedido.cliente}</td>
            <td>${pedido.producto}</td>
            <td><span class="badge ${pedido.estado}">${pedido.estado}</span></td>
            <td>
                <button class="admin-action-btn" data-id="${pedido._id}" data-action="view">👁️</button>
                <button class="admin-action-btn" data-id="${pedido._id}" data-action="edit">✏️</button>
                ${pedido.estado !== 'completado' ? `
                    <button class="admin-action-btn" data-id="${pedido._id}" data-action="estado">✓</button>
                ` : ''}
            </td>
        </tr>
    `).join('');
}