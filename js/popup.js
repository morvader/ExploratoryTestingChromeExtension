window.onload = function () {
  updateCounters();
  $(function () {
    $('[data-toggle="tooltip"]').tooltip()
  })
}

function showBugReport() {
  hideAllReports();
  $("#addNewBug").fadeIn();
  document.getElementById("newBugDescription").focus();
};

function showIdeaReport() {
  hideAllReports();
  $("#addNewIdea").fadeIn();
  document.getElementById("newIdeaDescription").focus();
};

function showNoteReport() {
  hideAllReports();
  $("#addNewNote").fadeIn();
  document.getElementById("newNoteDescription").focus();
};

function showQuestionReport() {
  hideAllReports();
  $("#addNewQuestion").fadeIn();
  document.getElementById("newQuestionDescription").focus();
};

document.addEventListener('DOMContentLoaded', function () {
  var bugBtn = document.getElementById("BugBtn");
  bugBtn.addEventListener('click', showBugReport);
}, false);

document.addEventListener('DOMContentLoaded', function () {
  var addNewBugBtn = document.getElementById("addNewBugBtn");
  addNewBugBtn.addEventListener('click', function () {
    addNewBug("");
  }, false);
}, false);

document.addEventListener('DOMContentLoaded', function () {
  var addNewBugBtn = document.getElementById("addNewBugSCBtn");
  addNewBugBtn.addEventListener('click', function () {
    addNewAnnotationWithScreenShot("bug");
  }, false);
}, false);


function addNewBug(imageURL) {
  //var bugName = document.getElementById("newBugDescription").value;
  var bugName = $('#newBugDescription').val().trim();
  if (bugName == "") return;

  chrome.extension.sendMessage({
    type: "addBug",
    name: bugName,
    imageURL: imageURL
  }, function (response) {
    updateCounters();
  });

  clearAllReports();
  hideAllReports();
};

function addNewNote(imageURL) {
  //var noteName = document.getElementById("newNoteDescription").value;
  var noteName = $('#newNoteDescription').val().trim();
  if (noteName == "") return;

  chrome.extension.sendMessage({
    type: "addNote",
    name: noteName,
    imageURL: imageURL
  }, function (response) {
    updateCounters();
  });

  clearAllReports();
  hideAllReports();
};

function addNewIdea(imageURL) {
  //var ideaName = document.getElementById("newIdeaDescription").value;
  var ideaName = $('#newIdeaDescription').val().trim();
  if (ideaName == "") return;
  chrome.extension.sendMessage({
    type: "addIdea",
    name: ideaName,
    imageURL: imageURL
  }, function (response) {
    updateCounters();
  });

  clearAllReports();
  hideAllReports();
};

function addNewQuestion(imageURL) {
  //var questionName = document.getElementById("newQuestionDescription").value;
  var questionName = $('#newQuestionDescription').val().trim();
  if (questionName == "") return;
  chrome.extension.sendMessage({
    type: "addQuestion",
    name: questionName,
    imageURL: imageURL
  }, function (response) {
    updateCounters();
  });

  clearAllReports();
  hideAllReports();
};

document.addEventListener('DOMContentLoaded', function () {
  var noteBtn = document.getElementById("NoteBtn");
  noteBtn.addEventListener('click', showNoteReport);
}, false);

document.addEventListener('DOMContentLoaded', function () {
  var addNewNoteBtn = document.getElementById("addNewNoteBtn");
  addNewNoteBtn.addEventListener('click', function () {
    addNewNote("");
  }, false);
}, false);

document.addEventListener('DOMContentLoaded', function () {
  var addNewNoteBtn = document.getElementById("addNewNoteSCBtn");
  addNewNoteBtn.addEventListener('click', function () {
    addNewAnnotationWithScreenShot("note");
  });
});

document.addEventListener('DOMContentLoaded', function () {
  var questionBtn = document.getElementById("QuestionBtn");
  questionBtn.addEventListener('click', showQuestionReport)
}, false);

document.addEventListener('DOMContentLoaded', function () {
  var questionBtn = document.getElementById("addNewQuestionBtn");
  questionBtn.addEventListener('click', function () {
    addNewQuestion("");
  }, false);
}, false);

