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
        const loadedSessionData = data.session;
        const reconstructedSession = Session.fromPlainObject(loadedSessionData);
        if (reconstructedSession) {
            session = reconstructedSession;
        } else {
            console.warn("Background: Failed to reconstruct session from stored data. Starting new session.");
            session = new Session(new Date(), getSystemInfo()); // Fallback to a new session
        }
    } else {
        // If no session data in storage, ensure a new session is created (or handle as appropriate)
        console.log("Background: No session found in storage. Initializing a new session.");
        session = new Session(new Date(), getSystemInfo());
    }
    // Ensure session is saved if it was newly created or reconstructed,
    // especially if fromPlainObject might return null and a new one is made.
    // However, loadSession is usually called at startup, saveSession might be too aggressive here
    // unless there's a specific need to ensure the loaded/reconstructed session is immediately persisted back.
    // For now, let's assume saveSession will be called by other operations when changes occur.
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
            if (sender.tab && sender.tab.id) {
                handleProcessCropRequest(request, sender.tab.id);
                // No sendResponse needed back to content script for this message type currently.
            } else {
                console.error("Background: csToBgCropData received without valid sender.tab.id");
            }
            // This path is not asynchronous in terms of sendResponse to this specific message.
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


async function handleProcessCropRequest(data, tabId) {
    console.log(`Background: Processing crop request for tab ${tabId}`, data);

    try {
        const tab = await chrome.tabs.get(tabId);
        if (!tab) {
            console.error("Background: No valid tab found for ID", tabId);
            notifyProcessingError(data.annotationType, data.description, "Tab not found for capture.");
            return;
        }
        if (tab.url && (tab.url.startsWith('chrome://') || tab.url.startsWith('https://chrome.google.com/webstore'))) {
            console.warn(`Background: Attempted to capture restricted URL: ${tab.url}. Aborting.`);
            notifyProcessingError(data.annotationType, data.description, "Cannot capture screenshot on this page.");
            return;
        }

        const dataUrl = await chrome.tabs.captureVisibleTab(tabId, { format: "png" });

        if (chrome.runtime.lastError || !dataUrl) {
            console.error("Background: Error capturing tab:", chrome.runtime.lastError?.message || "No data URL");
            notifyProcessingError(data.annotationType, data.description, chrome.runtime.lastError?.message || "Tab capture failed");
            return;
        }

        const imageBlob = await fetch(dataUrl).then(res => res.blob());
        const imageBitmap = await createImageBitmap(imageBlob);

        const sx = data.coordinates.x; 
        const sy = data.coordinates.y;
        const sWidth = data.coordinates.width;
        const sHeight = data.coordinates.height;

        const canvasWidth = sWidth;
        const canvasHeight = sHeight;

        const offscreenCanvas = new OffscreenCanvas(canvasWidth, canvasHeight);
        const ctx = offscreenCanvas.getContext('2d');

        ctx.drawImage(imageBitmap,
            sx, sy, sWidth, sHeight, 
            0, 0, canvasWidth, canvasHeight); 

        const croppedBlob = await offscreenCanvas.convertToBlob({ type: 'image/png' });
        const reader = new FileReader(); 

        reader.onloadend = function() {
            const croppedDataUrl = reader.result;
            // Now call the existing addAnnotation function
            addAnnotation(data.annotationType, data.description, croppedDataUrl)
                .then(() => { /* Notification handled in addAnnotation */ })
                .catch(error => { /* Notification handled in addAnnotation */ });
        };
        reader.readAsDataURL(croppedBlob);

    } catch (error) {
        console.error("Background: Error in handleProcessCropRequest:", error);
        notifyProcessingError(data.annotationType, data.description, error.message || "Cropping process failed");
    }
}


async function addAnnotation(type, name, imageURL) {
    console.log("Background: addAnnotation called. Type:", type, ". Name:", name, ". Image URL (first 100 chars):", imageURL ? imageURL.substring(0,100) : "No image");
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