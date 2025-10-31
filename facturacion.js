// Constants
const API_BASE = 'https://sofasback.onrender.com/api';

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    setupFacturacionHandlers();
    setupEventListeners();
});

// Facturación Setup
function setupFacturacionHandlers() {
    const btnNuevaFactura = document.getElementById('btn-nueva-factura');
    if (btnNuevaFactura) {
        btnNuevaFactura.addEventListener('click', () => showFormOverlay('factura-form-overlay'));
    }

    const facturaForm = document.getElementById('factura-form');
    if (facturaForm) {
        facturaForm.addEventListener('submit', handleFacturaSubmit);
    }

        const filtroEstado = document.getElementById('filtro-estado');
    if (filtroEstado) {
        filtroEstado.addEventListener('change', () => refreshFacturas());
    }

    // Inicializar tabla de items
    setupItemsTable();
}

// Items Table Handler
function setupItemsTable() {
    loadInventarioForSelect();
}

async function loadInventarioForSelect() {
    try {
        const response = await fetch(`${API_BASE}/inventario`);
        inventario = await response.json();
        
        // Cache para usar en la selección de productos
        window.inventarioItems = inventario;
    } catch (error) {
        console.error('Error al cargar inventario:', error);
    }
}

function agregarItem() {
    const tbody = document.querySelector('#items-table tbody');
    const rowCount = tbody.children.length;
    
    const row = document.createElement('tr');
    row.innerHTML = `
        <td>
            <select name="item_id" class="item-select" onchange="updatePrecio(this)" required>
                <option value="">Seleccione un producto</option>
                ${window.inventarioItems.map(item => 
                    `<option value="${item._id}" data-precio="${item.precio}">${item.nombre}</option>`
                ).join('')}
            </select>
        </td>
        <td>
            <input type="number" name="cantidad" min="1" value="1" onchange="updateSubtotal(this.parentElement.parentElement)" required>
        </td>
        <td>
            <input type="number" name="precio" readonly>
        </td>
        <td>
            <input type="number" name="subtotal" readonly>
        </td>
        <td>
            <button type="button" class="btn-remove" onclick="removeItem(this)">✕</button>
        </td>
    `;
    
    tbody.appendChild(row);
}

function updatePrecio(select) {
    const row = select.parentElement.parentElement;
    const option = select.selectedOptions[0];
    const precio = option.dataset.precio;
    row.querySelector('[name="precio"]').value = precio;
    updateSubtotal(row);
}

function updateSubtotal(row) {
    const cantidad = row.querySelector('[name="cantidad"]').value;
    const precio = row.querySelector('[name="precio"]').value;
    const subtotal = cantidad * precio;
    row.querySelector('[name="subtotal"]').value = subtotal;
    updateTotales();
}

function updateTotales() {
    let subtotal = 0;
    document.querySelectorAll('#items-table tbody tr').forEach(row => {
        subtotal += parseFloat(row.querySelector('[name="subtotal"]').value || 0);
    });
    
    const iva = subtotal * 0.19;
    const total = subtotal + iva;
    
    document.getElementById('subtotal').textContent = subtotal.toFixed(2);
    document.getElementById('iva').textContent = iva.toFixed(2);
    document.getElementById('total').textContent = total.toFixed(2);
}

function removeItem(btn) {
    btn.parentElement.parentElement.remove();
    updateTotales();
}

// Form Submit Handler
async function handleFacturaSubmit(e) {
    e.preventDefault();
    
    const facturaData = {
        cliente: {
            nombre: document.getElementById('cliente_nombre').value,
            correo: document.getElementById('cliente_correo').value,
            telefono: document.getElementById('cliente_telefono').value,
            direccion: document.getElementById('cliente_direccion').value
        },
        items: [],
        metodo_pago: document.getElementById('metodo_pago').value
    };
    
    // Recolectar items
    document.querySelectorAll('#items-table tbody tr').forEach(row => {
        const item = {
            producto: row.querySelector('[name="item_id"]').value,
            cantidad: parseInt(row.querySelector('[name="cantidad"]').value),
            precio_unitario: parseFloat(row.querySelector('[name="precio"]').value),
            subtotal: parseFloat(row.querySelector('[name="subtotal"]').value)
        };
        facturaData.items.push(item);
    });
    
    // Calcular totales
    facturaData.subtotal = parseFloat(document.getElementById('subtotal').textContent);
    facturaData.iva = parseFloat(document.getElementById('iva').textContent);
    facturaData.total = parseFloat(document.getElementById('total').textContent);
    
    try {
        const response = await fetch(`${API_BASE}/factura`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(facturaData)
        });
        
        if (!response.ok) throw new Error('Error al crear la factura');
        
        const nuevaFactura = await response.json();
        
        // Descargar PDF
        await downloadFacturaPDF(nuevaFactura._id);
        
        // Limpiar formulario y cerrar overlay
        e.target.reset();
        document.querySelector('#items-table tbody').innerHTML = '';
        updateTotales();
        hideFormOverlay('factura-form-overlay');
        
        // Refrescar lista de facturas
        refreshFacturas();
        
        alert('Factura creada exitosamente');
    } catch (error) {
        console.error('Error:', error);
        alert('Error al crear la factura. Por favor intente nuevamente.');
    }
}

// Download PDF
async function downloadFacturaPDF(facturaId) {
    try {
        const response = await fetch(`${API_BASE}/factura/${facturaId}/pdf`);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `factura-${facturaId}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Error al descargar PDF:', error);
        alert('Error al descargar el PDF. Por favor intente nuevamente.');
    }
}

// Refresh Facturas Table
async function refreshFacturas() {
    try {
            const filtroEstado = document.getElementById('filtro-estado').value;
        let url = `${API_BASE}/factura`;
        if (filtroEstado) {
            url += `?estado=${filtroEstado}`;
        }
        
        const response = await fetch(url);
        const facturas = await response.json();
        
            const tbody = document.querySelector('#factura-table-body');
        if (tbody) {
            tbody.innerHTML = facturas.map(factura => `
                <tr>
                    <td>${factura.numero_factura}</td>
                    <td>${factura.cliente.nombre}</td>
                    <td>${new Date(factura.fecha_emision).toLocaleDateString()}</td>
                    <td>$${factura.total.toLocaleString()}</td>
                    <td>
                        <span class="estado-badge ${factura.estado}">${factura.estado}</span>
                    </td>
                    <td>
                        <button class="admin-action-btn" onclick="downloadFacturaPDF('${factura._id}')">
                            Descargar PDF
                        </button>
                        ${factura.estado === 'pendiente' ? `
                            <button class="admin-action-btn" onclick="cambiarEstadoFactura('${factura._id}', 'pagada')">
                                Marcar Pagada
                            </button>
                        ` : ''}
                    </td>
                </tr>
            `).join('');
        }
    } catch (error) {
        console.error('Error al cargar facturas:', error);
    }
}

// Change Invoice Status
async function cambiarEstadoFactura(id, nuevoEstado) {
    try {
        const response = await fetch(`${API_BASE}/factura/${id}/estado`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ estado: nuevoEstado })
        });
        
        if (!response.ok) throw new Error('Error al actualizar estado');
        
        refreshFacturas();
    } catch (error) {
        console.error('Error:', error);
        alert('Error al actualizar el estado de la factura');
    }
}

// Utility Functions
function showFormOverlay(id) {
    document.getElementById(id).style.display = 'flex';
}

function hideFormOverlay(id) {
    document.getElementById(id).style.display = 'none';
}