// Importar las clases necesarias
import { Session } from './src/Session.js';
import { Bug } from './src/Annotation.js';
import { Note } from './src/Annotation.js';
import { Idea } from './src/Annotation.js';
import { Question } from './src/Annotation.js';
import { ExportSessionCSV } from './src/ExportSessionCSV.js';
import { JSonSessionService } from './src/JSonSessionService.js';
import { getSystemInfo } from './src/browserInfo.js';

let session = new Session();

// Función para guardar la sesión en el storage
async function saveSession() {
    await chrome.storage.local.set({ 'session': session });
}

// Función para cargar la sesión desde el storage
async function loadSession() {
    const data = await chrome.storage.local.get('session');
    if (data.session) {
        // Reconstruir el objeto Session con sus métodos
        const loadedSession = data.session;
        session = new Session(loadedSession.startDateTime, loadedSession.browserInfo);

        // Reconstruir las anotaciones
        loadedSession.annotations.forEach(annotation => {
            let newAnnotation;
            switch (annotation.type) {
                case "Bug":
                    newAnnotation = new Bug(annotation.name, annotation.url, annotation.timestamp, annotation.imageURL);
                    session.addBug(newAnnotation);
                    break;
                case "Note":
                    newAnnotation = new Note(annotation.name, annotation.url, annotation.timestamp, annotation.imageURL);
                    session.addNote(newAnnotation);
                    break;
                case "Idea":
                    newAnnotation = new Idea(annotation.name, annotation.url, annotation.timestamp, annotation.imageURL);
                    session.addIdea(newAnnotation);
                    break;
                case "Question":
                    newAnnotation = new Question(annotation.name, annotation.url, annotation.timestamp, annotation.imageURL);
                    session.addQuestion(newAnnotation);
                    break;
            }
        });
    }
}

// Cargar la sesión al iniciar
loadSession();

// Helper function for notifications of processing errors (before addAnnotation is called)
function notifyProcessingError(annotationType, descriptionName, errorMessage = "") {
    const typeStr = annotationType || "Annotation";
    const nameStr = descriptionName || "";
    const notifId = 'annotationProcessingError-' + Date.now();
    chrome.notifications.create(notifId, {
        type: 'basic',
        iconUrl: 'icons/iconbig.png',
        title: `${typeStr} Processing Failed`,
        message: `Could not process ${typeStr.toLowerCase()} "${nameStr}" for screenshot. Error: ${errorMessage}`
    });
    setTimeout(() => { chrome.notifications.clear(notifId); }, 7000);
}


