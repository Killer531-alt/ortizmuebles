# populate_data.ps1
# PowerShell script to create 10 inventory materials and 15 invoices
# Adjust $API if your backend runs elsewhere.

$API = 'https://sofasback.onrender.com/api'

Write-Host "Using API_BASE: $API`n"

# Define 10 inventory materials
$materials = @(
    @{ nombre='Madera Cedro'; categoria='madera'; cantidad=120; unidad='metros'; precio=1200; punto_reorden=10 },
    @{ nombre='Tela Lino'; categoria='tela'; cantidad=200; unidad='metros'; precio=4500; punto_reorden=20 },
    @{ nombre='Espuma D28'; categoria='espuma'; cantidad=100; unidad='kilos'; precio=8000; punto_reorden=5 },
    @{ nombre='Herrajes Acero'; categoria='herrajes'; cantidad=500; unidad='piezas'; precio=50; punto_reorden=50 },
    @{ nombre='Pintura Premium'; categoria='pintura'; cantidad=80; unidad='litros'; precio=15000; punto_reorden=8 },
    @{ nombre='Tornillo 3mm'; categoria='herrajes'; cantidad=1000; unidad='piezas'; precio=5; punto_reorden=200 },
    @{ nombre='Madera Pino'; categoria='madera'; cantidad=150; unidad='metros'; precio=900; punto_reorden=15 },
    @{ nombre='Tela Terciopelo'; categoria='tela'; cantidad=120; unidad='metros'; precio=5200; punto_reorden=10 },
    @{ nombre='Pegamento Contacto'; categoria='adhesivo'; cantidad=60; unidad='litros'; precio=28000; punto_reorden=6 },
    @{ nombre='Barniz Satinado'; categoria='pintura'; cantidad=70; unidad='litros'; precio=20000; punto_reorden=7 }
)

$inventory = @()

Write-Host "Creating inventory items..."
foreach ($m in $materials) {
    try {
        $body = $m | ConvertTo-Json
        $resp = Invoke-RestMethod -Uri "$API/inventario" -Method Post -Body $body -ContentType 'application/json'
        $entry = [PSCustomObject]@{
            id = $resp._id
            nombre = $resp.nombre
            precio = $resp.precio
            cantidad = $resp.cantidad
        }
        $inventory += $entry
        Write-Host "Created: $($resp._id) - $($resp.nombre) (cantidad: $($resp.cantidad))"
    } catch {
        Write-Host "ERROR creating material $($m.nombre): $($_.Exception.Message)" -ForegroundColor Red
    }
}

if ($inventory.Count -eq 0) {
    Write-Host "No inventory was created. Aborting invoice creation." -ForegroundColor Yellow
    return
}

# Create 15 invoices
$clients = @('Juan Perez','María Gómez','Carlos Ruiz','Ana Martínez','Luis Torres','Sofía López','Diego Herrera','Camila Díaz','Andrés Rojas','Laura Castro','Pablo Sánchez','Natalia Vera','Ricardo Paredes','Valentina Cruz','Javier Moreno')

# maintain local stock map to avoid requesting more than available
$stock = @{}
foreach ($it in $inventory) { $stock[$it.id] = [int]$it.cantidad }

$createdFacturas = @()
Write-Host "`nCreating 15 invoices..."

for ($i=0; $i -lt 15; $i++) {
    # pick client and date
    $cliente = $clients | Get-Random
    $fecha = (Get-Date).AddDays(- (Get-Random -Minimum 0 -Maximum 30)).ToString('yyyy-MM-dd')

    # choose 1..4 distinct products
    $numItems = Get-Random -Minimum 1 -Maximum 5
    $chosen = $inventory | Get-Random -Count ([math]::Min($numItems, $inventory.Count))

    $itemsPayload = @()
    foreach ($p in $chosen) {
        $avail = $stock[$p.id]
        if ($avail -le 0) { continue }
        # choose qty between 1 and min(5, avail)
        $qty = Get-Random -Minimum 1 -Maximum ([math]::Min(5, $avail))
        $itemsPayload += @{ producto = $p.id; cantidad = $qty; precio_unitario = $p.precio }
        # decrement local stock
        $stock[$p.id] = $stock[$p.id] - $qty
    }

    if ($itemsPayload.Count -eq 0) {
        Write-Host "Skipping invoice $($i+1) because no items with stock were available." -ForegroundColor Yellow
        continue
    }

    $factBody = @{ cliente = $cliente; fecha = $fecha; items = $itemsPayload }

    try {
        $resp = Invoke-RestMethod -Uri "$API/factura" -Method Post -Body ($factBody | ConvertTo-Json -Depth 5) -ContentType 'application/json'
        $createdFacturas += $resp
        Write-Host "Created factura: $($resp._id) for $cliente with $($itemsPayload.Count) items"
    } catch {
        Write-Host "ERROR creating factura for $cliente: $($_.Exception.Message)" -ForegroundColor Red
        # If server returned a JSON error body, attempt to print it
        if ($_.Exception.Response) {
            try { $errText = $_.Exception.Response.GetResponseStream(); $sr = New-Object System.IO.StreamReader($errText); $sr.BaseStream.Position = 0; $body = $sr.ReadToEnd(); Write-Host "Server response: $body" -ForegroundColor Red } catch {}
        }
    }
}

Write-Host "`nSummary:`nInventory created: $($inventory.Count)`nFacturas created: $($createdFacturas.Count)"
Write-Host "Inventory IDs:"
$inventory | ForEach-Object { Write-Host "- $($_.id) : $($_.nombre) (remaining local stock: $($stock[$_.id]))" }

Write-Host "`nFacturas IDs:"
$createdFacturas | ForEach-Object { Write-Host "- $($_._id)" }

Write-Host "\nDone. If you need different names/prices/quantities, edit this script and run again."