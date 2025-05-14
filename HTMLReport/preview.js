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

        // Reconstruir la sesión
        currentSession = new Session(sessionData.startDateTime, sessionData.browserInfo);

        // Reconstruir las anotaciones
        sessionData.annotations.forEach(annotation => {
            let newAnnotation;
            switch (annotation.type) {
                case "Bug":
                    newAnnotation = new Bug(annotation.name, annotation.url, annotation.timestamp, annotation.imageURL);
                    currentSession.addBug(newAnnotation);
                    break;
                case "Note":
                    newAnnotation = new Note(annotation.name, annotation.url, annotation.timestamp, annotation.imageURL);
                    currentSession.addNote(newAnnotation);
                    break;
                case "Idea":
                    newAnnotation = new Idea(annotation.name, annotation.url, annotation.timestamp, annotation.imageURL);
                    currentSession.addIdea(newAnnotation);
                    break;
                case "Question":
                    newAnnotation = new Question(annotation.name, annotation.url, annotation.timestamp, annotation.imageURL);
                    currentSession.addQuestion(newAnnotation);
                    break;
            }
        });

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
        .map((annotation, index) => {
            console.log(`Annotation ${index}:`, {
                type: annotation.constructor.name,
                name: annotation.name,
                url: annotation.url,
                timestamp: annotation.timestamp,
                imageURL: annotation.imageURL
            });

            const row = `
            <tr>
                <td>${getAnnotationIcon(annotation.constructor.name)}</td>
                <td class="annotationDescription">${annotation.name}</td>
                <td class="annotationUrl">${annotation.url || 'N/A'}</td>
                <td>${annotation.timestamp ? new Date(annotation.timestamp).toLocaleString() : 'N/A'}</td>
                <td class="screenshot-cell">
                    ${annotation.imageURL ?
                    `<img src="${annotation.imageURL}" 
                             class="previewImage" 
                             data-index="${index}"
                             data-preview="${annotation.imageURL}">`
                    : ''}
                </td>
                <td>
                    <button class="deleteBtn" data-index="${index}" title="Delete annotation">×</button>
                </td>
            </tr>`;
            return row;
        }).join('');

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

