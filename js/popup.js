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
  driveListeners();
  updateCounters();
  updateDriveUI();
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

    // Send message to background script (which will forward to content script)
    // This allows the popup to close immediately without breaking the message chain
    chrome.runtime.sendMessage({
        type: "initiateCropSelection",
        annotationType: type,
        description: description
    }, function() {
        // Handle any potential errors silently
        // We're closing the popup anyway, so we don't need to process errors
        if (chrome.runtime.lastError) {
            // Silently consume the error to prevent "Unchecked runtime.lastError" message
            // No logging needed as this is expected behavior when popup closes
        }
    });

    // Close popup immediately (like Edge Snipping Tool)
    console.log("Popup: Sent initiateCropSelection to background and closing popup");
    window.close();
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
  if ($("#addNewBug").is(':visible')) {
    $("#addNewBug").fadeOut();
  } else {
    hideAllReports();
    $("#addNewBug").fadeIn();
    $('#newBugDescription').focus();
  }
};

function showIdeaReport() {
  if ($("#addNewIdea").is(':visible')) {
    $("#addNewIdea").fadeOut();
  } else {
    hideAllReports();
    $("#addNewIdea").fadeIn();
    $('#newIdeaDescription').focus();
  }
};

function showNoteReport() {
  if ($("#addNewNote").is(':visible')) {
    $("#addNewNote").fadeOut();
  } else {
    hideAllReports();
    $("#addNewNote").fadeIn();
    $('#newNoteDescription').focus();
  }
};

function showQuestionReport() {
  if ($("#addNewQuestion").is(':visible')) {
    $("#addNewQuestion").fadeOut();
  } else {
    hideAllReports();
    $("#addNewQuestion").fadeIn();
    $('#newQuestionDescription').focus();
  }
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
        'active': true
      });
    });
  }, false);
}, false);