document.addEventListener('DOMContentLoaded', function () {
  var questionBtn = document.getElementById("addNewQuestionSCBtn");
  questionBtn.addEventListener('click', function () {
    addNewAnnotationWithScreenShot("question");
  }, false);
}, false);


document.addEventListener('DOMContentLoaded', function () {
  var ideaBtn = document.getElementById("IdeaBtn");
  ideaBtn.addEventListener('click', showIdeaReport)
}, false);

document.addEventListener('DOMContentLoaded', function () {
  var ideaBtn = document.getElementById("addNewIdeaBtn");
  ideaBtn.addEventListener('click', function () {
    addNewIdea("");
  }, false);
}, false);

document.addEventListener('DOMContentLoaded', function () {
  var ideaBtn = document.getElementById("addNewIdeaSCBtn");
  ideaBtn.addEventListener('click', function () {
    addNewAnnotationWithScreenShot("idea");
  }, false);
}, false);


function addNewAnnotationWithScreenShot(type) {
  switch (type) {
    case "bug":
      chrome.tabs.captureVisibleTab(function (screenshotUrl) {
        addNewBug(screenshotUrl);
      });
      break;
    case "idea":
      chrome.tabs.captureVisibleTab(function (screenshotUrl) {
        addNewIdea(screenshotUrl);
      });
      break;
    case "question":
      chrome.tabs.captureVisibleTab(function (screenshotUrl) {
        addNewQuestion(screenshotUrl);
      });
      break;
    case "note":
      chrome.tabs.captureVisibleTab(function (screenshotUrl) {
        addNewNote(screenshotUrl);
      });
      break;
  }
}

/* Export to CSV  */
function exportSessionCSV() {
  chrome.extension.sendMessage({
    type: "exportSessionCSV"
  });
};

document.addEventListener('DOMContentLoaded', function () {
  var exportCSVBtn = document.getElementById("exportCSVBtn");
  exportCSVBtn.addEventListener('click', exportSessionCSV)
}, false);


/* Export to JSon */
function exportSessionJSon() {
  chrome.extension.sendMessage({
    type: "exportSessionJSon"
  });
};

document.addEventListener('DOMContentLoaded', function () {
  var exportJSonBtn = document.getElementById("exportJsonBtn");
  exportJSonBtn.addEventListener('click', exportSessionJSon)
}, false);

/* Import from JSon */
function importSessionJSon(evt) {
  debugger;
  var files = evt.target.files; // FileList object

  var reader = new FileReader();
  reader.onload = onReaderLoad;
  reader.readAsText(files[0]);
};

function onReaderLoad(event) {

  var importSession = event.target.result;
  chrome.extension.sendMessage({
    type: "importSessionJSon",
    jSonSession: importSession
  }, function (response) {
    clearAllReports();
    updateCounters();
  });

}
document.addEventListener('DOMContentLoaded', function () {
  var importJSonBtn = document.getElementById("importJsonBtn");
  importJSonBtn.addEventListener('click', function () {
    $('#importJsonInput').click();
  })
}, false);

document.addEventListener('DOMContentLoaded', function () {
  var importJSonBtn = document.getElementById("importJsonInput");
  importJSonBtn.addEventListener('change', importSessionJSon)
}, false);

document.addEventListener('DOMContentLoaded', function () {
  var cancelAnnotationBtn = document.getElementsByName("Cancel");
  for (var i = 0; i < cancelAnnotationBtn.length; i++) {
    cancelAnnotationBtn[i].addEventListener('click', cancelAnnotation);
  }
}, false);

function cancelAnnotation() {
  clearAllReports();
  hideAllReports();
};

function clearAllReports() {
  var descriptions = document.getElementsByTagName("textarea");
  for (i = 0; i < descriptions.length; i++) {
    descriptions[i].value = "";
  }
};

function hideAllReports() {
  $("#newBugDescription").val('');
  $("#newIdeaDescription").val('');
  $("#newNoteDescription").val('');
  $("#newQuestionDescription").val('');

  $("#addNewBug").slideUp();
  $("#addNewIdea").slideUp();
  $("#addNewNote").slideUp();
  $("#addNewQuestion").slideUp();
};

