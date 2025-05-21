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
    currentAnnotationTypeForCrop = type; // Store the type for later
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        if (tabs && tabs[0]) {
            chrome.tabs.sendMessage(tabs[0].id, { type: "startSelection" }, function(response) {
                if (chrome.runtime.lastError) {
                    console.error("Error starting selection:", chrome.runtime.lastError.message);
                    alert("Failed to start selection mode. Ensure the page is fully loaded or try refreshing. Cropping is not available on special browser pages (e.g., chrome://).");
                    currentAnnotationTypeForCrop = null; // Reset
                    return;
                }
                if (response && response.status === "selectionStarted") {
                    console.log("Popup: Selection started in content script.");
                    // Waiting for "selectionCoordinates" or "selectionCancelled" message
                } else {
                    // Handle cases where content script doesn't respond as expected
                    console.warn("Popup: Content script did not confirm selection start.");
                    // alert("Could not initiate selection on the page."); // Optional user feedback
                    currentAnnotationTypeForCrop = null; // Reset
                }
            });
        } else {
            console.error("Popup: No active tab found to start selection.");
            alert("No active tab found. Please select a tab to capture from.");
            currentAnnotationTypeForCrop = null; // Reset
        }
    });
}

function processCroppedScreenshot(annotationType, coordinates) {
    chrome.tabs.captureVisibleTab({ format: "png" }, (dataUrl) => {
        if (chrome.runtime.lastError) {
            console.error("Error capturing tab:", chrome.runtime.lastError.message);
            alert("Failed to capture screenshot. " + chrome.runtime.lastError.message);
            return;
        }
        if (!dataUrl) {
            console.error("Error capturing tab: No data URL returned.");
            alert("Failed to capture screenshot. No image data received.");
            return;
        }

        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            const dpr = window.devicePixelRatio || 1;

            canvas.width = coordinates.width * dpr;
            canvas.height = coordinates.height * dpr;

            ctx.drawImage(img,
                coordinates.x * dpr, coordinates.y * dpr,   // source x, y
                coordinates.width * dpr, coordinates.height * dpr, // source width, height
                0, 0,                               // destination x, y
                coordinates.width * dpr, coordinates.height * dpr); // destination width, height

            const croppedDataUrl = canvas.toDataURL('image/png');

            switch (annotationType) {
                case "bug":
                    addNewBug(croppedDataUrl);
                    break;
                case "idea":
                    addNewIdea(croppedDataUrl);
                    break;
                case "question":
                    addNewQuestion(croppedDataUrl);
                    break;
                case "note":
                    addNewNote(croppedDataUrl);
                    break;
            }
        };
        img.onerror = () => {
            console.error("Error loading screenshot image for cropping.");
            alert("Failed to load screenshot for cropping.");
        };
        img.src = dataUrl;
    });
}

// Register the listener for messages from content script
function registerPopupMessageListener() {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.type === "selectionCoordinates") {
            if (currentAnnotationTypeForCrop && request.coordinates) {
                console.log("Popup: Received coordinates", request.coordinates);
                processCroppedScreenshot(currentAnnotationTypeForCrop, request.coordinates);
                currentAnnotationTypeForCrop = null; // Reset after processing
            } else {
                console.warn("Popup: Received coordinates but no annotation type was set or coordinates missing.");
            }
        } else if (request.type === "selectionCancelled") {
            console.log("Popup: Selection cancelled by content script.");
            currentAnnotationTypeForCrop = null; // Reset
        }
        // Important: Return true if you intend to use sendResponse asynchronously in this listener.
        return true;
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
  var bugName = $('#newBugDescription').val().trim();
  if (bugName == "") return;

  chrome.runtime.sendMessage({
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
  var noteName = $('#newNoteDescription').val().trim();
  if (noteName == "") return;
  chrome.runtime.sendMessage({
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

  var ideaName = $('#newIdeaDescription').val().trim();
  if (ideaName == "") return;
  chrome.runtime.sendMessage({
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
  var questionName = $('#newQuestionDescription').val().trim();
  if (questionName == "") return;
  chrome.runtime.sendMessage({
    type: "addQuestion",
    name: questionName,
    imageURL: imageURL
  }, function (response) {
    updateCounters();
  });

  clearAllReports();
  hideAllReports();
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
