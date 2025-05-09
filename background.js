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

// Escuchar mensajes del popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    switch (request.type) {
        case "addBug":
            addAnnotation("Bug", request.name, request.imageURL)
                .then(() => sendResponse({ status: "ok" }))
                .catch(error => sendResponse({ status: "error", error: error.message }));
            break;
        case "addIdea":
            addAnnotation("Idea", request.name, request.imageURL)
                .then(() => sendResponse({ status: "ok" }))
                .catch(error => sendResponse({ status: "error", error: error.message }));
            break;
        case "addNote":
            addAnnotation("Note", request.name, request.imageURL)
                .then(() => sendResponse({ status: "ok" }))
                .catch(error => sendResponse({ status: "error", error: error.message }));
            break;
        case "addQuestion":
            addAnnotation("Question", request.name, request.imageURL)
                .then(() => sendResponse({ status: "ok" }))
                .catch(error => sendResponse({ status: "error", error: error.message }));
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
    return true; // Mantener el puerto de mensajes abierto para respuestas asíncronas
});

async function addAnnotation(type, name, imageURL) {
    if (session.getAnnotations().length == 0) {
        await startSession();
    }

    return new Promise((resolve, reject) => {
        chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
            try {
                const currentUrl = tabs[0].url;
                const now = new Date().getTime();

                let newAnnotation;
                switch (type) {
                    case "Bug":
                        newAnnotation = new Bug(name, currentUrl, now, imageURL);
                        session.addBug(newAnnotation);
                        break;
                    case "Note":
                        newAnnotation = new Note(name, currentUrl, now, imageURL);
                        session.addNote(newAnnotation);
                        break;
                    case "Idea":
                        newAnnotation = new Idea(name, currentUrl, now, imageURL);
                        session.addIdea(newAnnotation);
                        break;
                    case "Question":
                        newAnnotation = new Question(name, currentUrl, now, imageURL);
                        session.addQuestion(newAnnotation);
                        break;
                }
                saveSession().then(resolve).catch(reject);
            } catch (error) {
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