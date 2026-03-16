// Importar las clases necesarias
import { Session } from './src/Session.js';
import { Bug } from './src/Annotation.js';
import { Note } from './src/Annotation.js';
import { Idea } from './src/Annotation.js';
import { Question } from './src/Annotation.js';
import { ExportSessionCSV } from './src/ExportSessionCSV.js';
import { JSonSessionService } from './src/JSonSessionService.js';
import { getSystemInfo } from './src/browserInfo.js';
import { GoogleDriveService } from './src/GoogleDriveService.js';

let session = new Session();

// --- Google Drive state ---
const driveService = new GoogleDriveService();
let driveAutoSave = false;
let driveFileId = null;
let driveSyncStatus = 'idle'; // idle | syncing | synced | error
let syncTimeout = null;

async function loadDriveSettings() {
    const data = await chrome.storage.local.get(['driveAutoSave', 'driveFileId']);
    driveAutoSave = data.driveAutoSave || false;
    driveFileId = data.driveFileId || null;

    // Try to restore token silently if auto-save was on
    if (driveAutoSave) {
        try {
            await driveService.getToken();
        } catch (e) {
            driveAutoSave = false;
            await chrome.storage.local.set({ driveAutoSave: false });
        }
    }
}

async function saveDriveSettings() {
    await chrome.storage.local.set({ driveAutoSave, driveFileId });
}

function scheduleDriveSync() {
    if (!driveAutoSave || !driveService.isAuthenticated()) return;
    if (syncTimeout) clearTimeout(syncTimeout);
    syncTimeout = setTimeout(() => syncToDrive(), 1500);
}

async function syncToDrive() {
    if (!driveService.isAuthenticated()) return;
    if (session.getAnnotations().length === 0) return;

    driveSyncStatus = 'syncing';
    try {
        const jsonService = new JSonSessionService();
        const sessionJson = jsonService.getJSon(session);
        const fileName = getDriveFileName();

        const result = await driveService.uploadSession(sessionJson, fileName, driveFileId);
        driveFileId = result.id;
        driveSyncStatus = 'synced';
        await saveDriveSettings();
    } catch (error) {
        console.error('Drive sync failed:', error);
        driveSyncStatus = 'error';
    }
}

function getDriveFileName() {
    const date = new Date(session.getStartDateTime());
    const startDateTime = date.getFullYear() +
        ('0' + (date.getMonth() + 1)).slice(-2) +
        ('0' + date.getDate()).slice(-2) + '_' +
        ('0' + date.getHours()).slice(-2) +
        ('0' + date.getMinutes()).slice(-2);
    return `ExploratorySession_${startDateTime}.json`;
}

