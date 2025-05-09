import { Session } from '../src/Session.js';
import { Bug, Note, Idea, Question } from '../src/Annotation.js';

let currentSession = null;
let annotationToDelete = null;

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

    console.log('Annotations:', annotations); // Debug log

    tableBody.innerHTML = annotations.map((annotation, index) => {
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
                         style="--preview-src: url('${annotation.imageURL}')">`
                : ''}
            </td>
            <td>
                <button class="deleteBtn" data-index="${index}" title="Delete annotation">×</button>
            </td>
        </tr>`;
        return row;
    }).join('');

    // Añadir listeners para las imágenes de vista previa
    document.querySelectorAll('.previewImage').forEach(img => {
        img.addEventListener('click', function () {
            showImagePreview(this.src);
        });
    });
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
    const preview = document.createElement('div');
    preview.id = 'preview';
    preview.innerHTML = `<img id="imgPreview" src="${src}">`;
    document.body.appendChild(preview);
    preview.style.display = 'block';

    preview.addEventListener('click', function () {
        document.body.removeChild(preview);
    });
}

// Cargar los datos cuando el documento esté listo
document.addEventListener('DOMContentLoaded', loadData); 