import { Session } from '../src/Session.js';
import { Bug, Note, Idea, Question } from '../src/Annotation.js';

let currentSession = null;
let annotationToDelete = null;
let currentFilter = 'all';

// Función para cargar los datos de la sesión
async function loadData() {
    try {
        const response = await chrome.runtime.sendMessage({ type: "getSessionData" });
        if (!response || response.annotationsCount === 0) {
            document.getElementById('report').innerHTML = '<h2>No session data available</h2>';
            return;
        }

        // Obtener la sesión completa
        const sessionData = await chrome.runtime.sendMessage({ type: "getFullSession" });
        if (!sessionData) {
            throw new Error('Could not get full session data');
        }

        // Reconstruir la sesión usando el método estático
        currentSession = Session.fromPlainObject(sessionData);

        if (!currentSession) {
            throw new Error('Could not reconstruct session using Session.fromPlainObject');
        }

        // Mostrar la información de la sesión
        displaySessionInfo(currentSession);
        displayAnnotationsTable(currentSession);
        setupDeleteListeners();
        setupFilterListeners();
    } catch (error) {
        console.error('Error loading data:', error);
        document.getElementById('report').innerHTML = `<h2>Error loading data: ${error.message}</h2>`;
    }
}

function displaySessionInfo(session) {
    const sessionInfo = document.getElementById('sessionInfo');
    const browserInfo = session.getBrowserInfo();
    const startDateTime = session.getStartDateTime();

    sessionInfo.innerHTML = `
        <div class="session-info">
            <h2>Session Information</h2>
            <p><strong>Start Date:</strong> ${startDateTime.toLocaleString()}</p>
            <p><strong>Browser:</strong> ${browserInfo.browser} ${browserInfo.browserVersion}</p>
            <p><strong>Operating System:</strong> ${browserInfo.os}</p>
            <p><strong>Cookies:</strong> ${browserInfo.cookies ? 'Enabled' : 'Disabled'}</p>
        </div>
    `;

    // Crear la gráfica circular
    createAnnotationsChart(session);
}

function createAnnotationsChart(session) {
    const bugs = session.getBugs().length;
    const notes = session.getNotes().length;
    const ideas = session.getIdeas().length;
    const questions = session.getQuestions().length;

    const ctx = document.getElementById('annotationsChart').getContext('2d');
    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Bugs', 'Notes', 'Ideas', 'Questions'],
            datasets: [{
                data: [bugs, notes, ideas, questions],
                backgroundColor: [
                    '#dc3545', // Rojo para bugs
                    '#28a745', // Verde para notas
                    '#ffc107', // Amarillo para ideas
                    '#17a2b8'  // Azul para preguntas
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom'
                },
                title: {
                    display: true,
                    text: 'Annotations Distribution'
                }
            }
        }
    });
}

function getAnnotationIcon(type) {
    switch (type) {
        case "Bug":
            return '<img src="../images/bug.svg" alt="Bug" class="annotation-icon">';
        case "Note":
            return '<img src="../images/note.svg" alt="Note" class="annotation-icon">';
        case "Idea":
            return '<img src="../images/light-bulb.svg" alt="Idea" class="annotation-icon">';
        case "Question":
            return '<img src="../images/question.svg" alt="Question" class="annotation-icon">';
        default:
            return type;
    }
}

function displayAnnotationsTable(session) {
    const tableBody = document.getElementById('annotationsTableBody');
    const annotations = session.getAnnotations();

    console.log('Annotations:', annotations);

    tableBody.innerHTML = annotations
        .filter(annotation => currentFilter === 'all' || annotation.constructor.name === currentFilter)
        .map((annotation, index) => `
            <tr>
                <td>${getAnnotationIcon(annotation.constructor.name)}</td>
                <td class="annotationDescription">${escapeHTML(annotation.name)}</td>
                <td class="annotationUrl">${escapeHTML(annotation.url || 'N/A')}</td>
                <td>${annotation.timestamp ? new Date(annotation.timestamp).toLocaleString() : 'N/A'}</td>
                <td class="screenshot-cell">
                    ${annotation.imageURL ?
                    `<img src="${annotation.imageURL}" class="previewImage" data-index="${index}" data-preview="${annotation.imageURL}">`
                    : ''}
                </td>
                <td>
                    <button class="deleteBtn" data-index="${index}" title="Delete annotation">×</button>
                </td>
            </tr>`
        ).join('');

    // Añadir listeners para las imágenes
    document.querySelectorAll('.previewImage').forEach(img => {
        // Click para vista completa
        img.addEventListener('click', function () {
            showImagePreview(this.dataset.preview);
        });

        // Hover para preview
        img.addEventListener('mouseenter', function (e) {
            showHoverPreview(this.dataset.preview, e);
        });

        img.addEventListener('mousemove', function (e) {
            updateHoverPreviewPosition(e);
        });

        img.addEventListener('mouseleave', function () {
            hideHoverPreview();
        });
    });
}

function showHoverPreview(src, event) {
    const preview = document.getElementById('imageHoverPreview');
    const previewImg = preview.querySelector('img');
    previewImg.src = src;
    preview.classList.add('active');
    updateHoverPreviewPosition(event);
}

