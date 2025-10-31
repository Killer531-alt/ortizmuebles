# test_factura.ps1
# Script para crear una factura de prueba

$API = 'https://sofasback.onrender.com/api'

# Primero, obtener algunos productos del inventario
$inventario = Invoke-RestMethod -Uri "$API/inventario" -Method Get

if ($inventario.Count -eq 0) {
    Write-Host "No hay productos en el inventario. Agregando algunos productos..." -ForegroundColor Yellow
    
    # Crear algunos productos básicos
    $productos = @(
        @{
            nombre = "Tela Premium"
            categoria = "tela"
            cantidad = 100
            unidad = "metros"
            precio = 45000
            punto_reorden = 10
        },
        @{
            nombre = "Espuma Alta Densidad"
            categoria = "espuma"
            cantidad = 50
            unidad = "metros"
            precio = 85000
            punto_reorden = 5
        }
    )

    foreach ($prod in $productos) {
        $body = $prod | ConvertTo-Json
        $resp = Invoke-RestMethod -Uri "$API/inventario" -Method Post -Body $body -ContentType 'application/json'
        Write-Host "Producto creado: $($resp._id) - $($resp.nombre)"
    }
    
    # Obtener el inventario actualizado
    $inventario = Invoke-RestMethod -Uri "$API/inventario" -Method Get
}

# Crear una factura de prueba
$factura = @{
    cliente = @{
        nombre = "Juan Pérez"
        correo = "juan.perez@example.com"
        telefono = "3157847087"
        direccion = "Calle 123 #45-67, Bogotá"
    }
    items = @(
        @{
            producto = $inventario[0]._id
            cantidad = 2
            precio_unitario = $inventario[0].precio
            subtotal = 2 * $inventario[0].precio
        },
        @{
            producto = $inventario[1]._id
            cantidad = 1
            precio_unitario = $inventario[1].precio
            subtotal = $inventario[1].precio
        }
    )
    subtotal = (2 * $inventario[0].precio + $inventario[1].precio)
    iva = (2 * $inventario[0].precio + $inventario[1].precio) * 0.19
    total = (2 * $inventario[0].precio + $inventario[1].precio) * 1.19
    metodo_pago = "efectivo"
    estado = "pagada"
}

Write-Host "`nCreando factura de prueba..."
try {
    $facturaBody = $factura | ConvertTo-Json -Depth 10
    $nuevaFactura = Invoke-RestMethod -Uri "$API/factura" -Method Post -Body $facturaBody -ContentType 'application/json'
    Write-Host "Factura creada exitosamente con ID: $($nuevaFactura._id)" -ForegroundColor Green
    Write-Host "Número de factura: $($nuevaFactura.numero_factura)"
    Write-Host "Total: $($nuevaFactura.total)"
    
    # Generar PDF
    Write-Host "`nDescargando PDF..."
    Invoke-RestMethod -Uri "$API/factura/$($nuevaFactura._id)/pdf" -Method Get -OutFile "factura-$($nuevaFactura.numero_factura).pdf"
    Write-Host "PDF guardado como: factura-$($nuevaFactura.numero_factura).pdf" -ForegroundColor Green
} catch {
    Write-Host "Error al crear la factura: $($_.Exception.Message)" -ForegroundColor Red
}