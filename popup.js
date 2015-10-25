//var session = new Session();
var currentUrl;

function showBugReport(){
    hideAllReports();
    document.getElementById("addNewBug").style.display = 'block'; // show clicked element
};

function showIdeaReport(){
    hideAllReports();
    document.getElementById("addNewIdea").style.display = 'block'; // show clicked element
};
function showNoteReport(){
    hideAllReports();
    document.getElementById("addNewNote").style.display = 'block'; // show clicked element
};
function showQuestionReport(){
    hideAllReports();
    document.getElementById("addNewQuestion").style.display = 'block'; // show clicked element
};

document.addEventListener('DOMContentLoaded', function() {
  var bugBtn = document.getElementById("BugBtn");
  bugBtn.addEventListener('click', showBugReport);
}, false);

document.addEventListener('DOMContentLoaded', function() {
  var addNewBug = document.getElementById("addNewBugBtn");
  addNewBug.addEventListener('click', function() {

    var bugName = document.getElementById("newBugDescription").value;
    if(bugName == "") return;

    chrome.extension.sendMessage({
      type: "addBug",
      name: bugName,
    });

    clearAllReports();
    hideAllReports();

  }, false);
}, false);

document.addEventListener('DOMContentLoaded', function() {
  var noteBtn = document.getElementById("NoteBtn");
  noteBtn.addEventListener('click', showNoteReport);
}, false);

document.addEventListener('DOMContentLoaded', function() {
  var addNewNoteBtn = document.getElementById("addNewNoteBtn");
  addNewNoteBtn.addEventListener('click', function() {

    var noteName = document.getElementById("newNoteDescription").value;
    if(noteName == "") return;

    chrome.extension.sendMessage({
      type: "addNote",
      name: noteName,
    });

    clearAllReports();
    hideAllReports();

  }, false);
}, false);

document.addEventListener('DOMContentLoaded', function() {
  var questionBtn = document.getElementById("QuestionBtn");
  questionBtn.addEventListener('click', function() {
   showQuestionReport();
  }, false);
}, false);

document.addEventListener('DOMContentLoaded', function() {
  var addNewQuestionBtn = document.getElementById("addNewQuestionBtn");
  addNewQuestionBtn.addEventListener('click', function() {
    var questionName = document.getElementById("newQuestionDescription").value;
    if(questionName == "") return;
    chrome.extension.sendMessage({
      type: "addQuestion",
      name: questionName
    });

    clearAllReports();
    hideAllReports();

  }, false);
}, false);

document.addEventListener('DOMContentLoaded', function() {
  var ideaBtn = document.getElementById("IdeaBtn");
  ideaBtn.addEventListener('click', function() {
   showIdeaReport();
  }, false);
}, false);

document.addEventListener('DOMContentLoaded', function() {
  var addNewIdeaBtn = document.getElementById("addNewIdeaBtn");
  addNewIdeaBtn.addEventListener('click', function() {
    var ideaName = document.getElementById("newIdeaDescription").value;
    if(ideaName == "") return;
    chrome.extension.sendMessage({
      type: "addIdea",
      name: ideaName
    });

    clearAllReports();
    hideAllReports();

  }, false);
}, false);

function exportSessionCSV(){
   chrome.extension.sendMessage({
      type: "exportSessionCSV"
   });
};

document.addEventListener('DOMContentLoaded', function() {
  var exportCSVBtn = document.getElementById("exportCSVBtn");
  exportCSVBtn.addEventListener('click',  exportSessionCSV)
}, false);

document.addEventListener('DOMContentLoaded', function() {
   var cancelAnnotationBtn = document.getElementsByName("Cancel");
   for (var i = 0; i < cancelAnnotationBtn.length; i++) {
       cancelAnnotationBtn[i].addEventListener('click', cancelAnnotation);
   }
}, false);

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
    document.getElementById("addNewBug").style.display = 'none';
    document.getElementById("addNewIdea").style.display = 'none';
    document.getElementById("addNewNote").style.display = 'none';
    document.getElementById("addNewQuestion").style.display = 'none';
};

document.addEventListener('DOMContentLoaded', function() {
  var previewBtn = document.getElementById('previewBtn');
  previewBtn.addEventListener('click', function() {
   var background = chrome.extension.getBackgroundPage();
   var session = background.session;
   alert(session.getAnnotations().length)
  }, false);
}, false);

document.addEventListener('DOMContentLoaded', function() {
  var resetBtn = document.getElementById('resetBtn');
  resetBtn.addEventListener('click', function() {
    chrome.extension.sendMessage({
       type: "clearSession"
    });
  }, false);
}, false);