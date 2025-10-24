document.addEventListener('DOMContentLoaded', () => {
    
    // ===========================================
    // LÓGICA DE ESTADO DE AUTENTICACIÓN
    // ===========================================
    let isLoggedIn = false; // Estado inicial: NO logueado

    const loginAlert = document.getElementById('login-alert');
    const adminElements = document.querySelectorAll('.hidden-admin');
    
    function showLoginAlert() {
        loginAlert.classList.remove('hidden-alert');
        setTimeout(() => {
            loginAlert.classList.add('hidden-alert');
        }, 4000);
    }

    function updateAdminVisibility() {
        adminElements.forEach(el => {
            if (isLoggedIn) {
                el.classList.remove('hidden-admin');
            } else {
                el.classList.add('hidden-admin');
            }
        });
    }

    // Ocultar elementos admin al inicio
    updateAdminVisibility();
    
    const citaForm = document.getElementById('cita-form');
    const catalogoForm = document.getElementById('catalogo-form');
    const refaccionForm = document.getElementById('refaccion-form');
    const registroForm = document.getElementById('registro-form');
    const loginForm = document.getElementById('login-form');

    // Función de validación de LOGIN y manejo de token
    function validateLogin(event) {
        if (!isLoggedIn) {
            event.preventDefault(); 
            showLoginAlert(); 
            return false;
        }
        return true;
    }

    // Verificar si hay token guardado al cargar
    const savedToken = localStorage.getItem('authToken');
    if (savedToken) {
        isLoggedIn = true;
        const loginButton = document.getElementById('login-button');
        if (loginButton) {
            loginButton.textContent = 'Bienvenido(a)';
            loginButton.style.backgroundColor = '#556B2F';
            loginButton.style.pointerEvents = 'none';
        }
        updateAdminVisibility();
        fetchInventario();
        fetchFacturas();
    }

    // Añadir token a las llamadas fetch si existe
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

    // Lógica de Login/Registro 
    if (loginForm) {
        loginForm.addEventListener('submit', function(event) {
            event.preventDefault(); 
            isLoggedIn = true; 
            const loginButton = document.getElementById('login-button');
            loginButton.textContent = 'Bienvenido(a)';
            loginButton.style.backgroundColor = '#556B2F'; 
            loginButton.style.pointerEvents = 'none'; 
            updateAdminVisibility(); // Mostrar elementos admin
            fetchInventario(); // Cargar datos iniciales
            fetchFacturas();
            alert('¡Inicio de Sesión simulado exitoso! Ahora puedes acceder al panel administrativo.');
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

    // ===========================================
    // ADMIN: INTEGRACIÓN CON API (Inventario / Facturación)
    // ===========================================

    // Cambia este API_BASE si tu backend corre en otra URL/puerto
    const API_BASE = window.API_BASE || 'https://ortiz-backend-dev.onrender.com/api';

    // --- Helpers ---
    function handleFetchError(res) {
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
        return res.json();
    }

    // --- INVENTARIO ---
    const invTableBody = document.querySelector('#inventory-table tbody');
    const inventarioForm = document.getElementById('inventario-form');
    const refreshInventarioBtn = document.getElementById('refresh-inventario');

    async function fetchInventario() {
        try {
            const res = await fetchWithAuth(`${API_BASE}/inventario`);
            const data = await handleFetchError(res);
            inventarioCache = data; // Actualizar cache
            renderInventario(data);
        } catch (err) {
            if (err.message.includes('401')) {
                alert('Sesión expirada. Por favor, inicia sesión nuevamente.');
                localStorage.removeItem('authToken');
                isLoggedIn = false;
                updateAdminVisibility();
            } else {
                alert('Error al obtener inventario: ' + err.message);
            }
        }
    }

    function renderInventario(items) {
        if (!invTableBody) return;
        invTableBody.innerHTML = '';
        items.forEach(item => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${item.nombre || ''}</td>
                <td>${item.categoria || ''}</td>
                <td>${item.cantidad ?? 0}</td>
                <td>${item.punto_reorden ?? 0}</td>
                <td>${formatPrice(item.precio) ?? ''}</td>
                <td>
                    <button class="admin-action-btn" data-action="edit" data-id="${item._id}">Editar</button>
                    <button class="admin-action-btn" data-action="delete" data-id="${item._id}">Eliminar</button>
                    <button class="admin-action-btn" data-action="facturar" data-id="${item._id}">Facturar</button>
                </td>
            `;
            invTableBody.appendChild(tr);
        });
    }

    if (refreshInventarioBtn) refreshInventarioBtn.addEventListener('click', (e) => { e.preventDefault(); fetchInventario(); });

    if (inventarioForm) {
        inventarioForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const payload = {
                nombre: document.getElementById('inv_nombre').value,
                categoria: document.getElementById('inv_categoria').value,
                cantidad: Number(document.getElementById('inv_cantidad').value) || 0,
                punto_reorden: Number(document.getElementById('inv_punto_reorden').value) || 0,
                precio: Number(document.getElementById('inv_precio').value) || 0
            };
            try {
                const res = await fetch(`${API_BASE}/inventario`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                const data = await handleFetchError(res);
                inventarioForm.reset();
                fetchInventario();
                alert('Material agregado con éxito');
            } catch (err) {
                alert('Error al crear material: ' + err.message);
            }
        });
    }

    // Delegación para acciones Edit/Delete en tabla de inventario
    if (invTableBody) {
        invTableBody.addEventListener('click', async function(event) {
            const btn = event.target.closest('button');
            if (!btn) return;
            const id = btn.dataset.id;
            const action = btn.dataset.action;
            
            if (action === 'facturar') {
                // Cambiar a la pestaña de facturación
                document.querySelector('[data-tab="facturacion"]').click();
                // Buscar el producto en cache
                const producto = inventarioCache.find(p => p._id === id);
                if (producto) {
                    // Añadir item pre-llenado
                    addFacturaItem(producto);
                    // Scroll al formulario
                    facturaForm.scrollIntoView({ behavior: 'smooth' });
                }
            } else if (action === 'delete') {
                if (!confirm('Eliminar material del inventario?')) return;
                try {
                    const res = await fetch(`${API_BASE}/inventario/${id}`, { method: 'DELETE' });
                    await handleFetchError(res);
                    fetchInventario();
                    alert('Material eliminado');
                } catch (err) {
                    alert('Error al eliminar: ' + err.message);
                }
            } else if (action === 'edit') {
                // Para mantener simple: cargar valores en el formulario y hacer PUT al enviar
                try {
                    const res = await fetch(`${API_BASE}/inventario/${id}`);
                    const material = await handleFetchError(res);
                    document.getElementById('inv_nombre').value = material.nombre || '';
                    document.getElementById('inv_categoria').value = material.categoria || '';
                    document.getElementById('inv_cantidad').value = material.cantidad ?? 0;
                    document.getElementById('inv_punto_reorden').value = material.punto_reorden ?? 0;
                    document.getElementById('inv_precio').value = material.precio ?? 0;

                    // Cambiar el comportamiento del form temporalmente
                    const submitBtn = inventarioForm.querySelector('button[type="submit"]');
                    const originalHandler = submitBtn.onclick;

                    submitBtn.textContent = 'Guardar cambios';

                    const saveHandler = async (ev) => {
                        ev.preventDefault();
                        const payload = {
                            nombre: document.getElementById('inv_nombre').value,
                            categoria: document.getElementById('inv_categoria').value,
                            cantidad: Number(document.getElementById('inv_cantidad').value) || 0,
                            punto_reorden: Number(document.getElementById('inv_punto_reorden').value) || 0,
                            precio: Number(document.getElementById('inv_precio').value) || 0
                        };
                        try {
                            const r = await fetch(`${API_BASE}/inventario/${id}`, {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify(payload)
                            });
                            await handleFetchError(r);
                            submitBtn.textContent = 'Agregar';
                            inventarioForm.reset();
                            // restore
                            submitBtn.removeEventListener('click', saveHandler);
                            fetchInventario();
                            alert('Material actualizado');
                        } catch (err) {
                            alert('Error al actualizar: ' + err.message);
                        }
                    };

                    submitBtn.addEventListener('click', saveHandler);

                    // After 20s, reset the button to avoid stuck state
                    setTimeout(() => {
                        submitBtn.textContent = 'Agregar';
                    }, 20000);

                } catch (err) {
                    alert('Error al cargar material: ' + err.message);
                }
            }
        });
    }

    // --- FACTURACION ---
    const facturaTableBody = document.querySelector('#factura-table tbody');
    const facturaForm = document.getElementById('factura-form');
    const refreshFacturasBtn = document.getElementById('refresh-facturas');
    const addItemBtn = document.getElementById('add-item-btn');
    const itemsContainer = document.getElementById('items-container');
    const itemTemplate = document.getElementById('item-template');

    // Mantener cache del inventario para selector de productos
    let inventarioCache = [];
    
    function formatPrice(amount) {
        return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(amount);
    }

    // Actualizar totales de la factura
    function updateFacturaTotales() {
        let subtotal = 0;
        document.querySelectorAll('.factura-item').forEach(item => {
            const total = Number(item.querySelector('.item-total').value) || 0;
            subtotal += total;
        });
        const iva = subtotal * 0.19;
        const total = subtotal + iva;

        document.getElementById('factura-subtotal').textContent = formatPrice(subtotal);
        document.getElementById('factura-iva').textContent = formatPrice(iva);
        document.getElementById('factura-total').textContent = formatPrice(total);
    }

    // Manejar cambios en items de factura
    function handleItemChange(itemElement) {
        const productoSelect = itemElement.querySelector('.item-producto');
        const cantidadInput = itemElement.querySelector('.item-cantidad');
        const precioInput = itemElement.querySelector('.item-precio');
        const totalInput = itemElement.querySelector('.item-total');

        const producto = inventarioCache.find(p => p._id === productoSelect.value);
        if (producto) {
            precioInput.value = producto.precio || 0;
            const cantidad = Number(cantidadInput.value) || 0;
            totalInput.value = (producto.precio || 0) * cantidad;
            updateFacturaTotales();
        }
    }

    // Agregar nuevo item a la factura
    function addFacturaItem(producto = null) {
        const itemElement = itemTemplate.content.cloneNode(true).children[0];
        const select = itemElement.querySelector('.item-producto');
        
        // Llenar selector con inventario
        inventarioCache.forEach(item => {
            const option = document.createElement('option');
            option.value = item._id;
            option.textContent = `${item.nombre} (Stock: ${item.cantidad})`;
            select.appendChild(option);
        });

        // Si se pasó un producto, seleccionarlo
        if (producto) {
            select.value = producto._id;
        }

        // Event listeners
        select.addEventListener('change', () => handleItemChange(itemElement));
        itemElement.querySelector('.item-cantidad').addEventListener('input', () => handleItemChange(itemElement));
        itemElement.querySelector('.remove-item-btn').addEventListener('click', () => {
            itemElement.remove();
            updateFacturaTotales();
        });

        itemsContainer.appendChild(itemElement);
        handleItemChange(itemElement);
    }

    if (addItemBtn) {
        addItemBtn.addEventListener('click', () => addFacturaItem());
    }

    async function fetchFacturas() {
        try {
            const res = await fetch(`${API_BASE}/factura`);
            const data = await handleFetchError(res);
            renderFacturas(data);
        } catch (err) {
            alert('Error al obtener facturas: ' + err.message);
        }
    }

    function computeTotal(factura) {
        if (!factura.items) return 0;
        return factura.items.reduce((s, it) => s + ((it.precio || 0) * (it.cantidad || 0)), 0);
    }

    function renderFacturas(items) {
        if (!facturaTableBody) return;
        facturaTableBody.innerHTML = '';
        items.forEach(f => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${f.numero_factura || f._id}</td>
                <td>${f.cliente || f.nombre_cliente || ''}</td>
                <td>${new Date(f.fecha_emision || f.createdAt || Date.now()).toLocaleDateString()}</td>
                <td>${computeTotal(f)}</td>
                <td>${f.estado || 'pendiente'}</td>
                <td>
                    <button class="admin-action-btn" data-action="view" data-id="${f._id}">Ver</button>
                    <button class="admin-action-btn" data-action="pdf" data-id="${f._id}">PDF</button>
                    <button class="admin-action-btn" data-action="estado" data-id="${f._id}">Marcar Pagada</button>
                    <button class="admin-action-btn" data-action="delete" data-id="${f._id}">Cancelar</button>
                </td>
            `;
            facturaTableBody.appendChild(tr);
        });
    }

    if (refreshFacturasBtn) refreshFacturasBtn.addEventListener('click', (e) => { e.preventDefault(); fetchFacturas(); });

    if (facturaForm) {
        facturaForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const payload = {
                cliente: document.getElementById('fac_cliente').value,
                telefono: document.getElementById('fac_telefono').value,
                email: document.getElementById('fac_email').value,
                direccion: document.getElementById('fac_direccion').value,
                items: []
            };

            // Recolectar items del formulario
            document.querySelectorAll('.factura-item').forEach(item => {
                const producto = item.querySelector('.item-producto').value;
                const cantidad = Number(item.querySelector('.item-cantidad').value);
                const precio = Number(item.querySelector('.item-precio').value);
                
                if (producto && cantidad && precio) {
                    payload.items.push({ producto, cantidad, precio });
                }
            });

            if (!payload.items.length) {
                alert('Agrega al menos un item a la factura');
                return;
            }
            try {
                const res = await fetch(`${API_BASE}/factura`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                const data = await handleFetchError(res);
                facturaForm.reset();
                fetchFacturas();
                alert('Factura creada');
            } catch (err) {
                alert('Error al crear factura: ' + err.message);
            }
        });
    }

    if (facturaTableBody) {
        facturaTableBody.addEventListener('click', async function(event) {
            const btn = event.target.closest('button');
            if (!btn) return;
            const id = btn.dataset.id;
            const action = btn.dataset.action;
            if (action === 'pdf') {
                // Abrir en nueva ventana para que el navegador gestione la descarga
                window.open(`${API_BASE}/factura/${id}/pdf`, '_blank');
            } else if (action === 'estado') {
                if (!confirm('Marcar factura como PAGADA?')) return;
                try {
                    const res = await fetch(`${API_BASE}/factura/${id}/estado`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ estado: 'pagada' })
                    });
                    await handleFetchError(res);
                    fetchFacturas();
                    alert('Factura marcada como pagada');
                } catch (err) {
                    alert('Error al actualizar estado: ' + err.message);
                }
            } else if (action === 'delete') {
                if (!confirm('Cancelar factura? (si está pagada, se devolverá inventario)')) return;
                try {
                    const res = await fetch(`${API_BASE}/factura/${id}`, { method: 'DELETE' });
                    await handleFetchError(res);
                    fetchFacturas();
                    alert('Factura cancelada');
                } catch (err) {
                    alert('Error al cancelar: ' + err.message);
                }
            } else if (action === 'view') {
                try {
                    const res = await fetch(`${API_BASE}/factura/${id}`);
                    const factura = await handleFetchError(res);
                    // Mostrar en modal simple
                    alert(`Factura: ${factura._id}\nCliente: ${factura.cliente || factura.nombre_cliente}\nTotal: ${computeTotal(factura)}`);
                } catch (err) {
                    alert('Error al obtener factura: ' + err.message);
                }
            }
        });
    }

    // --- Admin tabs ---
    const adminTabs = document.querySelectorAll('.admin-tab');
    adminTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            adminTabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            const tabName = this.dataset.tab;
            document.getElementById('inventario-panel').style.display = (tabName === 'inventario') ? 'block' : 'none';
            document.getElementById('facturacion-panel').style.display = (tabName === 'facturacion') ? 'block' : 'none';
        });
    });

    // Inicializar datos en panel admin
    fetchInventario();
    fetchFacturas();

});
