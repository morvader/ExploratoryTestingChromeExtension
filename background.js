
var session = new Session();

chrome.extension.onMessage.addListener(function(request, sender, sendResponse) {
    switch(request.type) {
        case "addBug":
            addAnnotation("Bug",request.name);
            break;
        case "addIdea":
            addAnnotation("Idea",request.name);
            break;
        case "addNote":
            addAnnotation("Note",request.name);
            break;
        case "addQuestion":
            addAnnotation("Question",request.name);
            break;
        case "exportSessionCSV":
            exportSessionCSV();
            break;
        case "clearSession":
            clearSession();
            break;
    }
    sendResponse({status: "ok"});
    return true;
});

function addAnnotation(type, name){

    var currentUrl;
    var now = Date.now();

    if(session.getAnnotations().length == 0) this.startSession();

     chrome.tabs.query({currentWindow: true, active: true},
      function(tabs){
         currentUrl = tabs[0].url;
         //alert(currentUrl);
        switch(type){
          case "Bug":
            var newBug = new Bug(name,currentUrl, now);
            session.addBug(newBug);
            break;
          case "Note":
            var newNote = new Note(name,currentUrl, now);
            session.addNote(newNote);
            break;
          case "Idea":
            var newIdea = new Idea(name,currentUrl, now);
            session.addIdea(newIdea);
            break;
          case "Question":
            var newQuestion = new Question(name,currentUrl, now);
            session.addQuestion(newQuestion);
            break;
        }
      });
}

function startSession(){
    var browser=get_browser_info();
    // browser.name = 'Chrome'
    // browser.version = '40'
    var browserInfoString = browser.name + "_" + browser.version;

    session = new Session(Date.now(),browserInfoString);
};

function clearSession(){
    session.clearAnnotations();
};

function exportSessionCSV(){
    var exportService = new ExportSessionCSV(session);
    var csvData = exportService.getCSVData();

    var browserInfo = session.getBrowserInfo();

    //Take the timestamp of the first Annotation
    var startDateTime = session.getStartDateTime().toString('yyyyMMdd_HHmm');

    var fileName = "ExploratorySession_" + browserInfo + "_" + startDateTime + ".csv";

    var pom = document.createElement('a');
    var blob = new Blob([csvData],{type: 'text/csv;charset=utf-8;'});
    var url = URL.createObjectURL(blob);
    pom.href = url;
    pom.setAttribute('download', fileName);
    pom.click();
};

//chrome.commands.onCommand.addListener(function(command) {
//  //console.log('onCommand event received for message: ', command);
//  chrome.extension.sendRequest({command: command}, function(response) {});
//});
