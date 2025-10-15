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

    // 3. PEDIDO POR CATÁLOGO - REQUIERE LOGIN
    if (catalogoForm) {
        catalogoForm.addEventListener('submit', function(event) {
            // ❌ REQUIERE LOGIN: Si no hay sesión, se muestra el alert y se detiene el envío.
            if (!validateLogin(event)) return; 
            
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
        // Genera un número de productos aleatorio para simular un catálogo grande (15-20)
        const numProducts = Math.floor(Math.random() * (20 - 15 + 1)) + 15; 
        const categoryMap = {
            'sofases': { name: 'Sofá', tela: 'Lino Italiano', madera: 'Cedro', precio: '$850.000', medidas: 'Largo: 210cm | Ancho: 95cm | Profundidad: 80cm' },
            'poltronas': { name: 'Poltrona', tela: 'Terciopelo', madera: 'Amarilla', precio: '$400.000', medidas: 'Largo: 75cm | Ancho: 80cm | Profundidad: 90cm' },
            'cabeceros': { name: 'Cabecero', tela: 'Microfibra', madera: 'Pino', precio: '$300.000', medidas: 'Largo: 180cm | Ancho: 8cm | Profundidad: 130cm' },
            'puffs': { name: 'Puff', tela: 'Pana', madera: 'MDF', precio: '$150.000', medidas: 'Largo: 55cm | Ancho: 55cm | Profundidad: 45cm' },
            'bases': { name: 'Base Cama', tela: 'Chenille', madera: 'Roble', precio: '$600.000', medidas: 'Largo: 200cm | Ancho: 140cm | Profundidad: 30cm' },
        };
        const productBase = categoryMap[category];
        for (let i = 1; i <= numProducts; i++) {
            // RUTA DE IMAGEN CORREGIDA: Apunta a la carpeta 'Sofas/' (mayúscula)
            const imageName = `${category}_modelo_${i}.jpg`;
            const imageSrc = `Sofas/${imageName}`;
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

});
