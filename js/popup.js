// At the top of popup.js
let currentAnnotationTypeForCrop = null;

window.onload = function () {
  initElements();

  $(function () {
    $('[data-toggle="tooltip"]').tooltip()
  })
}

function initElements() {
  annotationListeners();
  exportListeners();
  updateCounters();
  registerPopupMessageListener(); // Added listener registration
  $(function () {
    $('[data-toggle="tooltip"]').tooltip()
  })
}

function annotationListeners() {
  $(document).on('click', '#BugBtn', showBugReport);
  $(document).on('click', '#IdeaBtn', showIdeaReport);
  $(document).on('click', '#NoteBtn', showNoteReport);
  $(document).on('click', '#QuestionBtn', showQuestionReport);

  $(document).on('click', '#addNewBugBtn', () => {
    addNewBug("")
  });
  $(document).on('click', '#addNewIdeaBtn', () => {
    addNewIdea("")
  });
  $(document).on('click', '#addNewNoteBtn', () => {
    addNewNote("")
  });
  $(document).on('click', '#addNewQuestionBtn', () => {
    addNewQuestion("")
  });

  $(document).on('click', '#addNewBugSCBtn', () => {
    addNewAnnotationWithScreenShot("bug")
  });
  $(document).on('click', '#addNewIdeaSCBtn', () => {
    addNewAnnotationWithScreenShot("idea")
  });
  $(document).on('click', '#addNewNoteSCBtn', () => {
    addNewAnnotationWithScreenShot("note")
  });
  $(document).on('click', '#addNewQuestionSCBtn', () => {
    addNewAnnotationWithScreenShot("question")
  });

  // New listeners for crop buttons
  $(document).on('click', '#addNewBugCropBtn', () => { handleCropScreenshot("bug"); });
  $(document).on('click', '#addNewIdeaCropBtn', () => { handleCropScreenshot("idea"); });
  $(document).on('click', '#addNewNoteCropBtn', () => { handleCropScreenshot("note"); });
  $(document).on('click', '#addNewQuestionCropBtn', () => { handleCropScreenshot("question"); });
}

function handleCropScreenshot(type) {
    // Get description based on type
    let description = "";
    let descriptionFieldId = "";
    switch (type) {
        case "bug": descriptionFieldId = "#newBugDescription"; break;
        case "idea": descriptionFieldId = "#newIdeaDescription"; break;
        case "note": descriptionFieldId = "#newNoteDescription"; break;
        case "question": descriptionFieldId = "#newQuestionDescription"; break;
        default:
            console.error("Unknown annotation type for crop:", type);
            return;
    }
    description = $(descriptionFieldId).val().trim();

    if (description === "") {
        alert("Please enter a description before taking a cropped screenshot.");
        return; // Prevent starting selection if description is empty
    }

    // currentAnnotationTypeForCrop is still useful for 'selectionCancelled' if popup handles it.
    // If not, it can be removed from this function. Let's assume it might be used for cancellation.
    currentAnnotationTypeForCrop = type; 

    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        if (tabs && tabs[0] && tabs[0].id != null) {
            const tabId = tabs[0].id;
            const messagePayload = {
                type: "startSelection",
                annotationType: type, // Pass the annotation type
                description: description // Pass the description
            };

            chrome.tabs.sendMessage(tabId, messagePayload, function(response) {
                if (chrome.runtime.lastError) {
                    console.error("Error starting selection (sendMessage):", chrome.runtime.lastError.message);
                    alert("Failed to start selection mode. Please ensure the page is fully loaded and try again. Error: " + chrome.runtime.lastError.message);
                    currentAnnotationTypeForCrop = null; // Reset
                    return;
                }
                if (response && response.status === "selectionStarted") {
                    console.log("Popup: Selection started in content script for type '"+type+"' with description '"+description.substring(0,20)+"...'.");
                    // Popup remains open. No window.close().
                    // No longer processes coordinates here.
                } else {
                    console.warn("Popup: Content script did not confirm selection start. Response:", response);
                    alert("Could not initiate selection on the page. The selection script might not have responded correctly. Please try refreshing the page.");
                    currentAnnotationTypeForCrop = null; // Reset
                }
            });
        } else {
            console.error("Popup: No active tab with valid ID found.");
            alert("No active tab found. Please select a tab to capture from.");
            currentAnnotationTypeForCrop = null; // Reset
        }
    });
}

