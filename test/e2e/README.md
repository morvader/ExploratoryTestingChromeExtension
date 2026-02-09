# E2E Tests con Playwright para la Extensión de Chrome

Este directorio contiene tests end-to-end (e2e) para la extensión de Chrome de Exploratory Testing, implementados con Playwright.

## 🎯 Qué se prueba

### Tests Básicos (`basic-functionality.spec.js`)
- ✅ Carga correcta del popup de la extensión
- ✅ Contadores iniciales en cero
- ✅ Añadir anotaciones (Bug, Note, Idea, Question)
- ✅ Actualización de contadores al añadir anotaciones
- ✅ Captura de URL de la página activa
- ✅ Limpieza de campos después de añadir anotaciones
- ✅ Múltiples anotaciones simultáneas

### Tests de Capturas Recortadas (`crop-screenshot.spec.js`) ⭐ NUEVO
- ✅ Botones de crop visibles para todos los tipos de anotación
- ✅ Alerta cuando falta descripción antes de crop
- ✅ Inicio de selección de área de crop
- ✅ Message passing correcto al content script
- ✅ Verificación de IDs de botones

### Tests de Informes y Exportación (`reports-export.spec.js`)
- ✅ Exportación a CSV
- ✅ Exportación a JSON
- ✅ Generación de informe HTML
- ✅ Importación de sesión desde JSON
- ✅ Limpiar sesión
- ✅ Persistencia de datos al cerrar/abrir popup
- ✅ Estadísticas correctas en contadores

## 🚀 Instalación

Los paquetes necesarios ya están instalados si ejecutaste `npm install`. Si necesitas reinstalar:

```bash
npm install --save-dev @playwright/test
npx playwright install chromium
```

## 📝 Comandos Disponibles

### Ejecutar todos los tests e2e
```bash
npm run test:e2e
```

### Ver tests ejecutándose (headed mode)
```bash
npm run test:e2e:headed
```

### UI Mode interactivo (recomendado para desarrollo)
```bash
npm run test:e2e:ui
```

### Debug mode (paso a paso)
```bash
npm run test:e2e:debug
```

### Ver último reporte HTML
```bash
npm run test:e2e:report
```

### Ejecutar un archivo específico
```bash
npx playwright test basic-functionality.spec.js
npx playwright test crop-screenshot.spec.js --headed
npm run test:e2e:crop  # Atajo para crop tests
```

### Ejecutar todos los tests (unit + e2e)
```bash
npm run test:all
```

## ⚙️ Configuración

La configuración de Playwright está en `playwright.config.js` en la raíz del proyecto. Características clave:

- **Tests secuenciales**: Las extensiones de Chrome requieren ejecución secuencial
- **Modo headful**: Las extensiones no funcionan en modo headless
- **Servidor de desarrollo**: Inicia automáticamente `start_test_server.ps1` en puerto 8000
- **Screenshots/videos**: Se capturan automáticamente en fallos
- **Traces**: Se guardan en reintentos de tests fallidos

## 🔧 Helper Functions

El archivo `helpers/extension-helper.js` proporciona utilidades reutilizables:

```javascript
const {
  launchBrowserWithExtension,  // Inicia Chrome con la extensión cargada
  openExtensionPopup,           // Abre el popup de la extensión
  clearExtensionStorage,        // Limpia el storage para tests limpios
  getSessionData,               // Obtiene datos de la sesión actual
  waitForStorageUpdate,         // Espera a que se actualice el storage
  takeScreenshotWithExtension,  // Toma captura con la extensión
} = require('./helpers/extension-helper');
```

## 📋 Estructura de un Test

```javascript
const { test, expect } = require('@playwright/test');
const { launchBrowserWithExtension, openExtensionPopup } = require('./helpers/extension-helper');

test.describe('Mi Suite de Tests', () => {
  let context, extensionId, popupPage;

  test.beforeAll(async () => {
    const result = await launchBrowserWithExtension();
    context = result.context;
    extensionId = result.extensionId;
  });

  test.beforeEach(async () => {
    popupPage = await openExtensionPopup(context, extensionId);
  });

  test('mi test', async () => {
    // Tu código de test aquí
    await popupPage.fill('#bugName', 'Test Bug');
    await popupPage.click('#addBug');
  });

  test.afterAll(async () => {
    await context.close();
  });
});
```

## 🐛 Debugging

### Ver qué está pasando
1. Usa `--headed` para ver el navegador
2. Usa `--debug` para pausar y depurar paso a paso
3. Usa UI Mode (`--ui`) para una experiencia visual completa

### Problemas comunes

**Error: Extension ID not found**
- Asegúrate de que `manifest.json` es válido
- Verifica que la ruta de la extensión es correcta
- Comprueba que el service worker se carga correctamente

**Tests lentos o timeouts**
- Las extensiones son más lentas que páginas normales
- Aumenta timeouts si es necesario: `test.setTimeout(120000)`
- Los screenshots toman tiempo, ajusta `waitForStorageUpdate`

**El servidor no inicia**
- Verifica que `start_test_server.ps1` funciona manualmente
- Asegúrate de que el puerto 8000 está libre
- Usa `reuseExistingServer: true` en desarrollo

## 📊 Reportes

Después de ejecutar tests, puedes ver el reporte HTML:

```bash
npm run test:e2e:report
```

El reporte incluye:
- ✅ Tests pasados/fallados
- 📸 Screenshots de fallos
- 🎬 Videos de ejecución (en fallos)
- 📋 Traces para debugging
- ⏱️ Tiempos de ejecución

## 🎓 Recursos

- [Playwright Documentation](https://playwright.dev/)
- [Testing Chrome Extensions](https://playwright.dev/docs/chrome-extensions)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)

## 💡 Tips

1. **Usa UI Mode durante desarrollo**: Es la forma más rápida de iterar
2. **Tests pequeños y enfocados**: Cada test debe probar una funcionalidad específica
3. **Limpia el estado**: Usa `clearExtensionStorage()` antes de cada test
4. **Espera adecuadamente**: Usa `waitForStorageUpdate()` después de operaciones async
5. **Selectores robustos**: Prefiere IDs o data-testids sobre clases CSS