function updateCounters() {
  // Read directly from storage instead of using message passing
  chrome.storage.local.get('session', function(data) {
    if (chrome.runtime.lastError) {
      console.log("Error reading session from storage:", chrome.runtime.lastError.message);
      return;
    }

    if (!data.session || !data.session.annotations) {
      // No session data yet, leave counters empty
      $("#bugCounter").html("");
      $("#noteCounter").html("");
      $("#ideaCounter").html("");
      $("#questionCounter").html("");
      return;
    }

    // Count annotations by type
    const annotations = data.session.annotations;
    const bugs = annotations.filter(a => a.type === "Bug").length;
    const notes = annotations.filter(a => a.type === "Note").length;
    const ideas = annotations.filter(a => a.type === "Idea").length;
    const questions = annotations.filter(a => a.type === "Question").length;

    // Update counters
    if (bugs > 0) $("#bugCounter").html(" " + bugs + " ");
    else $("#bugCounter").html("");

    if (notes > 0) $("#noteCounter").html(" " + notes + " ");
    else $("#noteCounter").html("");

    if (ideas > 0) $("#ideaCounter").html(" " + ideas + " ");
    else $("#ideaCounter").html("");

    if (questions > 0) $("#questionCounter").html(" " + questions + " ");
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

/* ============================================
   Google Drive Integration
   ============================================ */

function driveListeners() {
  $(document).on('click', '#driveConnectBtn', driveConnect);
  $(document).on('click', '#driveDisconnectBtn', driveDisconnect);
  $(document).on('click', '#driveSaveBtn', driveSaveNow);
  $(document).on('click', '#driveLoadBtn', driveShowLoadPanel);
  $(document).on('click', '#driveLoadClose', driveHideLoadPanel);
  $(document).on('change', '#driveAutoSaveToggle', driveToggleAutoSave);
}

function updateDriveUI() {
  chrome.runtime.sendMessage({ type: "driveGetStatus" }, function (response) {
    if (chrome.runtime.lastError || !response) return;

    if (response.connected) {
      $("#driveDisconnected").hide();
      $("#driveConnected").show();
      $("#driveAutoSaveToggle").prop('checked', response.autoSave);
      updateDriveSyncStatusUI(response.syncStatus);
    } else {
      $("#driveDisconnected").show();
      $("#driveConnected").hide();
      $("#driveSyncStatus").text("").removeClass();
      $("#driveSyncStatus").addClass("drive-status");
    }
  });
}

function updateDriveSyncStatusUI(status) {
  var $el = $("#driveSyncStatus");
  $el.removeClass("drive-status-synced drive-status-syncing drive-status-error");

  switch (status) {
    case "synced":
      $el.text("Synced").addClass("drive-status-synced");
      break;
    case "syncing":
      $el.text("Syncing...").addClass("drive-status-syncing");
      break;
    case "error":
      $el.text("Error").addClass("drive-status-error");
      break;
    default:
      $el.text("");
      break;
  }
}

function driveConnect() {
  $("#driveConnectBtn").prop('disabled', true).text("Connecting...");
  chrome.runtime.sendMessage({ type: "driveConnect" }, function (response) {
    $("#driveConnectBtn").prop('disabled', false).text("Connect");
    if (response && response.status === "ok") {
      updateDriveUI();
    } else {
      var errorMsg = response && response.error ? response.error : "Connection failed";
      console.error("Drive connect failed:", errorMsg);
    }
  });
}

function driveDisconnect() {
  chrome.runtime.sendMessage({ type: "driveDisconnect" }, function (response) {
    updateDriveUI();
    driveHideLoadPanel();
  });
}

function driveToggleAutoSave() {
  var enabled = $("#driveAutoSaveToggle").is(':checked');
  chrome.runtime.sendMessage({ type: "driveSetAutoSave", enabled: enabled }, function (response) {
    if (response && response.status === "ok") {
      // If enabling auto-save, trigger an immediate sync
      if (enabled) {
        driveSaveNow();
      }
    }
  });
}

function driveSaveNow() {
  updateDriveSyncStatusUI("syncing");
  $("#driveSaveBtn").prop('disabled', true);
  chrome.runtime.sendMessage({ type: "driveSaveNow" }, function (response) {
    $("#driveSaveBtn").prop('disabled', false);
    if (response) {
      updateDriveSyncStatusUI(response.syncStatus || "error");
    }
  });
}

function driveShowLoadPanel() {
  $("#driveLoadPanel").slideDown();
  $("#driveFileList").html('<div class="drive-loading">Loading...</div>');

  chrome.runtime.sendMessage({ type: "driveListSessions" }, function (response) {
    if (response && response.status === "ok") {
      renderDriveFileList(response.files);
    } else {
      $("#driveFileList").html('<div class="drive-empty">Could not load sessions</div>');
    }
  });
}

function driveHideLoadPanel() {
  $("#driveLoadPanel").slideUp();
}

function renderDriveFileList(files) {
  var $list = $("#driveFileList");
  $list.empty();

  if (!files || files.length === 0) {
    $list.html('<div class="drive-empty">No sessions saved yet</div>');
    return;
  }

  files.forEach(function (file) {
    var date = new Date(file.modifiedTime);
    var dateStr = date.toLocaleDateString() + " " +
      date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    var displayName = file.name.replace('.json', '').replace('ExploratorySession_', '').replace(/_/g, ' ');

    var $item = $(
      '<div class="drive-file-item">' +
      '  <div class="drive-file-info">' +
      '    <span class="drive-file-name" title="' + file.name + '">' + displayName + '</span>' +
      '    <span class="drive-file-date">' + dateStr + '</span>' +
      '  </div>' +
      '  <div class="drive-file-actions">' +
      '    <button class="drive-file-load" title="Load this session">Load</button>' +
      '    <button class="drive-file-delete" title="Delete from Drive">&times;</button>' +
      '  </div>' +
      '</div>'
    );

    $item.find('.drive-file-load').on('click', function () {
      driveLoadSession(file.id);
    });

    $item.find('.drive-file-delete').on('click', function () {
      driveDeleteSession(file.id, $item);
    });

    $list.append($item);
  });
}

function driveLoadSession(fileId) {
  $("#driveFileList").html('<div class="drive-loading">Loading session...</div>');
  chrome.runtime.sendMessage({ type: "driveLoadSession", fileId: fileId }, function (response) {
    if (response && response.status === "ok") {
      updateCounters();
      driveHideLoadPanel();
      updateDriveUI();
    } else {
      var errorMsg = response && response.error ? response.error : "Load failed";
      $("#driveFileList").html('<div class="drive-empty">' + errorMsg + '</div>');
    }
  });
}

function driveDeleteSession(fileId, $item) {
  $item.css('opacity', '0.5');
  chrome.runtime.sendMessage({ type: "driveDeleteSession", fileId: fileId }, function (response) {
    if (response && response.status === "ok") {
      $item.slideUp(200, function () { $item.remove(); });
    } else {
      $item.css('opacity', '1');
    }
  });
}