function downloadCompleteReport() {
    // Crear una copia del contenido actual
    const reportContent = document.getElementById('report').cloneNode(true);

    // Remove chart container if it exists
    const chartContainer = reportContent.querySelector('#chartContainer');
    if (chartContainer) {
        chartContainer.remove();
    }

    // Eliminar el botón de descarga del reporte
    const downloadBtn = reportContent.querySelector('#downloadReportBtn');
    if (downloadBtn) {
        downloadBtn.parentElement.remove();
    }

    // Eliminar la columna de eliminación
    const table = reportContent.querySelector('table');
    if (table) {
        // Eliminar la columna del encabezado
        const headerRow = table.querySelector('thead tr');
        if (headerRow) {
            const lastHeaderCell = headerRow.lastElementChild;
            if (lastHeaderCell) {
                lastHeaderCell.remove();
            }
        }

        // Eliminar la columna de cada fila
        const rows = table.querySelectorAll('tbody tr');
        rows.forEach(row => {
            const lastCell = row.lastElementChild;
            if (lastCell) {
                lastCell.remove();
            }
        });
    }

    // Asegurar que los filtros estén presentes
    const reportDiv = reportContent.querySelector('#report');
    if (reportDiv) {
        // Crear el contenedor de filtros si no existe
        let filterContainer = reportDiv.querySelector('.filter-container');
        if (!filterContainer) {
            filterContainer = document.createElement('div');
            filterContainer.className = 'filter-container';
            reportDiv.insertBefore(filterContainer, reportDiv.firstChild);
        }

        // Añadir los botones de filtro
        filterContainer.innerHTML = `
            <div class="filter-buttons">
                <button class="filter-button active" data-type="all">all</button>
                <button class="filter-button" data-type="Bug">Bug</button>
                <button class="filter-button" data-type="Note">Note</button>
                <button class="filter-button" data-type="Idea">Idea</button>
                <button class="filter-button" data-type="Question">Question</button>
            </div>
        `;
    }

    // Convertir las imágenes a base64
    const images = reportContent.querySelectorAll('.previewImage');
    const imagePromises = Array.from(images).map(img => {
        return new Promise((resolve) => {
            if (img.src) {
                const tempImg = new Image();
                tempImg.crossOrigin = 'Anonymous';
                tempImg.onload = function () {
                    const canvas = document.createElement('canvas');
                    canvas.width = tempImg.width;
                    canvas.height = tempImg.height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(tempImg, 0, 0);
                    img.src = canvas.toDataURL('image/png');
                    resolve();
                };
                tempImg.onerror = () => resolve();
                tempImg.src = img.src;
            } else {
                resolve();
            }
        });
    });

    // Esperar a que todas las imágenes se conviertan
    Promise.all(imagePromises).then(() => {
        // Convertir los SVG a base64
        const svgPromises = {
            Bug: fetch('../images/bug.svg').then(r => r.text()),
            Note: fetch('../images/note.svg').then(r => r.text()),
            Idea: fetch('../images/light-bulb.svg').then(r => r.text()),
            Question: fetch('../images/question.svg').then(r => r.text())
        };

        Promise.all(Object.values(svgPromises)).then(svgContents => {
            const icons = {
                Bug: `data:image/svg+xml;base64,${btoa(svgContents[0])}`,
                Note: `data:image/svg+xml;base64,${btoa(svgContents[1])}`,
                Idea: `data:image/svg+xml;base64,${btoa(svgContents[2])}`,
                Question: `data:image/svg+xml;base64,${btoa(svgContents[3])}`
            };

            // Reemplazar las referencias a los iconos en el HTML
            const iconElements = reportContent.querySelectorAll('.annotation-icon');
            iconElements.forEach(icon => {
                const type = icon.alt;
                if (icons[type]) {
                    icon.outerHTML = `<img src="${icons[type]}" alt="${type}" class="annotation-icon" data-type="${type}">`;
                }
            });

            // Crear el HTML completo
            const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Exploratory Testing Session Report</title>
    <style>
        ${getStyles()}
    </style>
</head>
<body>
    ${reportContent.outerHTML}
    <div id="imagePreview" class="image-preview">
        <img src="" alt="Preview">
    </div>
    <div id="imageHoverPreview" class="image-hover-preview">
        <img src="" alt="Hover Preview">
    </div>
    <script>
        // Datos de la sesión
        const sessionData = ${JSON.stringify({
                startDateTime: currentSession.getStartDateTime(),
                browserInfo: currentSession.getBrowserInfo(),
                annotations: currentSession.getAnnotations().map(a => ({
                    type: a.constructor.name,
                    name: a.name,
                    url: a.url,
                    timestamp: a.timestamp,
                    imageURL: a.imageURL
                }))
            })};

        // Función para mostrar la vista previa completa
        function showImagePreview(src) {
            const preview = document.getElementById('imagePreview');
            if (!preview) return;
            
            const previewImg = preview.querySelector('img');
            if (!previewImg) return;

            previewImg.src = src;
            preview.classList.add('active');

            const closePreview = function() {
                preview.classList.remove('active');
                preview.removeEventListener('click', closePreview);
            };

            preview.addEventListener('click', closePreview);
            previewImg.addEventListener('click', function(e) {
                e.stopPropagation();
            });
        }

        // Función para manejar el hover de imágenes
        function setupImageHover() {
            document.querySelectorAll('.previewImage').forEach(img => {
                // Click para vista completa
                img.addEventListener('click', function(e) {
                    e.preventDefault();
                    showImagePreview(this.src);
                });

                // Hover para preview
                img.addEventListener('mouseenter', function(e) {
                    const preview = document.getElementById('imageHoverPreview');
                    if (!preview) return;

                    const previewImg = preview.querySelector('img');
                    if (!previewImg) return;

                    previewImg.src = this.src;
                    preview.classList.add('active');
                    updateHoverPosition(e);
                });

                img.addEventListener('mousemove', updateHoverPosition);
                img.addEventListener('mouseleave', function() {
                    const preview = document.getElementById('imageHoverPreview');
                    if (preview) {
                        preview.classList.remove('active');
                    }
                });
            });
        }

        function updateHoverPosition(event) {
            const preview = document.getElementById('imageHoverPreview');
            if (!preview || !preview.classList.contains('active')) return;

            const offset = 15;
            const previewWidth = preview.offsetWidth;
            const previewHeight = preview.offsetHeight;
            const windowWidth = window.innerWidth;
            const windowHeight = window.innerHeight;

            let left = event.clientX + offset;
            let top = event.clientY + offset;

            if (left + previewWidth > windowWidth) {
                left = event.clientX - previewWidth - offset;
            }
            if (top + previewHeight > windowHeight) {
                top = event.clientY - previewHeight - offset;
            }

            preview.style.left = left + 'px';
            preview.style.top = top + 'px';
        }

        // Inicializar todo cuando el documento esté listo
        document.addEventListener('DOMContentLoaded', function() {
            setupImageHover();
        });
    </script>
</body>
</html>`;

            // Crear el blob y descargar
            const blob = new Blob([htmlContent], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `ExploratoryTestingReport_${new Date().toISOString().slice(0, 10)}.html`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        });
    });
}

function getStyles() {
    // Obtener todos los estilos del documento
    const styles = Array.from(document.styleSheets)
        .map(sheet => {
            try {
                return Array.from(sheet.cssRules)
                    .map(rule => rule.cssText)
                    .join('\n');
            } catch (e) {
                // Ignorar errores de CORS
                return '';
            }
        })
        .join('\n');

    return styles;
}

// Cargar los datos cuando el documento esté listo
document.addEventListener('DOMContentLoaded', loadData);