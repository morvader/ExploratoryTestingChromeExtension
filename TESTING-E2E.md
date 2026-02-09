# 🚀 Guía Rápida: Tests E2E con Playwright

## Instalación Rápida

```bash
# Ya instalado, pero por si acaso:
npm install
npx playwright install chromium
```

## Ejecutar Tests

### Opción 1: UI Mode (Recomendado) 🎯
```bash
npm run test:e2e:ui
```
**¿Por qué?** Interfaz visual, ejecución paso a paso, debugging fácil.

### Opción 2: Modo Normal
```bash
npm run test:e2e
```

### Opción 3: Ver el Navegador (Headed)
```bash
npm run test:e2e:headed
```

### Opción 4: Debugging Paso a Paso
```bash
npm run test:e2e:debug
```

## Ejecutar Tests Específicos

```bash
# Solo smoke tests (verificación rápida)
npx playwright test smoke.spec.js

# Solo tests básicos
npx playwright test basic-functionality.spec.js

# Solo crop screenshots
npm run test:e2e:crop
# o
npx playwright test crop-screenshot.spec.js

# Solo exportaciones
npx playwright test reports-export.spec.js
```

## Ver Reportes

```bash
npm run test:e2e:report
```

## Estructura de Tests

```
test/e2e/
├── helpers/
│   └── extension-helper.js      # Utilidades reutilizables
├── test-pages/                  # Páginas HTML para testing
│   ├── index.html              # Página principal
│   ├── page1.html              # Página de prueba 1
│   ├── page2.html              # Página de prueba 2
│   └── screenshot-test.html    # Página para tests de screenshots
├── smoke.spec.js               # Tests rápidos de verificación
├── basic-functionality.spec.js # Tests de funcionalidad básica
├── screenshots.spec.js         # Tests de capturas de pantalla
└── reports-export.spec.js      # Tests de exportación e informes
```

## ⚠️ Notas Importantes

1. **Modo Headless NO funciona**: Las extensiones de Chrome requieren modo headful (con ventana visible)
2. **Tests Secuenciales**: Los tests se ejecutan uno tras otro (no en paralelo)
3. **Servidor Automático**: El servidor HTTP se inicia automáticamente en puerto 8000
4. **Limpieza**: Cada test limpia el storage antes de ejecutarse

## 🐛 Troubleshooting

### "Extension ID not found"
- Verifica que `manifest.json` es válido
- Asegúrate de estar en el directorio correcto

### "Port 8000 already in use"
- Cierra cualquier servidor en puerto 8000
- O cambia el puerto en `playwright.config.js`

### Tests muy lentos
- Es normal, las extensiones son más lentas que páginas normales
- Las capturas de pantalla toman tiempo

### "Python not found" al iniciar servidor
- Instala Python desde python.org
- O modifica `start_test_server.ps1` para usar Node.js

## 📊 ¿Qué se prueba?

### ✅ Funcionalidad Básica
- Carga del popup
- Contadores de anotaciones
- Añadir Bug, Note, Idea, Question
- Captura de URL de página activa
- Persistencia de datos

### ✅ Screenshots
- Captura para cada tipo de anotación
- Formato base64 correcto
- Diferentes páginas
- Múltiples capturas

### ✅ Exportación e Informes
- Export CSV
- Export JSON
- Generación de HTML report
- Import JSON
- Clear session

## 🎯 Workflow Recomendado

1. **Desarrollo de nueva feature:**
   ```bash
   npm run test:e2e:ui
   ```
   Ejecuta solo el test que estás desarrollando

2. **Antes de commit:**
   ```bash
   npm run test:e2e
   ```
   Ejecuta todos los tests

3. **Debugging:**
   ```bash
   npm run test:e2e:debug
   ```
   Pausa ejecución y debugging paso a paso

4. **CI/CD:**
   Los tests se pueden ejecutar en CI con configuración adicional

## 💡 Tips

- **UI Mode es tu amigo**: Usa `npm run test:e2e:ui` para desarrollo
- **Tests pequeños**: Cada test debe probar UNA cosa
- **Selectores estables**: Usa IDs en lugar de clases CSS
- **Esperas adecuadas**: Usa `waitForStorageUpdate()` después de operaciones async
- **Limpia el estado**: `clearExtensionStorage()` antes de cada test

## 📚 Más Info

Ver [test/e2e/README.md](test/e2e/README.md) para documentación completa.

## 🤝 Contribuir

Al añadir nuevas features:
1. Añade tests e2e correspondientes
2. Usa los helpers existentes
3. Sigue el patrón de tests actuales
4. Actualiza esta documentación si es necesario
