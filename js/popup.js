// At the top of popup.js
let currentAnnotationTypeForCrop = null;

window.onload = function () {
  initElements();
  // Tooltip initialization removed as per jQuery removal task.
  // If Bootstrap tooltips are needed, vanilla JS initialization is required.
  // Example:
  // var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-toggle="tooltip"]'))
  // var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
  //   return new bootstrap.Tooltip(tooltipTriggerEl)
  // })
}

function initElements() {
  annotationListeners();
  exportListeners();
  updateCounters();
  registerPopupMessageListener(); // Added listener registration
  // Tooltip initialization removed
}

function annotationListeners() {
  document.getElementById('BugBtn').addEventListener('click', showBugReport);
  document.getElementById('IdeaBtn').addEventListener('click', showIdeaReport);
  document.getElementById('NoteBtn').addEventListener('click', showNoteReport);
  document.getElementById('QuestionBtn').addEventListener('click', showQuestionReport);

  document.getElementById('addNewBugBtn').addEventListener('click', () => {
    addNewBug("", "") // Assuming description is empty, imageURL is empty
  });
  document.getElementById('addNewIdeaBtn').addEventListener('click', () => {
    addNewIdea("", "") // Assuming description is empty, imageURL is empty
  });
  document.getElementById('addNewNoteBtn').addEventListener('click', () => {
    addNewNote("", "") // Assuming description is empty, imageURL is empty
  });
  document.getElementById('addNewQuestionBtn').addEventListener('click', () => {
    addNewQuestion("", "") // Assuming description is empty, imageURL is empty
  });

  document.getElementById('addNewBugSCBtn').addEventListener('click', () => {
    addNewAnnotationWithScreenShot("bug")
  });
  document.getElementById('addNewIdeaSCBtn').addEventListener('click', () => {
    addNewAnnotationWithScreenShot("idea")
  });
  document.getElementById('addNewNoteSCBtn').addEventListener('click', () => {
    addNewAnnotationWithScreenShot("note")
  });
  document.getElementById('addNewQuestionSCBtn').addEventListener('click', () => {
    addNewAnnotationWithScreenShot("question")
  });

  // New listeners for crop buttons
  document.getElementById('addNewBugCropBtn').addEventListener('click', () => { handleCropScreenshot("bug"); });
  document.getElementById('addNewIdeaCropBtn').addEventListener('click', () => { handleCropScreenshot("idea"); });
  document.getElementById('addNewNoteCropBtn').addEventListener('click', () => { handleCropScreenshot("note"); });
  document.getElementById('addNewQuestionCropBtn').addEventListener('click', () => { handleCropScreenshot("question"); });
}

function handleCropScreenshot(type) {
    // Get description based on type
    let description = "";
    let descriptionFieldId = "";
    switch (type) {
        case "bug": descriptionFieldId = "newBugDescription"; break;
        case "idea": descriptionFieldId = "newIdeaDescription"; break;
        case "note": descriptionFieldId = "newNoteDescription"; break;
        case "question": descriptionFieldId = "newQuestionDescription"; break;
        default:
            console.error("Unknown annotation type for crop:", type);
            return;
    }
    description = document.getElementById(descriptionFieldId).value.trim();

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
  document.getElementById("addNewBug").style.display = 'block'; // Or 'flex' if applicable
  document.getElementById('newBugDescription').focus();
};

function showIdeaReport() {
  hideAllReports();
  document.getElementById("addNewIdea").style.display = 'block'; // Or 'flex' if applicable
  document.getElementById('newIdeaDescription').focus();
};

function showNoteReport() {
  hideAllReports();
  document.getElementById("addNewNote").style.display = 'block'; // Or 'flex' if applicable
  document.getElementById('newNoteDescription').focus();
};

function showQuestionReport() {
  hideAllReports();
  document.getElementById("addNewQuestion").style.display = 'block'; // Or 'flex' if applicable
  document.getElementById('newQuestionDescription').focus();
};

