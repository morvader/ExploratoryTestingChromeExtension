var session = new Session();

chrome.browserAction.onClicked.addListener(function(tab) {
    chrome.tabs.insertCSS(null, {file: "popUp.css"});

    chrome.tabs.executeScript(null, { file: "lib/jquery-1.11.3.min.js" }, function() {
        chrome.tabs.executeScript(null, { file: "popup.js" });
    });
});

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
            chrome.tabs.sendMessage(session.getTabId(), {type: "updateGui"});
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
        case "getCounters":
            var counters = {
              bugs: session.getBugs().length,
              notes: session.getNotes().length,
              ideas: session.getIdeas().length,
              questions: session.getQuestions().length
            };
            sendResponse(counters);
            break;
        case "createReport":
            session.setTabId(sender.tab.id);
            chrome.tabs.create({
              url: chrome.extension.getURL("HTMLReport/preview.html"),
                'active': true
              }, function(tab) {
                var selfTabId = tab.id;
                chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
                  if (changeInfo.status == "complete" && tabId == selfTabId) {
                    // send the data to the page's script:
                    var tabs = chrome.extension.getViews({
                      type: "tab"
                    });
                    tabs[0].loadData();
                  }
                });
            });
            break;
        case "getAnnotationsCount":
          sendResponse({count: session.getAnnotations().length});
          break;
        case "captureVisibleTab":
          chrome.tabs.captureVisibleTab(null, function(screenshotUrl) {
            chrome.tabs.sendMessage(sender.tab.id,
              {type: "screenshot", url: screenshotUrl, name: request.name}
            );
          });
          sendResponse({
              status: "ok"
          });
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
    var browser = get_browser_info();
    var browserInfoString = browser.name + "_" + browser.version;

    session = new Session(Date.now(), browserInfoString);
};

function clearSession() {
    session.clearAnnotations();
};

function exportSessionCSV() {

    if (session.getAnnotations().length == 0) return false;

    var exportService = new ExportSessionCSV(session);
    var csvData = exportService.getCSVData();

    var browserInfo = session.getBrowserInfo();

    //Take the timestamp of the first Annotation
    var startDateTime = session.getStartDateTime().toString('yyyyMMdd_HHmm');

    var fileName = "ExploratorySession_" + browserInfo + "_" + startDateTime + ".csv";

    var pom = document.createElement('a');
    var blob = new Blob([csvData], {
        type: 'text/csv;charset=utf-8;'
    });
    var url = URL.createObjectURL(blob);
    pom.href = url;
    pom.setAttribute('download', fileName);
    pom.click();
};