// Escuchar mensajes del popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // Keep 'return true' if any path in this listener might call sendResponse asynchronously.
    // For "csToBgCropData", we are not sending a response back to content script currently.
    // For other existing cases, they do use sendResponse.
    let isAsync = false;

    switch (request.type) {
        case "addBug":
            console.log("Background: Received message", request.type, ". Name:", request.name, ". imageURL (first 100 chars):", request.imageURL ? request.imageURL.substring(0, 100) : "null");
            addAnnotation("Bug", request.name, request.imageURL)
                .then(() => sendResponse({ status: "ok" }))
                .catch(error => sendResponse({ status: "error", error: error.message }));
            isAsync = true;
            break;
        case "addIdea":
            console.log("Background: Received message", request.type, ". Name:", request.name, ". imageURL (first 100 chars):", request.imageURL ? request.imageURL.substring(0, 100) : "null");
            addAnnotation("Idea", request.name, request.imageURL)
                .then(() => sendResponse({ status: "ok" }))
                .catch(error => sendResponse({ status: "error", error: error.message }));
            isAsync = true;
            break;
        case "addNote":
            console.log("Background: Received message", request.type, ". Name:", request.name, ". imageURL (first 100 chars):", request.imageURL ? request.imageURL.substring(0, 100) : "null");
            addAnnotation("Note", request.name, request.imageURL)
                .then(() => sendResponse({ status: "ok" }))
                .catch(error => sendResponse({ status: "error", error: error.message }));
            isAsync = true;
            break;
        case "addQuestion":
            console.log("Background: Received message", request.type, ". Name:", request.name, ". imageURL (first 100 chars):", request.imageURL ? request.imageURL.substring(0, 100) : "null");
            addAnnotation("Question", request.name, request.imageURL)
                .then(() => sendResponse({ status: "ok" }))
                .catch(error => sendResponse({ status: "error", error: error.message }));
            isAsync = true;
            break;
        case "csToBgCropData":
            console.log("Background: Received csToBgCropData", request);
            handleProcessCropRequest(request)
                .then(() => {
                    console.log("Background: Crop request processed successfully");
                })
                .catch((error) => {
                    console.error("Background: Failed to process crop request:", error);
                });
            break;
        case "updateAnnotationName":
            var AnnotationID = request.annotationID;
            var newName = request.newName;
            var annotations = session.getAnnotations();
            var annotation = annotations[AnnotationID];
            annotation.setName(newName);
            saveSession().then(() => sendResponse({ status: "ok" }));
            break;
        case "deleteAnnotation":
            session.deleteAnnotation(request.annotationID);
            saveSession().then(() => sendResponse({ status: "ok" }));
            break;
        case "exportSessionCSV":
            if (!exportSessionCSV()) {
                sendResponse({ status: "nothing to export" });
            } else {
                sendResponse({ status: "ok" });
            }
            break;
        case "exportSessionJSon":
            if (!exportSessionJSon()) {
                sendResponse({ status: "nothing to export" });
            } else {
                sendResponse({ status: "ok" });
            }
            break;
        case "importSessionJSon":
            var fileData = request.jSonSession;
            if (!importSessionJSon(fileData)) {
                sendResponse({ status: "nothing to import" });
            } else {
                sendResponse({ status: "ok" });
            }
            break;
        case "clearSession":
            clearSession().then(() => sendResponse({ status: "ok" }));
            break;
        case "getSessionData":
            sendResponse({
                bugs: session.getBugs().length,
                notes: session.getNotes().length,
                ideas: session.getIdeas().length,
                questions: session.getQuestions().length,
                annotationsCount: session.getAnnotations().length
            });
            break;
        case "getFullSession":
            if (!session) {
                sendResponse(null);
                return true;
            }
            sendResponse({
                startDateTime: session.StartDateTime,
                browserInfo: {
                    browser: session.BrowserInfo.browser || "Chrome",
                    browserVersion: session.BrowserInfo.browserVersion || chrome.runtime.getManifest().version,
                    os: session.BrowserInfo.os || navigator.platform,
                    osVersion: session.BrowserInfo.osVersion || navigator.userAgent,
                    cookies: session.BrowserInfo.cookies || navigator.cookieEnabled,
                    flashVersion: session.BrowserInfo.flashVersion || "N/A"
                },
                annotations: session.annotations.map(annotation => ({
                    type: annotation.constructor.name,
                    name: annotation.name,
                    url: annotation.url,
                    timestamp: annotation.timestamp,
                    imageURL: annotation.imageURL
                }))
            });
            break;
    }
    return isAsync; // Return true only if sendResponse is used asynchronously in any of the handled cases.
});