function addNewBug(description, imageURL) {
  console.log("Popup: Inside addNewBug. imageURL (first 100 chars):", imageURL ? imageURL.substring(0, 100) : "null");
  var bugName = description;
  // If description is empty and it's not a screenshot call (imageURL is also empty),
  // then fetch the description from the input field.
  if (bugName === "" && (imageURL === "" || imageURL === undefined || imageURL === null)) {
    bugName = document.getElementById('newBugDescription').value.trim();
  }
  console.log("Popup: Bug name:", bugName);
  if (bugName === "") return; // Check again after potentially fetching from DOM
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

function addNewNote(description, imageURL) {
  console.log("Popup: Inside addNewNote. imageURL (first 100 chars):", imageURL ? imageURL.substring(0, 100) : "null");
  var noteName = description;
  if (noteName === "" && (imageURL === "" || imageURL === undefined || imageURL === null)) {
    noteName = document.getElementById('newNoteDescription').value.trim();
  }
  console.log("Popup: Note name:", noteName);
  if (noteName === "") return;
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

function addNewIdea(description, imageURL) {
  console.log("Popup: Inside addNewIdea. imageURL (first 100 chars):", imageURL ? imageURL.substring(0, 100) : "null");
  var ideaName = description;
  if (ideaName === "" && (imageURL === "" || imageURL === undefined || imageURL === null)) {
    ideaName = document.getElementById('newIdeaDescription').value.trim();
  }
  console.log("Popup: Idea name:", ideaName);
  if (ideaName === "") return;
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

function addNewQuestion(description, imageURL) {
  console.log("Popup: Inside addNewQuestion. imageURL (first 100 chars):", imageURL ? imageURL.substring(0, 100) : "null");
  var questionName = description;
  if (questionName === "" && (imageURL === "" || imageURL === undefined || imageURL === null)) {
    questionName = document.getElementById('newQuestionDescription').value.trim();
  }
  console.log("Popup: Question name:", questionName);
  if (questionName === "") return;
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
  let description = "";
  let descriptionFieldId = "";
  switch (type) {
    case "bug": descriptionFieldId = "newBugDescription"; break;
    case "idea": descriptionFieldId = "newIdeaDescription"; break;
    case "note": descriptionFieldId = "newNoteDescription"; break;
    case "question": descriptionFieldId = "newQuestionDescription"; break;
    default:
      console.error("Unknown annotation type for screenshot:", type);
      return;
  }
  description = document.getElementById(descriptionFieldId).value.trim();

  if (description === "") {
    alert("Please enter a description before taking a screenshot.");
    return; 
  }

  chrome.tabs.captureVisibleTab((screenshotUrl) => {
    if (screenshotUrl === 'undefined') screenshotUrl = "";
    switch (type) {
      case "bug":
        addNewBug(description, screenshotUrl);
        break;
      case "idea":
        addNewIdea(description, screenshotUrl);
        break;
      case "question":
        addNewQuestion(description, screenshotUrl);
        break;
      case "note":
        addNewNote(description, screenshotUrl);
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
  document.getElementById('exportCSVBtn').addEventListener('click', exportSessionCSV);
  document.getElementById('exportJsonBtn').addEventListener('click', exportSessionJSon);
  document.getElementById('importJsonBtn').addEventListener('click', () => {
    document.getElementById('importJsonInput').click();
  });
  document.getElementById('importJsonInput').addEventListener('change', importSessionJSon);
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
    document.getElementById('importJsonInput').value = "";
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
  document.getElementById("newBugDescription").value = '';
  document.getElementById("newIdeaDescription").value = '';
  document.getElementById("newNoteDescription").value = '';
  document.getElementById("newQuestionDescription").value = '';

  document.getElementById("addNewBug").style.display = 'none';
  document.getElementById("addNewIdea").style.display = 'none';
  document.getElementById("addNewNote").style.display = 'none';
  document.getElementById("addNewQuestion").style.display = 'none';
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
    const bugCounter = document.getElementById("bugCounter");
    const noteCounter = document.getElementById("noteCounter");
    const ideaCounter = document.getElementById("ideaCounter");
    const questionCounter = document.getElementById("questionCounter");

    if (response.bugs > 0) bugCounter.innerHTML = " " + response.bugs + " ";
    else bugCounter.innerHTML = "";

    if (response.notes > 0) noteCounter.innerHTML = " " + response.notes + " ";
    else noteCounter.innerHTML = "";

    if (response.ideas > 0) ideaCounter.innerHTML = " " + response.ideas + " ";
    else ideaCounter.innerHTML = "";

    if (response.questions > 0) questionCounter.innerHTML = " " + response.questions + " ";
    else questionCounter.innerHTML = "";
  });
}

document.addEventListener('DOMContentLoaded', function () {
  var newBugDescription = document.getElementById("newBugDescription");
  newBugDescription.addEventListener("keypress", function (e) {
    var key = e.which || e.keyCode;
    // if ((e.keyCode == 10 || e.keyCode == 13) && e.ctrlKey) {
    //   newBugDescription.value = newBugDescription.value + '\n';
    // }
    if ((e.keyCode == 10 || e.keyCode == 13) && e.ctrlKey) {
      addNewBug(newBugDescription.value.trim(), "");
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
      addNewIdea(newIdeaDescription.value.trim(), "");
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
      addNewNote(newNoteDescription.value.trim(), "");
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
      addNewQuestion(newQuestionDescription.value.trim(), "");
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
      resetConfirmation.style.display = 'block'; // Or 'flex'
    });
  }, false);
}, false);

document.addEventListener('DOMContentLoaded', function () {
  var resetBtnNo = document.getElementById('resetNo');
  resetBtnNo.addEventListener('click', function () {
    document.getElementById('resetConfirmation').style.display = 'none';
  });
});

document.addEventListener('DOMContentLoaded', function () {
  var resetBtnYes = document.getElementById('resetYes'); // Corrected variable name from resetBtnNo to resetBtnYes
  resetBtnYes.addEventListener('click', function () { // Corrected variable name
    chrome.runtime.sendMessage({ type: "clearSession" }, function (response) {
      document.getElementById("bugCounter").innerHTML = "";
      document.getElementById("ideaCounter").innerHTML = "";
      document.getElementById("noteCounter").innerHTML = "";
      document.getElementById("questionCounter").innerHTML = "";
    });
    document.getElementById('resetConfirmation').style.display = 'none';
  });
});
