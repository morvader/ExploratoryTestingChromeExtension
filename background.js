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
                const now = Date.now();

                switch (type) {
                    case "Bug":
                        var newBug = new Bug(name, currentUrl, now, imageURL);
                        session.addBug(newBug);
                        break;
                    case "Note":
                        var newNote = new Note(name, currentUrl, now, imageURL);
                        session.addNote(newNote);
                        break;
                    case "Idea":
                        var newIdea = new Idea(name, currentUrl, now, imageURL);
                        session.addIdea(newIdea);
                        break;
                    case "Question":
                        var newQuestion = new Question(name, currentUrl, now, imageURL);
                        session.addQuestion(newQuestion);
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

    //Take the timestamp of the first Annotation
    var startDateTime = session.getStartDateTime().toString('yyyyMMdd_HHmm');

    var fileName = "ExploratorySession_" + browserInfoString + "_" + startDateTime + ".csv";

    var pom = document.createElement('a');
    var blob = new Blob([csvData], {
        type: 'text/csv;charset=utf-8;'
    });
    var url = URL.createObjectURL(blob);
    pom.href = url;
    pom.setAttribute('download', fileName);
    pom.click();

    return true;
}

function exportSessionJSon() {
    if (session.getAnnotations().length == 0) return false;

    debugger;
    var exportJSonService = new JSonSessionService();
    var jsonData = exportJSonService.getJSon(session);

    var browserInfo = session.getBrowserInfo();

    var browserInfoString = browserInfo.browser + "_" + browserInfo.browserVersion;

    //Take the timestamp of the first Annotation
    var startDateTime = session.getStartDateTime().toString('yyyyMMdd_HHmm');

    var fileName = "ExploratorySession_" + browserInfoString + "_" + startDateTime + ".json";

    var pom = document.createElement('a');
    var blob = new Blob([jsonData], {
        type: 'application/json'
    });
    var url = URL.createObjectURL(blob);
    pom.href = url;
    pom.setAttribute('download', fileName);
    pom.click();

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