// Register the listener for messages from content script
function registerPopupMessageListener() {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        // Removed 'selectionCoordinates' handler
        if (request.type === "selectionCancelled") {
            console.log("Popup: Selection cancelled by content script for type:", currentAnnotationTypeForCrop);
            // Optionally, re-enable parts of the UI if they were disabled,
            // or show a message in the popup. For now, just log and reset.
            // A more robust check would be if (currentAnnotationTypeForCrop === request.annotationTypeFromContentScript)
            // but this requires content script to send annotationType on cancellation.
            currentAnnotationTypeForCrop = null; // Reset
        }
        // No 'return true;' as this listener does not call sendResponse() asynchronously
    });
}

function showBugReport() {
  hideAllReports();
  $("#addNewBug").fadeIn();
  $('#newBugDescription').focus();
};

function showIdeaReport() {
  hideAllReports();
  $("#addNewIdea").fadeIn();
  $('#newIdeaDescription').focus();
};

function showNoteReport() {
  hideAllReports();
  $("#addNewNote").fadeIn();
  $('#newNoteDescription').focus();
};

function showQuestionReport() {
  hideAllReports();
  $("#addNewQuestion").fadeIn();
  $('#newQuestionDescription').focus();
};

function addNewBug(imageURL) {
  console.log("Popup: Inside addNewBug. imageURL (first 100 chars):", imageURL ? imageURL.substring(0, 100) : "null");
  var bugName = $('#newBugDescription').val().trim();
  console.log("Popup: Bug name:", bugName);
  if (bugName == "") return;
  console.log("Popup: Sending message to background for addBug. Name:", bugName);

  chrome.runtime.sendMessage({
    type: "addBug",
    name: bugName,
    imageURL: imageURL
  }, function (response) {
    updateCounters();
  });

  clearAllReports();
  hideAllReports();
  // window.close(); // <-- REMOVED THIS LINE
};

function addNewNote(imageURL) {
  console.log("Popup: Inside addNewNote. imageURL (first 100 chars):", imageURL ? imageURL.substring(0, 100) : "null");
  var noteName = $('#newNoteDescription').val().trim();
  console.log("Popup: Note name:", noteName);
  if (noteName == "") return;
  console.log("Popup: Sending message to background for addNote. Name:", noteName);
  chrome.runtime.sendMessage({
    type: "addNote",
    name: noteName,
    imageURL: imageURL
  }, function (response) {
    updateCounters();
  });

  clearAllReports();
  hideAllReports();
  // window.close(); // <-- REMOVED THIS LINE
};

function addNewIdea(imageURL) {
  console.log("Popup: Inside addNewIdea. imageURL (first 100 chars):", imageURL ? imageURL.substring(0, 100) : "null");
  var ideaName = $('#newIdeaDescription').val().trim();
  console.log("Popup: Idea name:", ideaName);
  if (ideaName == "") return;
  console.log("Popup: Sending message to background for addIdea. Name:", ideaName);
  chrome.runtime.sendMessage({
    type: "addIdea",
    name: ideaName,
    imageURL: imageURL
  }, function (response) {
    updateCounters();
  });

  clearAllReports();
  hideAllReports();
  // window.close(); // <-- REMOVED THIS LINE
};

function addNewQuestion(imageURL) {
  console.log("Popup: Inside addNewQuestion. imageURL (first 100 chars):", imageURL ? imageURL.substring(0, 100) : "null");
  var questionName = $('#newQuestionDescription').val().trim();
  console.log("Popup: Question name:", questionName);
  if (questionName == "") return;
  console.log("Popup: Sending message to background for addQuestion. Name:", questionName);
  chrome.runtime.sendMessage({
    type: "addQuestion",
    name: questionName,
    imageURL: imageURL
  }, function (response) {
    updateCounters();
  });

  clearAllReports();
  hideAllReports();
  // window.close(); // <-- REMOVED THIS LINE
};



function addNewAnnotationWithScreenShot(type) {
  chrome.tabs.captureVisibleTab((screenshotUrl) => {
    if (screenshotUrl === 'undefined') screenshotUrl = "";
    switch (type) {
      case "bug":
        addNewBug(screenshotUrl);
        break;
      case "idea":
        addNewIdea(screenshotUrl);
        break;
      case "question":
        addNewQuestion(screenshotUrl);
        break;
      case "note":
        addNewNote(screenshotUrl);
        break;
    }
  })
}

/* Export to CSV  */
function exportSessionCSV() {
  chrome.runtime.sendMessage({
    type: "exportSessionCSV"
  });
};

function exportListeners() {
  $(document).on('click', '#exportCSVBtn', exportSessionCSV);
  $(document).on('click', '#exportJsonBtn', exportSessionJSon);
  $(document).on('click', '#importJsonBtn', () => {
    $('#importJsonInput').click()
  });
  $(document).on('change', '#importJsonInput', importSessionJSon);
}



