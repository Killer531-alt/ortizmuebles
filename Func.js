document.addEventListener('DOMContentLoaded', () => {
    
    // ===========================================
    // LÓGICA DE ESTADO DE AUTENTICACIÓN
    // ===========================================
    let isLoggedIn = false; // Estado inicial: NO logueado

    const loginAlert = document.getElementById('login-alert');
    
    function showLoginAlert() {
        loginAlert.classList.remove('hidden-alert');
        setTimeout(() => {
            loginAlert.classList.add('hidden-alert');
        }, 4000);
    }
    
    const citaForm = document.getElementById('cita-form');
    const catalogoForm = document.getElementById('catalogo-form');
    const refaccionForm = document.getElementById('refaccion-form');
    const registroForm = document.getElementById('registro-form');
    const loginForm = document.getElementById('login-form');

    // Función de validación de LOGIN
    function validateLogin(event) {
        if (!isLoggedIn) {
            event.preventDefault(); 
            showLoginAlert(); 
            return false;
        }
        return true;
    }

    // --- FORMULARIOS ---

    // 1. CITA DIRECTA (DISEÑO DESDE CERO) - PERMITE INVITADOS
    if (citaForm) {
        citaForm.addEventListener('submit', function(event) {
            event.preventDefault(); 
            
            // ✅ ACEPTA INVITADOS: Se eliminó la validación de login.
            
            alert('¡Solicitud de Cita Enviada! Gracias. El dueño se contactará directamente contigo...');
            // *** PUNTO DE CONEXIÓN AL BACKEND (Cloud Function) ***
            // Aquí se debe implementar la llamada fetch a: POST /api/solicitar-cita
            
            citaForm.reset();
        });
    }
    
    // 2. SOLICITUD DE REFACCIÓN - PERMITE INVITADOS
    if (refaccionForm) {
        refaccionForm.addEventListener('submit', function(event) {
            event.preventDefault(); // Detiene el envío de formulario HTML por defecto

            // ✅ ACEPTA INVITADOS: Se eliminó la validación de login.
            
            alert('¡Solicitud de Refacción Enviada! Gracias. Nos contactaremos vía correo o WhatsApp para solicitar fotos del mueble y enviarte la cotización detallada. (Lógica de Backend)');
            // *** PUNTO DE CONEXIÓN AL BACKEND (Cloud Function) ***
            // Aquí se debe implementar la llamada fetch a: POST /api/solicitar-refaccion

            refaccionForm.reset();
        });
    }

    // 3. PEDIDO POR CATÁLOGO - PERMITE INVITADOS
    if (catalogoForm) {
        catalogoForm.addEventListener('submit', function(event) {
            event.preventDefault(); // Detiene el envío de formulario HTML por defecto

            alert('¡Solicitud de Personalización Enviada! Gracias. En las próximas horas recibirás un **Correo de Certificación**...');
            // *** PUNTO DE CONEXIÓN AL BACKEND (Cloud Function) ***
            // Aquí se debe implementar la llamada fetch a: POST /api/crear-pedido
            // El backend deberá gestionar el flujo de pago con PSE u otros métodos.

            catalogoForm.reset();
        });
    }

    // Lógica de Login/Registro (Solo simulación de estado para el frontend)
    if (loginForm) {
        loginForm.addEventListener('submit', function(event) {
            event.preventDefault(); 
            isLoggedIn = true; 
            const loginButton = document.getElementById('login-button');
            loginButton.textContent = 'Bienvenido(a)';
            loginButton.style.backgroundColor = '#556B2F'; 
            loginButton.style.pointerEvents = 'none'; 
            alert('¡Inicio de Sesión simulado exitoso! Ahora puedes enviar solicitudes críticas.');
            // Mostrar portal admin
            const loginCard = document.getElementById('login-card');
            const adminPortal = document.getElementById('admin-portal');
            if (loginCard) loginCard.style.display = 'none';
            if (adminPortal) adminPortal.style.display = 'block';
            // Inicializar pestañas admin y cargar datos
            setupAdminTabs();
            fetchInventario();
            fetchFacturas();
            // NOTA: El login REAL debe usar una Cloud Function para autenticación
        });
    }
    
    if (registroForm) {
        registroForm.addEventListener('submit', function(event) {
            event.preventDefault(); 
            alert('¡Registro exitoso! Ahora puedes iniciar sesión.');
            // NOTA: El registro REAL debe usar una Cloud Function o Firebase Auth
            registroForm.reset();
        });
    }
    
    // ===========================================
    // LÓGICA DE FILTRADO Y DETALLE 
    // ===========================================

    const filterMenu = document.getElementById('category-filter-menu');
    const productGrid = document.getElementById('product-grid');
    const initialTrendProductsHTML = productGrid.innerHTML; 

    const MODAL_ELEMENTS = {
        modal: document.getElementById('product-modal'),
        closeBtn: document.querySelector('.close-btn'),
        modalTitle: document.getElementById('modal-titulo'),
        modalImage: document.getElementById('modal-imagen'),
        modalTela: document.getElementById('modal-tela'),
        modalMadera: document.getElementById('modal-madera'),
        modalPrecio: document.getElementById('modal-precio'),
        modalMedidas: document.getElementById('modal-medidas') 
    };

    // Delegación de eventos: funciona para tarjetas estáticas y dinámicas
    function setupModalListeners() {
        const grid = document.getElementById('product-grid');
        if (!grid) return;
        grid.addEventListener('click', function(event) {
            const card = event.target.closest('.card');
            if (!card) return;
            const title = card.querySelector('h3') ? card.querySelector('h3').textContent : '';
            const price = card.querySelector('.precio') ? card.querySelector('.precio').textContent : '';
            // Tomar siempre la imagen real mostrada en la tarjeta
            let imageSrc = '';
            const imgEl = card.querySelector('img');
            if (imgEl && imgEl.src) {
                imageSrc = imgEl.src;
            }
            MODAL_ELEMENTS.modalImage.src = imageSrc;
            MODAL_ELEMENTS.modalImage.alt = title || 'Imagen del producto';
            const tela = card.getAttribute('data-tela') || '';
            const madera = card.getAttribute('data-madera') || '';
            const medidas = card.getAttribute('data-medidas') || '';
            MODAL_ELEMENTS.modalTitle.textContent = title;
            MODAL_ELEMENTS.modalTela.textContent = tela;
            MODAL_ELEMENTS.modalMadera.textContent = madera;
            MODAL_ELEMENTS.modalPrecio.textContent = price;
            MODAL_ELEMENTS.modalMedidas.textContent = medidas;
            MODAL_ELEMENTS.modal.classList.add('show');
        });
    }

    MODAL_ELEMENTS.closeBtn.addEventListener('click', function() {
        MODAL_ELEMENTS.modal.classList.remove('show');
    });

    window.addEventListener('click', function(event) {
        if (event.target == MODAL_ELEMENTS.modal) {
            MODAL_ELEMENTS.modal.classList.remove('show');
        }
    });

    // Función que genera el catálogo completo para cada categoría con la ruta 'sofas/'
    function generateDetailedProducts(category) {
        let html = '';
        const categoryMap = {
            'sofases': { 
                name: 'Sofá', 
                tela: 'Lino Italiano', 
                madera: 'Cedro', 
                precio: '$850.000', 
                medidas: 'Largo: 210cm | Ancho: 95cm | Profundidad: 80cm',
                images: [
                    'IMG_20181221_172501.jpg',
                    'IMG_20190201_133427.jpg',
                    'IMG_20190212_161701.jpg',
                    'IMG_20190212_162613.jpg',
                    'IMG_20200627_152532.jpg',
                    'IMG_20201120_112102.jpg',
                    'IMG_20201120_121445.jpg',
                    'IMG_20210419_161906.jpg',
                    'IMG_20210419_162106.jpg',
                    'IMG_20210419_163913.jpg',
                    'chester.JPG'
                ]
            },
            'poltronas': { 
                name: 'Poltrona', 
                tela: 'Terciopelo', 
                madera: 'Amarilla', 
                precio: '$400.000', 
                medidas: 'Largo: 75cm | Ancho: 80cm | Profundidad: 90cm',
                images: [
                    'Silla y Poltronas/IMG_20200725_115934.jpg',
                    'Silla y Poltronas/IMG_20190213_125508.jpg',
                    'Silla y Poltronas/IMG_20210511_133157.jpg',
                    'Silla y Poltronas/IMG_20200828_111812.jpg',
                    'Silla y Poltronas/IMG_20200829_093516.jpg',
                    'Silla y Poltronas/IMG_20210510_160733.jpg',
                    'Silla y Poltronas/IMG_20220122_091348.jpg',
                    'Silla y Poltronas/IMG_20220224_082104.jpg'
                ]
            },
            'cabeceros': { 
                name: 'Cabecero', 
                tela: 'Microfibra', 
                madera: 'Pino', 
                precio: '$300.000', 
                medidas: 'Largo: 180cm | Ancho: 8cm | Profundidad: 130cm',
                images: [
                    'Camas/IMG_20220616_105206.jpg',
                    'Camas/DSC_2399.JPG',
                    'Camas/DSC_0030.jpg',
                    'Camas/IMG_20220616_103602.jpg',
                    'Camas/IMG_20220616_114722.jpg',
                    'Camas/DSC_0016.JPG',
                    'Camas/DSC_0021.JPG'
                ]
            },
            'puffs': { 
                name: 'Puff', 
                tela: 'Pana', 
                madera: 'MDF', 
                precio: '$150.000', 
                medidas: 'Largo: 55cm | Ancho: 55cm | Profundidad: 45cm',
                images: [
                    'IMG_20200912_134411.jpg',
                    'IMG_20200703_150618.jpg',
                    'IMG_20220218_145625.jpg',
                    'IMG_20220218_145634.jpg',
                    'IMG_20210914_122100.jpg'
                ]
            },
            'bases': { 
                name: 'Base Cama', 
                tela: 'Chenille', 
                madera: 'Roble', 
                precio: '$600.000', 
                medidas: 'Largo: 200cm | Ancho: 140cm | Profundidad: 30cm',
                images: [
                    'Camas/IMG_20190409_124123.jpg',
                    'Camas/DSC_0030.jpg',
                    'Camas/IMG_20220204_191240.jpg',
                    'Camas/IMG_20220205_125233.jpg',
                    'Camas/IMG_20220616_114722.jpg',
                    'Camas/IMG_20220623_103619.jpg'
                ]
            }
        };
        const productBase = categoryMap[category];
        const images = productBase.images;
        const numProducts = images.length;

        for (let i = 0; i < numProducts; i++) {
            const imageSrc = `Sofas/${images[i]}`;
            const randomPrice = Math.floor(Math.random() * 500) + 200;
            const formattedPrice = (randomPrice * 1000).toLocaleString('es-CO');
            html += `
                <div class="card" 
                    data-category="${category}"
                    data-tela="${productBase.tela} Premium ${i}" 
                    data-madera="${productBase.madera} (Tipo ${i % 3 + 1})" 
                    data-precio="$${formattedPrice} (Precio base)" 
                    data-medidas="${productBase.medidas}"
                    data-imagen="${imageSrc}"
                >
                    <img src="${imageSrc}" alt="${productBase.name} ${i} - Estilo ${i % 5 + 1}" loading="lazy">
                    <h3>${productBase.name} ${i} - Estilo ${i % 5 + 1}</h3>
                    <p class="detalle-tecnico">Madera: ${productBase.madera} | Tela: ${productBase.tela}</p>
                    <p class="precio">$${formattedPrice} (Precio base)</p>
                </div>
            `;
        }
        return html;
    }

    if (filterMenu) {
        filterMenu.addEventListener('click', function(event) {
            const button = event.target.closest('button');
            if (!button || !button.dataset.filter) return; 

            const selectedCategory = button.dataset.filter;

            if (selectedCategory === 'all') {
                productGrid.innerHTML = initialTrendProductsHTML;
            } else {
                productGrid.innerHTML = generateDetailedProducts(selectedCategory);
            }

            setupModalListeners();

            filterMenu.querySelectorAll('.btn').forEach(btn => {
                btn.classList.remove('active-filter');
            });
            button.classList.add('active-filter');
        });
    }

    setupModalListeners();

    // Acción personalizada para el botón 'Solicitar Personalización' del modal
    const modal = document.getElementById('product-modal');
    modal.addEventListener('click', function(event) {
        const btn = event.target.closest('.modal-btn-pedido');
        if (btn) {
            // Cierra el modal
            modal.classList.remove('show');
            // Scroll al formulario de Solicitud de Personalización (Catálogo)
            const form = document.getElementById('catalogo-form');
            if (form) {
                form.scrollIntoView({ behavior: 'smooth', block: 'center' });
                // Opcional: enfocar el primer input del formulario
                const firstInput = form.querySelector('input,select,textarea');
                if (firstInput) firstInput.focus();
            }
        }
    });

    
    // ===========================================
    // LÓGICA DE SCROLL 
    // ===========================================
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault(); 
            const targetId = this.getAttribute('href');
            if (document.querySelector(targetId)) {
                document.querySelector(targetId).scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });

    // ------------------------
    // ADMIN: Inventario y Facturación
    // ------------------------

    function setupAdminTabs() {
        const tabs = document.querySelectorAll('.admin-tab');
        if (!tabs || tabs.length === 0) return;
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                const name = tab.dataset.tab;
                // ocultar todos los paneles
                document.querySelectorAll('.admin-table-container, .admin-panel').forEach(p => p.style.display = 'none');
                // mostrar el panel correspondiente
                let panelId = name;
                if (name === 'inventario') panelId = 'inventario-panel';
                if (name === 'facturacion') panelId = 'facturacion-panel';
                const panel = document.getElementById(panelId);
                if (panel) panel.style.display = 'block';
                if (name === 'inventario') fetchInventario();
                if (name === 'facturacion') fetchFacturas();
            });
        });
    }

    async function fetchInventario() {
        try {
            const res = await fetch(`${API_BASE}/inventario`);
            if (!res.ok) throw new Error('Error');
            const items = await res.json();
            renderInventarioTable(items);
        } catch (err) {
            console.error(err);
            const tbody = document.getElementById('inventario-table-body'); if (tbody) tbody.innerHTML = '<tr><td colspan="5">Error cargando inventario</td></tr>';
        }
    }

    function renderInventarioTable(items) {
        const tbody = document.getElementById('inventario-table-body'); if (!tbody) return;
        if (!items || items.length === 0) { tbody.innerHTML = '<tr><td colspan="5">No hay materiales</td></tr>'; return; }
        tbody.innerHTML = items.map(it => `
            <tr>
                <td>${it.nombre}</td>
                <td>${it.categoria || ''}</td>
                <td>${it.cantidad ?? 0}</td>
                <td>${it.precio ?? ''}</td>
                <td>
                    <button class="admin-action-btn" data-id="${it._id}" data-action="edit">✏️</button>
                    <button class="admin-action-btn" data-id="${it._id}" data-action="delete" style="background:#dc3545">🗑️</button>
                </td>
            </tr>
        `).join('');
    }

    // Delegación de acciones para inventario y facturas
    document.addEventListener('click', async (ev) => {
        const btn = ev.target.closest('button[data-id]');
        if (!btn) return;
        const id = btn.dataset.id;
        const action = btn.dataset.action;
        if (!id || !action) return;

        // Inventario actions
        if (action === 'delete') {
            if (!confirm('Eliminar material?')) return;
            try {
                const res = await fetch(`${API_BASE}/inventario/${id}`, { method: 'DELETE' });
                if (!res.ok) throw new Error('Error');
                fetchInventario();
            } catch (err) { alert('Error eliminando material'); }
            return;
        }
        if (action === 'edit') {
            try {
                const res = await fetch(`${API_BASE}/inventario/${id}`);
                if (!res.ok) throw new Error('Error');
                const data = await res.json();
                document.getElementById('inv_nombre').value = data.nombre || '';
                document.getElementById('inv_categoria').value = data.categoria || '';
                document.getElementById('inv_cantidad').value = data.cantidad ?? 0;
                document.getElementById('inv_precio').value = data.precio ?? '';
                document.getElementById('inventario-form').dataset.editId = id;
                document.getElementById('form-overlay').style.display = 'flex';
            } catch (err) { alert('Error cargando material'); }
            return;
        }

        // Factura actions
        if (action === 'view-f' || action === 'pdf-f' || action === 'pay-f') {
            if (action === 'view-f') {
                try {
                    const res = await fetch(`${API_BASE}/factura/${id}`);
                    if (!res.ok) throw new Error('Error');
                    const f = await res.json();
                    alert(`Factura ${f._id}\nCliente: ${f.cliente}\nTotal: ${f.total}`);
                } catch (err) { alert('Error cargando factura'); }
            } else if (action === 'pdf-f') {
                window.open(`${API_BASE}/factura/${id}/pdf`, '_blank');
            } else if (action === 'pay-f') {
                if (!confirm('Marcar como pagada?')) return;
                try {
                    const res = await fetch(`${API_BASE}/factura/${id}/estado`, { method: 'PUT', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ estado: 'pagada' }) });
                    if (!res.ok) throw new Error('Error');
                    fetchFacturas();
                } catch (err) { alert('Error actualizando estado'); }
            }
            return;
        }
    });

    // Manejo formulario inventario
    const invForm = document.getElementById('inventario-form');
    if (invForm) {
        invForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const payload = {
                nombre: document.getElementById('inv_nombre').value,
                categoria: document.getElementById('inv_categoria').value,
                cantidad: Number(document.getElementById('inv_cantidad').value) || 0,
                precio: Number(document.getElementById('inv_precio').value) || 0
            };
            const editId = invForm.dataset.editId;
            try {
                const url = editId ? `${API_BASE}/inventario/${editId}` : `${API_BASE}/inventario`;
                const method = editId ? 'PUT' : 'POST';
                const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
                if (!res.ok) throw new Error('Error');
                invForm.removeAttribute('data-edit-id');
                document.getElementById('form-overlay').style.display = 'none';
                invForm.reset();
                fetchInventario();
            } catch (err) { alert('Error guardando material'); }
        });
    }

    // Mostrar overlay al pulsar Nuevo Material o Nueva Factura (si existen botones)
    const btnNuevo = document.getElementById('btn-nuevo-material');
    if (btnNuevo) btnNuevo.addEventListener('click', () => {
        const overlay = document.getElementById('form-overlay'); if (overlay) overlay.style.display = 'flex';
    });
    const btnNuevaFact = document.getElementById('btn-nueva-factura');
    if (btnNuevaFact) btnNuevaFact.addEventListener('click', () => {
        const overlay = document.getElementById('factura-form-overlay'); if (overlay) overlay.style.display = 'flex';
    });

    // Facturas: listar y crear
    async function fetchFacturas() {
        try {
            const res = await fetch(`${API_BASE}/factura`);
            if (!res.ok) throw new Error('Error');
            const facturas = await res.json();
            const tbody = document.getElementById('factura-table-body'); if (!tbody) return;
            tbody.innerHTML = facturas.map(f => `
                <tr>
                    <td>#${f._id.slice(-6)}</td>
                    <td>${f.cliente || ''}</td>
                    <td>${new Date(f.fecha || f.fecha_emision || Date.now()).toLocaleDateString()}</td>
                    <td>${f.total ?? ''}</td>
                    <td>${f.estado || ''}</td>
                    <td>
                        <button class="admin-action-btn" data-id="${f._id}" data-action="view-f">👁️</button>
                        <button class="admin-action-btn" data-id="${f._id}" data-action="pdf-f">📄</button>
                        ${f.estado === 'pendiente' ? `<button class="admin-action-btn" data-id="${f._id}" data-action="pay-f">✓</button>` : ''}
                    </td>
                </tr>
            `).join('');
        } catch (err) {
            console.error(err);
            const tbody = document.getElementById('factura-table-body'); if (tbody) tbody.innerHTML = '<tr><td colspan="6">Error cargando facturas</td></tr>';
        }
    }

    // Agregar item en formulario factura
    const factAddBtn = document.getElementById('fact-add-item');
    if (factAddBtn) {
        factAddBtn.addEventListener('click', async () => {
            try {
                const res = await fetch(`${API_BASE}/inventario`);
                if (!res.ok) throw new Error('Error');
                const items = await res.json();
                const container = document.getElementById('fact-items-container');
                const row = document.createElement('div'); row.className = 'factura-item-row';
                row.innerHTML = `
                    <select class="fact-prod">
                        ${items.map(it => `<option value="${it._id}">${it.nombre} (${it.cantidad})</option>`).join('')}
                    </select>
                    <input type="number" class="fact-qty" min="1" value="1" />
                    <button type="button" class="remove-item-btn">✖</button>
                `;
                container.appendChild(row);
                row.querySelector('.remove-item-btn').addEventListener('click', () => row.remove());
            } catch (err) { alert('Error cargando productos'); }
        });
    }

    const facturaForm = document.getElementById('factura-form');
    if (facturaForm) {
        facturaForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const cliente = document.getElementById('fact_cliente').value;
            const fecha = document.getElementById('fact_fecha_input').value || new Date().toISOString();
            const container = document.getElementById('fact-items-container');
            const rows = container.querySelectorAll('.factura-item-row');
            if (rows.length === 0) { alert('Agrega al menos un item'); return; }
            const items = Array.from(rows).map(r => ({ producto: r.querySelector('.fact-prod').value, cantidad: Number(r.querySelector('.fact-qty').value) }));
            try {
                const res = await fetch(`${API_BASE}/factura`, { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ cliente, fecha, items }) });
                if (!res.ok) { const err = await res.json().catch(()=>({})); throw new Error(err.error || 'Error'); }
                document.getElementById('factura-form-overlay').style.display = 'none';
                facturaForm.reset(); document.getElementById('fact-items-container').innerHTML = '';
                fetchFacturas();
            } catch (err) { alert('Error creando factura'); }
        });
    }

    // inicializar pestañas si las hay
    setupAdminTabs();

});