// Función para guardar la sesión en el storage
async function saveSession() {
    try {
        await chrome.storage.local.set({ 'session': session });
    } catch (error) {
        if (error.name === 'QUOTA_BYTES' || (chrome.runtime.lastError && chrome.runtime.lastError.message && chrome.runtime.lastError.message.includes('QUOTA_BYTES'))) {
            console.error('Error saving session due to quota limit:', error);

            // Create a deep copy of the session object
            const sessionCopy = JSON.parse(JSON.stringify(session));

            // Find the oldest annotation with a non-null imageURL
            let oldestAnnotationIndex = -1;
            for (let i = 0; i < sessionCopy.annotations.length; i++) {
                if (sessionCopy.annotations[i].imageURL) {
                    oldestAnnotationIndex = i;
                    break;
                }
            }

            if (oldestAnnotationIndex !== -1) {
                // const originalImageURL = sessionCopy.annotations[oldestAnnotationIndex].imageURL; // Optional: for logging
                sessionCopy.annotations[oldestAnnotationIndex].imageURL = "IMAGE_REMOVED_DUE_TO_STORAGE_LIMIT";

                try {
                    await chrome.storage.local.set({ 'session': sessionCopy });
                    // Notify user about successful save after removing screenshot
                    const notifId = 'sessionSavedAfterQuota-' + Date.now();
                    chrome.notifications.create(notifId, {
                        type: 'basic',
                        iconUrl: 'icons/iconbig.png',
                        title: 'Session Saved with Adjustment',
                        message: 'The oldest screenshot was removed to save the session due to storage limits.'
                    });
                    setTimeout(() => { chrome.notifications.clear(notifId); }, 7000);
                     // Update the main session object to reflect the change if the save was successful.
                    session.annotations[oldestAnnotationIndex].imageURL = "IMAGE_REMOVED_DUE_TO_STORAGE_LIMIT";

                } catch (secondError) {
                    console.error('Error saving session even after removing screenshot:', secondError);
                    // Notify user about failed save even after removing screenshot
                    const notifId = 'sessionSaveFailedAfterQuota-' + Date.now();
                    chrome.notifications.create(notifId, {
                        type: 'basic',
                        iconUrl: 'icons/iconbig.png',
                        title: 'Session Save Failed',
                        message: 'Failed to save session. Insufficient storage even after removing the oldest screenshot.'
                    });
                    setTimeout(() => { chrome.notifications.clear(notifId); }, 7000);
                }
            } else {
                // No annotation with imageURL found
                console.error('Failed to save session. No screenshots to remove for quota.');
                const notifId = 'sessionSaveFailedNoScreenshot-' + Date.now();
                chrome.notifications.create(notifId, {
                    type: 'basic',
                    iconUrl: 'icons/iconbig.png',
                    title: 'Session Save Failed',
                    message: 'Failed to save session. Insufficient storage and no screenshots to remove.'
                });
                setTimeout(() => { chrome.notifications.clear(notifId); }, 7000);
            }
        } else {
            // Not a quota error, re-throw or handle as appropriate
            console.error('Error saving session:', error);
            throw error;
        }
    }

    // Trigger Drive auto-sync after local save
    scheduleDriveSync();
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

// Cargar la sesión y configuración de Drive al iniciar
loadSession();
loadDriveSettings();

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
        case "initiateCropSelection":
            // Forward the crop selection request to the content script
            chrome.tabs.query({ active: true, currentWindow: true }, async function(tabs) {
                if (tabs && tabs[0] && tabs[0].id != null) {
                    const tab = tabs[0];

                    // Check if the page allows content scripts
                    if (tab.url.startsWith('chrome://') || tab.url.startsWith('edge://') ||
                        tab.url.startsWith('chrome-extension://') || tab.url.startsWith('about:')) {
                        const notifId = 'cropSelectionError-' + Date.now();
                        chrome.notifications.create(notifId, {
                            type: 'basic',
                            iconUrl: 'icons/iconbig.png',
                            title: 'Selection Not Available',
                            message: 'Screen selection cannot be used on this type of page. Please try on a regular webpage.'
                        });
                        setTimeout(() => { chrome.notifications.clear(notifId); }, 5000);
                        return;
                    }

                    try {
                        // Try to inject content script if it's not already loaded
                        await chrome.scripting.executeScript({
                            target: { tabId: tab.id },
                            files: ['js/content_script.js']
                        }).catch(() => {
                            // Content script might already be loaded, ignore error
                            console.log("Background: Content script might already be loaded");
                        });

                        // Small delay to ensure content script is ready
                        setTimeout(() => {
                            chrome.tabs.sendMessage(tab.id, {
                                type: "startSelection",
                                annotationType: request.annotationType,
                                description: request.description
                            }, function(response) {
                                if (chrome.runtime.lastError) {
                                    console.error("Background: Error sending startSelection to content script:", chrome.runtime.lastError.message);
                                    const notifId = 'cropSelectionError-' + Date.now();
                                    chrome.notifications.create(notifId, {
                                        type: 'basic',
                                        iconUrl: 'icons/iconbig.png',
                                        title: 'Selection Failed',
                                        message: 'Could not start screen selection. Please try again.'
                                    });
                                    setTimeout(() => { chrome.notifications.clear(notifId); }, 5000);
                                } else {
                                    console.log("Background: Successfully initiated crop selection on content script");
                                }
                            });
                        }, 100);

                    } catch (error) {
                        console.error("Background: Error injecting content script:", error);
                        const notifId = 'cropSelectionError-' + Date.now();
                        chrome.notifications.create(notifId, {
                            type: 'basic',
                            iconUrl: 'icons/iconbig.png',
                            title: 'Selection Failed',
                            message: 'Could not start screen selection. Error: ' + error.message
                        });
                        setTimeout(() => { chrome.notifications.clear(notifId); }, 5000);
                    }
                } else {
                    console.error("Background: No active tab found for crop selection");
                }
            });
            break;
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
        case "requestCropScreenshot":
            console.log("Background: Received requestCropScreenshot", request);
            handleCropScreenshotRequest(request)
                .then((croppedImageData) => {
                    sendResponse({ croppedImageData: croppedImageData });
                })
                .catch((error) => {
                    console.error("Background: Failed to capture crop screenshot:", error);
                    sendResponse({ croppedImageData: null });
                });
            isAsync = true;
            break;
        case "csToBgCropData":
            console.log("Background: Received csToBgCropData", request);
            handleProcessAnnotatedCrop(request)
                .then(() => {
                    console.log("Background: Annotated crop processed successfully");
                })
                .catch((error) => {
                    console.error("Background: Failed to process annotated crop:", error);
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

        // --- Google Drive handlers ---
        case "driveConnect":
            driveService.authenticate()
                .then(() => {
                    sendResponse({ status: "ok" });
                })
                .catch(error => {
                    sendResponse({ status: "error", error: error.message });
                });
            isAsync = true;
            break;

        case "driveDisconnect":
            driveService.disconnect()
                .then(async () => {
                    driveAutoSave = false;
                    driveFileId = null;
                    driveSyncStatus = 'idle';
                    await saveDriveSettings();
                    sendResponse({ status: "ok" });
                })
                .catch(error => {
                    sendResponse({ status: "error", error: error.message });
                });
            isAsync = true;
            break;

        case "driveGetStatus":
            sendResponse({
                connected: driveService.isAuthenticated(),
                autoSave: driveAutoSave,
                syncStatus: driveSyncStatus,
                fileId: driveFileId
            });
            break;

        case "driveSetAutoSave":
            driveAutoSave = request.enabled;
            saveDriveSettings().then(() => {
                sendResponse({ status: "ok", autoSave: driveAutoSave });
            });
            isAsync = true;
            break;

        case "driveSaveNow":
            syncToDrive()
                .then(() => {
                    sendResponse({ status: "ok", syncStatus: driveSyncStatus, fileId: driveFileId });
                })
                .catch(error => {
                    sendResponse({ status: "error", error: error.message, syncStatus: driveSyncStatus });
                });
            isAsync = true;
            break;

        case "driveListSessions":
            driveService.listSessions()
                .then(files => {
                    sendResponse({ status: "ok", files });
                })
                .catch(error => {
                    sendResponse({ status: "error", error: error.message });
                });
            isAsync = true;
            break;

        case "driveLoadSession":
            driveService.downloadSession(request.fileId)
                .then(jsonData => {
                    if (importSessionJSon(jsonData)) {
                        driveFileId = request.fileId;
                        return saveDriveSettings().then(() => saveSession()).then(() => {
                            sendResponse({ status: "ok" });
                        });
                    } else {
                        sendResponse({ status: "error", error: "Invalid session data" });
                    }
                })
                .catch(error => {
                    sendResponse({ status: "error", error: error.message });
                });
            isAsync = true;
            break;

        case "driveDeleteSession":
            driveService.deleteSession(request.fileId)
                .then(() => {
                    if (driveFileId === request.fileId) {
                        driveFileId = null;
                        saveDriveSettings();
                    }
                    sendResponse({ status: "ok" });
                })
                .catch(error => {
                    sendResponse({ status: "error", error: error.message });
                });
            isAsync = true;
            break;
    }
    return isAsync; // Return true only if sendResponse is used asynchronously in any of the handled cases.
});