function updateHoverPreviewPosition(event) {
    const preview = document.getElementById('imageHoverPreview');
    if (!preview.classList.contains('active')) return;

    const offset = 15; // Distancia del cursor al preview
    const previewWidth = preview.offsetWidth;
    const previewHeight = preview.offsetHeight;
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    // Calcular posición
    let left = event.clientX + offset;
    let top = event.clientY + offset;

    // Ajustar si el preview se sale de la ventana
    if (left + previewWidth > windowWidth) {
        left = event.clientX - previewWidth - offset;
    }
    if (top + previewHeight > windowHeight) {
        top = event.clientY - previewHeight - offset;
    }

    preview.style.left = left + 'px';
    preview.style.top = top + 'px';
}

function hideHoverPreview() {
    const preview = document.getElementById('imageHoverPreview');
    preview.classList.remove('active');
}

function setupDeleteListeners() {
    // Listener para el botón de eliminar
    document.querySelectorAll('.deleteBtn').forEach(btn => {
        btn.addEventListener('click', function () {
            annotationToDelete = parseInt(this.dataset.index);
            document.getElementById('divOverlay').style.display = 'block';
        });
    });

    // Listener para cancelar eliminación
    document.getElementById('cancelDelete').addEventListener('click', function () {
        document.getElementById('divOverlay').style.display = 'none';
        annotationToDelete = null;
    });

    // Listener para confirmar eliminación
    document.getElementById('deleteYes').addEventListener('click', function () {
        if (annotationToDelete !== null) {
            chrome.runtime.sendMessage({
                type: "deleteAnnotation",
                annotationID: annotationToDelete
            }, function (response) {
                if (response.status === "ok") {
                    loadData(); // Recargar los datos después de eliminar
                }
            });
        }
        document.getElementById('divOverlay').style.display = 'none';
        annotationToDelete = null;
    });
}

function showImagePreview(src) {
    const preview = document.getElementById('imagePreview');
    const previewImg = preview.querySelector('img');
    previewImg.src = src;
    preview.classList.add('active');

    const closePreview = function () {
        preview.classList.remove('active');
        preview.removeEventListener('click', closePreview);
    };

    preview.addEventListener('click', closePreview);

    previewImg.addEventListener('click', function (e) {
        e.stopPropagation();
    });
}

function setupFilterListeners() {
    document.querySelectorAll('.filter-button').forEach(button => {
        button.addEventListener('click', function () {
            // Actualizar botones
            document.querySelectorAll('.filter-button').forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');

            // Actualizar filtro
            currentFilter = this.dataset.type;

            // Actualizar tabla
            displayAnnotationsTable(currentSession);
        });
    });

    // Añadir listener para el botón de descarga
    document.getElementById('downloadReportBtn').addEventListener('click', downloadCompleteReport);
}


// --- Helper Functions for Report Download ---

function escapeHTML(str) {
    if (str === null || str === undefined) return '';
    return String(str).replace(/[&<>"']/g, function (match) {
        return {
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[match];
    });
}

function cloneAndPrepareReportContent() {
    const reportContent = document.getElementById('report').cloneNode(true);
    reportContent.querySelector('#chartContainer')?.remove();
    reportContent.querySelector('#downloadReportBtn')?.parentElement.remove();

    const table = reportContent.querySelector('table');
    if (table) {
        table.querySelector('thead tr')?.lastElementChild?.remove(); // Remove delete column header
        table.querySelectorAll('tbody tr').forEach(row => row.lastElementChild?.remove()); // Remove delete button cell
    }
    return reportContent;
}

function ensureFilterButtonsInClone(reportClone, currentFilterValue) {
    const reportDiv = reportClone.querySelector('#report') || reportClone;
    let filterContainer = reportDiv.querySelector('.filter-container');
    if (!filterContainer) {
        filterContainer = document.createElement('div');
        filterContainer.className = 'filter-container';
        reportDiv.insertBefore(filterContainer, reportDiv.firstChild);
    }
    filterContainer.innerHTML = `
        <div class="filter-buttons">
            <button class="filter-button ${currentFilterValue === 'all' ? 'active' : ''}" data-type="all">All</button>
            <button class="filter-button ${currentFilterValue === 'Bug' ? 'active' : ''}" data-type="Bug">Bug</button>
            <button class="filter-button ${currentFilterValue === 'Note' ? 'active' : ''}" data-type="Note">Note</button>
            <button class="filter-button ${currentFilterValue === 'Idea' ? 'active' : ''}" data-type="Idea">Idea</button>
            <button class="filter-button ${currentFilterValue === 'Question' ? 'active' : ''}" data-type="Question">Question</button>
        </div>`;
}

async function convertImageToDataURL(imgElement) {
    if (!imgElement || !imgElement.src || imgElement.src.startsWith('data:')) {
        return Promise.resolve(); // No conversion needed or possible
    }
    return new Promise((resolve) => {
        const tempImg = new Image();
        tempImg.crossOrigin = 'Anonymous'; // Attempt to load cross-origin images (e.g., from other extension pages if policy allows)
        tempImg.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = tempImg.naturalWidth;
            canvas.height = tempImg.naturalHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(tempImg, 0, 0);
            imgElement.src = canvas.toDataURL('image/png');
            resolve();
        };
        tempImg.onerror = () => {
            console.warn('Failed to load image for base64 conversion:', imgElement.src);
            resolve(); // Resolve to not break Promise.all
        };
        tempImg.src = imgElement.src;
    });
}

