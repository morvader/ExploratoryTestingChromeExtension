window.onload = function() {
   updateCounters();
}

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
  var addNewBugBtn = document.getElementById("addNewBugBtn");
  addNewBugBtn.addEventListener('click', addNewBug);
}, false);

function addNewBug(){
    var bugName = document.getElementById("newBugDescription").value;
    if(bugName == "") return;

    chrome.extension.sendMessage({
      type: "addBug",
      name: bugName
    },function(response) {
        updateCounters();
    });

    clearAllReports();
    hideAllReports();
};

function addNewNote(){
    var noteName = document.getElementById("newNoteDescription").value;
    if(noteName == "") return;

    chrome.extension.sendMessage({
      type: "addNote",
      name: noteName,
    },function(response) {
       updateCounters();
    });

    clearAllReports();
    hideAllReports();
};

function addNewIdea(){
 var ideaName = document.getElementById("newIdeaDescription").value;
    if(ideaName == "") return;
    chrome.extension.sendMessage({
      type: "addIdea",
      name: ideaName
    },function(response) {
        updateCounters();
    });

    clearAllReports();
    hideAllReports();
};

function addNewQuestion(){
var questionName = document.getElementById("newQuestionDescription").value;
    if(questionName == "") return;
    chrome.extension.sendMessage({
      type: "addQuestion",
      name: questionName
    },function(response) {
       updateCounters();
    });

    clearAllReports();
    hideAllReports();
};

document.addEventListener('DOMContentLoaded', function() {
  var noteBtn = document.getElementById("NoteBtn");
  noteBtn.addEventListener('click', showNoteReport);
}, false);

document.addEventListener('DOMContentLoaded', function() {
  var addNewNoteBtn = document.getElementById("addNewNoteBtn");
  addNewNoteBtn.addEventListener('click', addNewNote);
}, false);

document.addEventListener('DOMContentLoaded', function() {
  var questionBtn = document.getElementById("QuestionBtn");
  questionBtn.addEventListener('click', showQuestionReport)
}, false);

document.addEventListener('DOMContentLoaded', function() {
  var addNewQuestionBtn = document.getElementById("addNewQuestionBtn");
  addNewQuestionBtn.addEventListener('click', addNewQuestion)
}, false);

document.addEventListener('DOMContentLoaded', function() {
  var ideaBtn = document.getElementById("IdeaBtn");
  ideaBtn.addEventListener('click', showIdeaReport)
}, false);

document.addEventListener('DOMContentLoaded', function() {
  var addNewIdeaBtn = document.getElementById("addNewIdeaBtn");
  addNewIdeaBtn.addEventListener('click',addNewIdea)
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

   if(session.getAnnotations().length == 0 ) return;

   //var exportHTMLService = new ExportSessionHTML(session);
   //var htmlData = exportHTMLService.getHTMLData();

   chrome.tabs.create({url: chrome.extension.getURL("HTMLReport/preview.html"),'active': false}, function(tab){
           var selfTabId = tab.id;
           chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
               if (changeInfo.status == "complete" && tabId == selfTabId){
                   // send the data to the page's script:
                   var tabs = chrome.extension.getViews({type: "tab"});
                   tabs[0].loadData(session);
               }
           });
       });
  }, false);
}, false);

document.addEventListener('DOMContentLoaded', function() {
  var resetBtn = document.getElementById('resetBtn');
  resetBtn.addEventListener('click', function() {
   var background = chrome.extension.getBackgroundPage();
   var session = background.session;

   //Only ask if there are annotations already
   if(session.getAnnotations().length == 0) return;

    var r = confirm("This will reset current session. Are you sure?");
    if (r == true) {
        chrome.extension.sendMessage({
               type: "clearSession"
        },function(response) {

         alert("Session cleared");

         document.getElementById('bugCounter').innerHTML  = "";
         document.getElementById('ideaCounter').innerHTML  = "";
         document.getElementById('noteCounter').innerHTML  = "";
         document.getElementById('questionCounter').innerHTML  = "";
        });

    } else {
        return;
    }
  }, false);
}, false);

function updateCounters(){
    var background = chrome.extension.getBackgroundPage();
    var session = background.session;

    var bugs = session.getBugs().length;
    var notes = session.getNotes().length;
    var ideas = session.getIdeas().length;
    var questions = session.getQuestions().length;

    if(bugs > 0){
      document.getElementById('bugCounter').innerHTML  = "(" + bugs + ")";
    }

    if(notes > 0){
      document.getElementById('noteCounter').innerHTML  = "(" + notes + ")";
    }

    if(ideas > 0 ){
      document.getElementById('ideaCounter').innerHTML  = "(" + ideas + ")";
    }

    if(questions > 0 ){
      document.getElementById('questionCounter').innerHTML  = "(" + questions + ")";
    }
};

document.addEventListener('DOMContentLoaded', function() {
  var exportCSVBtn = document.getElementById("newBugDescription");
  exportCSVBtn.addEventListener("keypress", function (e) {
    var key = e.which || e.keyCode;
    if (key == 13) { // 13 is enter
        addNewBug();             // code for enter
    }
  });
}, false);

document.addEventListener('DOMContentLoaded', function() {
  var exportCSVBtn = document.getElementById("newIdeaDescription");
  exportCSVBtn.addEventListener("keypress", function (e) {
    var key = e.which || e.keyCode;
    if (key == 13) { // 13 is enter
        addNewIdea();             // code for enter
    }
  });
}, false);

document.addEventListener('DOMContentLoaded', function() {
  var exportCSVBtn = document.getElementById("newNoteDescription");
  exportCSVBtn.addEventListener("keypress", function (e) {
    var key = e.which || e.keyCode;
    if (key == 13) { // 13 is enter
        addNewNote();             // code for enter
    }
  });
}, false);

document.addEventListener('DOMContentLoaded', function() {
  var exportCSVBtn = document.getElementById("newQuestionDescription");
  exportCSVBtn.addEventListener("keypress", function (e) {
    var key = e.which || e.keyCode;
    if (key == 13) { // 13 is enter
        addNewQuestion();             // code for enter
    }
  });
}, false);

