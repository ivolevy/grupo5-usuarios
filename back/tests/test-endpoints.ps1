# Script para probar endpoints GET
Write-Host "🚀 Probando endpoints GET del proyecto..." -ForegroundColor Green
Write-Host ""

$baseUrl = "http://localhost:3000"

# Función para probar endpoint
function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Url,
        [hashtable]$Headers = @{}
    )
    
    Write-Host "🔍 Probando: $Name" -ForegroundColor Yellow
    Write-Host "   URL: $Url" -ForegroundColor Gray
    
    try {
        $response = Invoke-WebRequest -Uri $Url -Method GET -Headers $Headers -ErrorAction Stop
        Write-Host "   ✅ Status: $($response.StatusCode)" -ForegroundColor Green
        
        # Mostrar respuesta si es pequeña
        if ($response.Content.Length -lt 500) {
            Write-Host "   📄 Respuesta:" -ForegroundColor Cyan
            $response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 3 | Write-Host
        } else {
            Write-Host "   📄 Respuesta: [Contenido largo - $($response.Content.Length) caracteres]" -ForegroundColor Cyan
        }
    } catch {
        Write-Host "   ❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    Write-Host ""
}

# Endpoints que no requieren autenticación
Write-Host "📋 ENDPOINTS SIN AUTENTICACIÓN" -ForegroundColor Magenta
Write-Host "=================================" -ForegroundColor Magenta

Test-Endpoint "Health Check" "$baseUrl/api/health"
Test-Endpoint "Listar Usuarios" "$baseUrl/api/usuarios"
Test-Endpoint "Pruebas de Conexión" "$baseUrl/api/test"
Test-Endpoint "Configuración" "$baseUrl/api/config"

# Endpoints que requieren autenticación
Write-Host "🔐 ENDPOINTS CON AUTENTICACIÓN" -ForegroundColor Magenta
Write-Host "=================================" -ForegroundColor Magenta

Write-Host "⚠️  Los siguientes endpoints requieren token JWT:" -ForegroundColor Yellow
Write-Host "   - /api/auth/me" -ForegroundColor Gray
Write-Host "   - /api/usuarios/profile" -ForegroundColor Gray
Write-Host "   - /api/admin/metrics" -ForegroundColor Gray
Write-Host ""

Write-Host "💡 Para obtener un token, primero haz login:" -ForegroundColor Cyan
Write-Host "   POST $baseUrl/api/auth/login" -ForegroundColor Gray
Write-Host "   Body: { `"email`": `"admin@grupousuarios.com`", `"password`": `"tu_password`" }" -ForegroundColor Gray
Write-Host ""

# Ejemplo de cómo probar con token
Write-Host "🔑 EJEMPLO CON TOKEN (reemplaza TU_TOKEN):" -ForegroundColor Magenta
Write-Host "=========================================" -ForegroundColor Magenta

$exampleToken = "TU_TOKEN_JWT_AQUI"
$authHeaders = @{
    "Authorization" = "Bearer $exampleToken"
}

Write-Host "Test-Endpoint `"Usuario Autenticado`" `"$baseUrl/api/auth/me`" `$authHeaders" -ForegroundColor Gray
Write-Host "Test-Endpoint `"Perfil Usuario`" `"$baseUrl/api/usuarios/profile`" `$authHeaders" -ForegroundColor Gray
Write-Host "Test-Endpoint `"Métricas Admin`" `"$baseUrl/api/admin/metrics`" `$authHeaders" -ForegroundColor Gray

Write-Host ""
Write-Host "✅ Pruebas completadas!" -ForegroundColor Green