async function embedImagesAsBase64(reportClone) {
    const images = reportClone.querySelectorAll('.previewImage');
    const promises = Array.from(images).map(img => convertImageToDataURL(img));
    await Promise.all(promises);
}

async function convertSvgToDataURL(svgPath) {
    try {
        const response = await fetch(svgPath);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const svgText = await response.text();
        return `data:image/svg+xml;base64,${btoa(svgText)}`;
    } catch (error) {
        console.error('Error fetching or converting SVG:', svgPath, error);
        return svgPath; // Return original path as fallback
    }
}

async function embedSvgsAsBase64(reportClone) {
    const iconElements = reportClone.querySelectorAll('.annotation-icon');
    const svgSources = { // Relative to preview.html
        Bug: '../images/bug.svg',
        Note: '../images/note.svg',
        Idea: '../images/light-bulb.svg',
        Question: '../images/question.svg'
    };

    const promises = Array.from(iconElements).map(async (iconImg) => {
        const type = iconImg.alt;
        const srcPath = svgSources[type];
        if (srcPath && !iconImg.src.startsWith('data:')) {
            iconImg.src = await convertSvgToDataURL(srcPath);
        }
    });
    await Promise.all(promises);
}

function getStyles() { // Renamed to indicate it's for embedding
    // Obtener todos los estilos del documento
    return Array.from(document.styleSheets)
        .map(sheet => {
            try {
                return Array.from(sheet.cssRules || []) // Add guard for sheet.cssRules being null
                    .map(rule => rule.cssText)
                    .join('\n');
            } catch (e) {
                console.warn('Could not read CSS rules from stylesheet:', sheet.href, e);
                return ''; // Return empty string for sheets that can't be accessed
            }
        })
        .join('\n');
}

function generateReportHtml(clonedReportHtml, stylesHtml, sessionDataJsonString) {
    // Basic script for image preview in the downloaded report. Hover functionality removed for simplicity.
    const scriptContent = `
        const sessionData = ${sessionDataJsonString};
        function showImagePreview(src) {
            const preview = document.getElementById('imagePreview');
            if (!preview) return;
            const img = preview.querySelector('img');
            if (!img) return;
            img.src = src;
            preview.classList.add('active');
            preview.onclick = () => preview.classList.remove('active'); // Click anywhere on overlay to close
            img.onclick = (e) => e.stopPropagation(); // Click on image itself does nothing extra
        }
        document.querySelectorAll('.previewImage').forEach(img => {
            img.addEventListener('click', (e) => { e.preventDefault(); showImagePreview(img.src); });
        });
    `;

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>Exploratory Testing Session Report</title>
    <style>${stylesHtml}</style>
</head>
<body>
    ${clonedReportHtml}
    <div id="imagePreview" class="image-preview"><img></div> 
    <script>${scriptContent}</script>
</body>
</html>`;
}

function triggerDownload(htmlContent, filename) {
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

async function downloadCompleteReport() {
    try {
        const reportCloneElement = cloneAndPrepareReportContent();
        ensureFilterButtonsInClone(reportCloneElement, currentFilter);

        await embedImagesAsBase64(reportCloneElement);
        await embedSvgsAsBase64(reportCloneElement);

        const stylesHtml = getStyles(); // Renamed from getEmbeddedStyles for consistency
        
        const sessionDataForEmbed = {
            startDateTime: currentSession.getStartDateTime(),
            browserInfo: currentSession.getBrowserInfo(),
            annotations: currentSession.getAnnotations().map(a => ({
                type: a.constructor.name,
                name: a.name, // Assumes name is already escaped or safe
                url: a.url,   // Assumes URL is already escaped or safe
                timestamp: a.timestamp,
                imageURL: reportCloneElement.querySelector(`.previewImage[data-index="${currentSession.getAnnotations().indexOf(a)}"]`)?.src || a.imageURL // Get potentially base64 version
            }))
        };
        const sessionJsonString = JSON.stringify(sessionDataForEmbed, (key, value) => {
            // Basic escaping for string values in JSON to prevent XSS in the <script> block
            if (typeof value === 'string') {
                return value.replace(/</g, '\\u003c').replace(/>/g, '\\u003e');
            }
            return value;
        });


        const finalHtml = generateReportHtml(reportCloneElement.innerHTML, stylesHtml, sessionJsonString);
        const filename = `ExploratoryTestingReport_${new Date().toISOString().slice(0, 10)}.html`;
        
        triggerDownload(finalHtml, filename);

    } catch (error) {
        console.error("Error during report download:", error);
        alert("Failed to download report. Check console for details."); // User-friendly error
    }
}


// Cargar los datos cuando el documento esté listo
document.addEventListener('DOMContentLoaded', loadData);