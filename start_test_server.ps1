# Verificar si Python está instalado
$pythonVersion = python --version 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "Python no está instalado. Por favor, instala Python desde https://www.python.org/downloads/"
    exit 1
}

# Iniciar el servidor HTTP
Write-Host "Iniciando servidor de pruebas en http://localhost:8000"
Write-Host "Abre http://localhost:8000/test/SpecRunner.html en tu navegador"
Write-Host "Presiona Ctrl+C para detener el servidor"
python -m http.server 8000 