/* Export to JSon */
function exportSessionJSon() {
  chrome.runtime.sendMessage({
    type: "exportSessionJSon"
  });
};


/* Import from JSon */
function importSessionJSon(evt) {
  var files = evt.target.files; // FileList object
  var reader = new FileReader();
  reader.onload = onReaderLoad;
  reader.readAsText(files[0]);
};

function onReaderLoad(event) {
  clearAllReports();
  var importSession = event.target.result;
  chrome.runtime.sendMessage({
    type: "importSessionJSon",
    jSonSession: importSession
  }, function (response) {
    updateCounters();
    //Reset input value
    $('#importJsonInput').val("");
  });

}


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
    chrome.runtime.sendMessage({ type: "getSessionData" }, function (response) {
      if (response.annotationsCount === 0) return;

      chrome.tabs.create({
        url: chrome.runtime.getURL("HTMLReport/preview.html"),
        'active': false
      });
    });
  }, false);
}, false);

function updateCounters() {
  chrome.runtime.sendMessage({ type: "getSessionData" }, function (response) {
    if (response.bugs > 0) $("#bugCounter").html(" " + response.bugs + " ");
    else $("#bugCounter").html("");

    if (response.notes > 0) $("#noteCounter").html(" " + response.notes + " ");
    else $("#noteCounter").html("");

    if (response.ideas > 0) $("#ideaCounter").html(" " + response.ideas + " ");
    else $("#ideaCounter").html("");

    if (response.questions > 0) $("#questionCounter").html(" " + response.questions + " ");
    else $("#questionCounter").html("");
  });
}

document.addEventListener('DOMContentLoaded', function () {
  var newBugDescription = document.getElementById("newBugDescription");
  newBugDescription.addEventListener("keypress", function (e) {
    var key = e.which || e.keyCode;
    // if ((e.keyCode == 10 || e.keyCode == 13) && e.ctrlKey) {
    //   $('#newBugDescription').val($('#newBugDescription').val() + '\n');
    // }
    if ((e.keyCode == 10 || e.keyCode == 13) && e.ctrlKey) {
      addNewBug("");
    }
    if (key == 13) { // 13 is enter
      if (e.shiftKey == true) {
        addNewAnnotationWithScreenShot("bug");
      }
    }
  }, false);
}, false);

document.addEventListener('DOMContentLoaded', function () {
  var newIdeaDescription = document.getElementById("newIdeaDescription");
  newIdeaDescription.addEventListener("keypress", function (e) {
    var key = e.which || e.keyCode;
    if ((e.keyCode == 10 || e.keyCode == 13) && e.ctrlKey) {
      addNewIdea("");
    }
    if (key == 13) { // 13 is enter
      if (e.shiftKey == true) {
        addNewAnnotationWithScreenShot("idea");
      }
    }
  }, false);
}, false);

document.addEventListener('DOMContentLoaded', function () {
  var newNoteDescription = document.getElementById("newNoteDescription");
  newNoteDescription.addEventListener("keypress", function (e) {
    var key = e.which || e.keyCode;
    if ((e.keyCode == 10 || e.keyCode == 13) && e.ctrlKey) {
      addNewNote("");
    }
    if (key == 13) { // 13 is enter
      if (e.shiftKey == true) {
        addNewAnnotationWithScreenShot("note");
      }
    }
  }, false);
}, false);

document.addEventListener('DOMContentLoaded', function () {
  var newQuestionDescription = document.getElementById("newQuestionDescription");
  newQuestionDescription.addEventListener("keypress", function (e) {
    var key = e.which || e.keyCode;
    if ((e.keyCode == 10 || e.keyCode == 13) && e.ctrlKey) {
      addNewQuestion("");
    }
    if (key == 13) { // 13 is enter
      if (e.shiftKey == true) {
        addNewAnnotationWithScreenShot("question");
      }
    }
  }, false);
}, false);

document.addEventListener('DOMContentLoaded', function () {
  var resetBtn = document.getElementById('resetBtn');
  resetBtn.addEventListener('click', function () {
    chrome.runtime.sendMessage({ type: "getSessionData" }, function (response) {
      if (response.annotationsCount === 0) return;

      var resetConfirmation = document.getElementById('resetConfirmation');
      $("#resetConfirmation").fadeIn();
    });
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
    chrome.runtime.sendMessage({ type: "clearSession" }, function (response) {
      $("#bugCounter").html("");
      $("#ideaCounter").html("");
      $("#noteCounter").html("");
      $("#questionCounter").html("");
    });
    $("#resetConfirmation").slideUp();
  });
});
