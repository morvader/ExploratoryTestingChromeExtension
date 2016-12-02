var session = new Session();

chrome.extension.onMessage.addListener(function(request, sender, sendResponse) {
    switch (request.type) {
        case "addBug":
            addAnnotation("Bug", request.name, request.imageURL);
            break;
        case "addIdea":
            addAnnotation("Idea", request.name, request.imageURL);
            break;
        case "addNote":
            addAnnotation("Note", request.name, request.imageURL);
            break;
        case "addQuestion":
            addAnnotation("Question", request.name, request.imageURL);
            break;
        case "updateAnnotationName":
            var AnnotationID = request.annotationID;
            var newName = request.newName;

            var annotations = session.getAnnotations();
            var annotation = annotations[AnnotationID];
            annotation.setName(newName);

            break;
        case "deleteAnnotation":
            session.deleteAnnotation(request.annotationID);
            break;
        case "exportSessionCSV":
            if (!exportSessionCSV())
                sendResponse({
                    status: "nothing to export"
                });
            break;
        case "clearSession":
            clearSession();
            break;
    }
    sendResponse({
        status: "ok"
    });
    return true;
});

function addAnnotation(type, name, imageURL) {

    var currentUrl;
    var now = Date.now();

    if (session.getAnnotations().length == 0) this.startSession();

    chrome.tabs.query({
            currentWindow: true,
            active: true
        },
        function(tabs) {
            currentUrl = tabs[0].url;
            //alert(currentUrl);
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
        });
}

function startSession() {
    var systemInfo = getSystemInfo();
    session = new Session(Date.now(), systemInfo);
};

function clearSession() {
    session.clearAnnotations();
};

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
};