// Función para manejar la solicitud de captura de pantalla
async function handleProcessCropRequest(request) {
    try {
        console.log("Background: Processing crop request for tab", request.tabId, request);

        // Obtener la pestaña activa
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tabs || tabs.length === 0) {
            throw new Error("No active tab found");
        }
        const activeTab = tabs[0];

        // Capturar la pantalla
        const dataUrl = await chrome.tabs.captureVisibleTab(null, { format: "png" });
        if (!dataUrl) {
            throw new Error("Failed to capture screenshot");
        }

        // Convertir dataUrl a Blob
        const response = await fetch(dataUrl);
        const blob = await response.blob();

        // Crear un bitmap de la imagen
        const bitmap = await createImageBitmap(blob);

        // Intentar inferir el DPR comparando el tamaño de la bitmap con las coordenadas CSS recibidas.
        // Esto asume que las coordenadas request.coordinates representan el área de recorte en píxeles CSS 
        // relativo al tamaño del viewport en píxeles CSS.
        // NOTA: La forma correcta es ajustar en el content script.
        let inferredDpr = 1;
        if (request.viewportWidth && request.viewportHeight && bitmap.width && bitmap.height) {
            // Asumiendo que la bitmap.width / viewportWidth en CSS es aproximadamente el DPR
            // Esto puede no ser exacto si la captura no cubre exactamente el viewport o hay zoom.
            inferredDpr = bitmap.width / request.viewportWidth;
            console.log("Background: Inferred DPR based on bitmap size and viewport width:", inferredDpr);
        } else {
            console.log("Background: Could not infer DPR. Using assumed DPR of 1.");
        }

        // Crear un canvas fuera de pantalla con las dimensiones del recorte en píxeles de dispositivo
        const canvas = new OffscreenCanvas(
            request.coordinates.width * inferredDpr,
            request.coordinates.height * inferredDpr
        );
        const ctx = canvas.getContext('2d');

        // Dibujar la porción seleccionada
        ctx.drawImage(
            bitmap,
            request.coordinates.x * inferredDpr, // Ajustar coordenada X origen
            request.coordinates.y * inferredDpr, // Ajustar coordenada Y origen
            request.coordinates.width * inferredDpr, // Ajustar ancho origen
            request.coordinates.height * inferredDpr, // Ajustar alto origen
            0,
            0,
            request.coordinates.width * inferredDpr, // Dibujar en el canvas con el tamaño ajustado
            request.coordinates.height * inferredDpr  // Dibujar en el canvas con el tamaño ajustado
        );

        // Convertir el canvas a blob
        const croppedBlob = await canvas.convertToBlob({ type: 'image/png' });

        // Convertir blob a dataUrl
        const croppedDataUrl = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(croppedBlob);
        });

        // Crear la anotación
        await addAnnotation(
            request.annotationType.charAt(0).toUpperCase() + request.annotationType.slice(1),
            request.description,
            croppedDataUrl
        );

        console.log("Background: Successfully processed crop request");
    } catch (error) {
        console.error("Background: Error in handleProcessCropRequest:", error);
        throw error;
    }
}


async function addAnnotation(type, name, imageURL) {
    console.log("Background: addAnnotation called. Type:", type, ". Name:", name, ". Image URL (first 100 chars):", imageURL ? imageURL.substring(0, 100) : "No image");
    if (session.getAnnotations().length == 0) {
        await startSession();
    }

    return new Promise((resolve, reject) => {
        chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
            try {
                const currentUrl = tabs[0] ? tabs[0].url : "N/A"; // Handle missing tab
                const now = new Date().getTime();

                let newAnnotation;
                let annotationSimpleType = ""; // For user-friendly notification

                switch (type) {
                    case "Bug":
                        newAnnotation = new Bug(name, currentUrl, now, imageURL);
                        session.addBug(newAnnotation);
                        annotationSimpleType = "Bug";
                        break;
                    case "Note":
                        newAnnotation = new Note(name, currentUrl, now, imageURL);
                        session.addNote(newAnnotation);
                        annotationSimpleType = "Note";
                        break;
                    case "Idea":
                        newAnnotation = new Idea(name, currentUrl, now, imageURL);
                        session.addIdea(newAnnotation);
                        annotationSimpleType = "Idea";
                        break;
                    case "Question":
                        newAnnotation = new Question(name, currentUrl, now, imageURL);
                        session.addQuestion(newAnnotation);
                        annotationSimpleType = "Question";
                        break;
                    default: // Should not happen
                        return reject(new Error("Unknown annotation type"));
                }

                console.log("Background: Attempting to save session for annotation Type:", type, "Name:", name);
                saveSession().then(() => {
                    // --- Create Notification ---
                    const notifId = 'annotationSaved-' + Date.now();
                    const notifOptions = {
                        type: 'basic',
                        iconUrl: 'icons/iconbig.png', // Ensure this icon path is correct
                        title: `${annotationSimpleType} Saved!`,
                        message: `Your ${annotationSimpleType.toLowerCase()} "${name}" has been successfully saved.`
                    };
                    chrome.notifications.create(notifId, notifOptions);
                    // Optional: Clear notification after a few seconds
                    setTimeout(() => {
                        chrome.notifications.clear(notifId);
                    }, 5000); // Clear after 5 seconds
                    // --- End Notification ---

                    resolve(); // Resolve the main promise
                }).catch(error => {
                    console.error("Background: Error during saveSession for", type, name, ":", error);
                    // Optionally, show an error notification here too
                    const errorNotifId = 'annotationError-' + Date.now();
                    chrome.notifications.create(errorNotifId, {
                        type: 'basic',
                        iconUrl: 'icons/iconbig.png',
                        title: `${annotationSimpleType || type} Save Failed`,
                        message: `Could not save ${annotationSimpleType.toLowerCase() || type.toLowerCase()} "${name}". Error: ${error.message}`
                    });
                    setTimeout(() => {
                        chrome.notifications.clear(errorNotifId);
                    }, 7000); // Keep error notifications slightly longer

                    reject(error);
                });

            } catch (error) { // Catch synchronous errors in the promise executor
                console.error("Background: Error in addAnnotation sync part:", error);
                // Send a notification for this synchronous error as well
                const syncErrorNotifId = 'annotationSyncError-' + Date.now();
                chrome.notifications.create(syncErrorNotifId, {
                    type: 'basic',
                    iconUrl: 'icons/iconbig.png',
                    title: `${type || 'Annotation'} Setup Failed`,
                    message: `Failed to initiate saving for "${name}". Error: ${error.message}`
                });
                setTimeout(() => {
                    chrome.notifications.clear(syncErrorNotifId);
                }, 7000);
                reject(error);
            }
        });
    });
}