// Handle crop screenshot request - capture and crop, then return to content script
async function handleCropScreenshotRequest(request) {
    try {
        console.log("Background: Processing crop screenshot request", request);

        // Capture the visible tab
        const dataUrl = await chrome.tabs.captureVisibleTab(null, { format: "png" });
        if (!dataUrl) {
            throw new Error("Failed to capture screenshot");
        }

        // Convert dataUrl to Blob
        const response = await fetch(dataUrl);
        const blob = await response.blob();

        // Create bitmap from image
        const bitmap = await createImageBitmap(blob);

        // Create offscreen canvas with crop dimensions
        const canvas = new OffscreenCanvas(
            request.coordinates.width,
            request.coordinates.height
        );
        const ctx = canvas.getContext('2d');

        // Draw the selected portion
        ctx.drawImage(
            bitmap,
            request.coordinates.x,
            request.coordinates.y,
            request.coordinates.width,
            request.coordinates.height,
            0,
            0,
            request.coordinates.width,
            request.coordinates.height
        );

        // Convert canvas to blob
        const croppedBlob = await canvas.convertToBlob({ type: 'image/png' });

        // Convert blob to dataUrl
        const croppedDataUrl = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(croppedBlob);
        });

        console.log("Background: Successfully created cropped screenshot");
        return croppedDataUrl;
    } catch (error) {
        console.error("Background: Error in handleCropScreenshotRequest:", error);
        throw error;
    }
}

// Handle annotated crop data - save the final annotated image
async function handleProcessAnnotatedCrop(request) {
    try {
        console.log("Background: Processing annotated crop", request);

        // Create annotation with the annotated image
        await addAnnotation(
            request.annotationType.charAt(0).toUpperCase() + request.annotationType.slice(1),
            request.description,
            request.annotatedImageData
        );

        console.log("Background: Successfully processed annotated crop");
    } catch (error) {
        console.error("Background: Error in handleProcessAnnotatedCrop:", error);
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
    driveFileId = null;
    await saveDriveSettings();
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