document.addEventListener('DOMContentLoaded', function () {
  var previewBtn = document.getElementById('previewBtn');
  previewBtn.addEventListener('click', function () {
    var background = chrome.extension.getBackgroundPage();
    var session = background.session;

    if (session.getAnnotations().length == 0) return;

    chrome.tabs.create({
      url: chrome.extension.getURL("HTMLReport/preview.html"),
      'active': false
    }, function (tab) {
      var selfTabId = tab.id;
      chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
        if (changeInfo.status == "complete" && tabId == selfTabId) {
          // send the data to the page's script:
          var tabs = chrome.extension.getViews({
            type: "tab"
          });
          tabs[0].loadData();
        }
      });
    });
  }, false);
}, false);

function updateCounters() {
  var background = chrome.extension.getBackgroundPage();
  var session = background.session;

  var bugs = session.getBugs().length;
  var notes = session.getNotes().length;
  var ideas = session.getIdeas().length;
  var questions = session.getQuestions().length;

  if (bugs > 0) {
    $("#bugCounter").html(" " + bugs + " ");
  }

  if (notes > 0) {
    $("#noteCounter").html(" " + notes + " ");
  }

  if (ideas > 0) {
    $("#ideaCounter").html(" " + ideas + " ");
  }

  if (questions > 0) {
    $("#questionCounter").html(" " + questions + " ");
  }
};

document.addEventListener('DOMContentLoaded', function () {
  var exportCSVBtn = document.getElementById("newBugDescription");
  exportCSVBtn.addEventListener("keypress", function (e) {
    var key = e.which || e.keyCode;
    if (key == 13) { // 13 is enter
      if (e.shiftKey == true) {
        addNewAnnotationWithScreenShot("bug");
      } else {
        addNewBug(""); // code for enter
      }
    }
  }, false);
}, false);

document.addEventListener('DOMContentLoaded', function () {
  var exportCSVBtn = document.getElementById("newIdeaDescription");
  exportCSVBtn.addEventListener("keypress", function (e) {
    var key = e.which || e.keyCode;
    if (key == 13) { // 13 is enter
      if (e.shiftKey == true) {
        addNewAnnotationWithScreenShot("idea");
      } else {
        addNewIdea(""); // code for enter
      }
    }
  }, false);
}, false);

document.addEventListener('DOMContentLoaded', function () {
  var exportCSVBtn = document.getElementById("newNoteDescription");
  exportCSVBtn.addEventListener("keypress", function (e) {
    var key = e.which || e.keyCode;
    if (key == 13) { // 13 is enter
      if (e.shiftKey == true) {
        addNewAnnotationWithScreenShot("note");
      } else {
        addNewNote(""); // code for enter
      }
    }
  }, false);
}, false);

document.addEventListener('DOMContentLoaded', function () {
  var exportCSVBtn = document.getElementById("newQuestionDescription");
  exportCSVBtn.addEventListener("keypress", function (e) {
    var key = e.which || e.keyCode;
    if (key == 13) { // 13 is enter
      if (e.shiftKey == true) {
        addNewAnnotationWithScreenShot("question");
      } else {
        addNewQuestion(""); // code for enter
      }
    }
  }, false);
}, false);

document.addEventListener('DOMContentLoaded', function () {
  var resetBtn = document.getElementById('resetBtn');
  resetBtn.addEventListener('click', function () {
    var background = chrome.extension.getBackgroundPage();
    var session = background.session;
    if (session.getAnnotations().length == 0) return;

    var resetConfirmation = document.getElementById('resetConfirmation');
    $("#resetConfirmation").fadeIn();
  }, false);
}, false);

document.addEventListener('DOMContentLoaded', function () {
  var resetBtnNo = document.getElementById('resetNo');
  resetBtnNo.addEventListener('click', function () {
    $("#resetConfirmation").slideUp();
  });
});

document.addEventListener('DOMContentLoaded', function () {
  var resetBtnNo = document.getElementById('resetYes');
  resetBtnNo.addEventListener('click', function () {
    var background = chrome.extension.getBackgroundPage();
    var session = background.session;
    if (session.getAnnotations().length == 0) return;
    chrome.extension.sendMessage({
      type: "clearSession"
    }, function (response) {
      $("#bugCounter").html("");
      $("#ideaCounter").html("");
      $("#noteCounter").html("");
      $("#questionCounter").html("");
    });
    $("#resetConfirmation").slideUp();
  });
});