async function startSession() {
    var systemInfo = getSystemInfo();
    session = new Session(Date.now(), systemInfo);
    await saveSession();
}

async function clearSession() {
    session.clearAnnotations();
    await saveSession();
}

function exportSessionCSV() {
    if (session.getAnnotations().length == 0) return false;

    var exportService = new ExportSessionCSV(session);
    var csvData = exportService.getCSVData();

    var browserInfo = session.getBrowserInfo();
    var browserInfoString = browserInfo.browser + "_" + browserInfo.browserVersion;

    // Formatear la fecha correctamente
    const date = new Date(session.getStartDateTime());
    const startDateTime = date.getFullYear() +
        ('0' + (date.getMonth() + 1)).slice(-2) +
        ('0' + date.getDate()).slice(-2) + '_' +
        ('0' + date.getHours()).slice(-2) +
        ('0' + date.getMinutes()).slice(-2);

    var fileName = "ExploratorySession_" + browserInfoString + "_" + startDateTime + ".csv";

    // Crear data URL
    const dataUrl = 'data:text/csv;charset=utf-8;base64,' + btoa(csvData);

    chrome.downloads.download({
        url: dataUrl,
        filename: fileName,
        saveAs: true
    });

    return true;
}

function exportSessionJSon() {
    if (session.getAnnotations().length == 0) return false;

    var exportJSonService = new JSonSessionService();
    var jsonData = exportJSonService.getJSon(session);

    var browserInfo = session.getBrowserInfo();
    var browserInfoString = browserInfo.browser + "_" + browserInfo.browserVersion;

    // Formatear la fecha correctamente
    const date = new Date(session.getStartDateTime());
    const startDateTime = date.getFullYear() +
        ('0' + (date.getMonth() + 1)).slice(-2) +
        ('0' + date.getDate()).slice(-2) + '_' +
        ('0' + date.getHours()).slice(-2) +
        ('0' + date.getMinutes()).slice(-2);

    var fileName = "ExploratorySession_" + browserInfoString + "_" + startDateTime + ".json";

    // Crear data URL
    const dataUrl = 'data:application/json;base64,' + btoa(jsonData);

    chrome.downloads.download({
        url: dataUrl,
        filename: fileName,
        saveAs: true
    });

    return true;
}

function importSessionJSon(JSonSessionData) {
    debugger;
    var exportJSonService = new JSonSessionService();
    var importedSession = exportJSonService.getSession(JSonSessionData);

    if (importedSession == null)
        return false;

    clearSession();
    session = importedSession;

    return true;
}