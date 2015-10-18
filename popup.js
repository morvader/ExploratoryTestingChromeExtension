var session = new Session();

function showBugReport(){
    hideAllReports();
    document.getElementById('addNewBug').style.display = 'block'; // show clicked element
};

function showIdeaReport(){
    hideAllReports();
    document.getElementById('addNewIdea').style.display = 'block'; // show clicked element
};
function showNoteReport(){
    hideAllReports();
    document.getElementById('addNewNote').style.display = 'block'; // show clicked element
};
function showQuestionReport(){
    hideAllReports();
    document.getElementById('addNewQuestion').style.display = 'block'; // show clicked element
};

function addNewBug(){
    var bugName = document.getElementById('newBugDescription').value;
    if(bugName == "") return;

    var newBug = new Bug(bugName);

    session.addBug(newBug);

    //alert(session.getAnnotations().length);

    clearAllReports();
    hideAllReports();

};
function addNewNote(){
    var noteName = document.getElementById('newNoteDescription').value;
    if(noteName == "") return;

    var newNote = new Note(noteName);

    session.addNote(newNote);

    clearAllReports();
    hideAllReports();

};
function addNewIdea(){
    var ideaName = document.getElementById('newIdeaDescription').value;
    if(ideaName == "") return;

    var newIdea = new Idea(ideaName);

    session.addIdea(newIdea);

    clearAllReports();
    hideAllReports();

};
function addNewQuestion(){
    var questionName = document.getElementById('newQuestionDescription').value;
    if(questionName == "") return;

    var newQuestion = new Question(questionName);

    session.addQuestion(newQuestion);

    clearAllReports();
    hideAllReports();

};

function exportSesstionCSV(){
    if(session.getAnnotations().length == 0) return;

    var exportService = new ExportSessionCSV(session);
    var csvData = exportService.getCSVData();

    var fileName = "test" + ".csv";

    var pom = document.createElement('a');
    var blob = new Blob([csvData],{type: 'text/csv;charset=utf-8;'});
    var url = URL.createObjectURL(blob);
    pom.href = url;
    pom.setAttribute('download', fileName);
    pom.click();
};

function clearSession(){
    session = new Session();
};
function cancelAnnotation(){
   clearAllReports();
   hideAllReports();
};

function clearAllReports(){
   var descriptions = document.getElementsByTagName("textarea");
   for (i = 0; i < descriptions.length ;i++) {
       descriptions[i].value = "";
   }
};

function hideAllReports(){
    document.getElementById('addNewBug').style.display = 'none';
    document.getElementById('addNewIdea').style.display = 'none';
    document.getElementById('addNewNote').style.display = 'none';
    document.getElementById('addNewQuestion').style.display = 'none';
};
