$.get(chrome.extension.getURL('/popup.html'), function(data) {
  if ($("#ExploratoryTestingSession").length != 0) {
    $("#ExploratoryTestingSession").toggle();  
    positionPopup();
    return;
  }
  var popUpWrapper = $('<div id="ExploratoryTestingSession"></div>');
  $($.parseHTML(data)).appendTo(popUpWrapper);

  $('body').prepend(popUpWrapper);
  //$("#ExploratoryTestingSession").css('top', $(window).scrollTop()+'px');

  $(window).scroll(function() {
    clearTimeout($.data(this, 'scrollTimer'));
    $.data(this, 'scrollTimer', setTimeout(function() {
      positionPopup();
    }, 150));
  });

  $(window).resize(function()
  {
    positionPopup();
  });

  $("#minMaxButton").click(function() {
    $(this).toggleClass("resize-min");
    $("#ExploratoryTestingSession").toggleClass("resize-popup");      
    positionPopup();

    var title = 'Minimize' ;
    if( $(this).hasClass('resize-min')){
       title = 'Maximize';
    }
    $(this).attr('title', title);
  });

  $("#BugBtn").click(showBugReport);
  $("#NoteBtn").click(showNoteReport);
  $("#QuestionBtn").click(showQuestionReport);
  $("#IdeaBtn").click(showIdeaReport);

  $("#newBugDescription").keypress(function(e) {
    var key = e.which || e.keyCode;
    if (key == 13) { // 13 is enter
      if (e.shiftKey == true) {
        addNewAnnotationWithScreenShot("bug");
      } else {
        addNewBug(""); // code for enter
      }
    }
  });

  $("#newIdeaDescription").keypress(function(e) {
    var key = e.which || e.keyCode;
    if (key == 13) { // 13 is enter
      if (e.shiftKey == true) {
        addNewAnnotationWithScreenShot("idea");
      } else {
        addNewIdea(""); // code for enter
      }
    }
  });

  $("#newNoteDescription").keypress(function(e) {
    var key = e.which || e.keyCode;
    if (key == 13) { // 13 is enter
      if (e.shiftKey == true) {
        addNewAnnotationWithScreenShot("note");
      } else {
        addNewNote(""); // code for enter
      }
    }
  });

  $("#newQuestionDescription").keypress(function(e) {
    var key = e.which || e.keyCode;
    if (key == 13) { // 13 is enter
      if (e.shiftKey == true) {
        addNewAnnotationWithScreenShot("question");
      } else {
        addNewQuestion(""); // code for enter
      }
    }
  });

  $("#addNewBugBtn").click(function() {
    addNewBug("");
  });

  $("#addNewBugSCBtn").click(function() {
    addNewAnnotationWithScreenShot("bug");
  });

  $("#addNewNoteBtn").click(function() {
    addNewNote("");
  });

  $("#addNewNoteSCBtn").click(function() {
    addNewAnnotationWithScreenShot("note");
  });

  $("#addNewQuestionBtn").click(function() {
    addNewQuestion("");
  });

  $("#addNewQuestionSCBtn").click(function() {
    addNewAnnotationWithScreenShot("question");
  });

  $("#addNewIdeaBtn").click(function() {
    addNewIdea("");
  });

  $("#addNewIdeaSCBtn").click(function() {
    addNewAnnotationWithScreenShot("idea");
  });

  $("#previewBtn").click(createReport);

  $("#exportCSVBtn").click(exportSessionCSV);

  $('[name="Cancel"]').click(cancelAnnotation);

  $("#resetBtn").click(function() {
    chrome.extension.sendMessage({
      type: "getAnnotationsCount"
    }, function(response) {
      if (response.count == 0) return;
      $("#resetConfirmation").fadeIn();
    })
  });

  $("#resetNo").click(function() {
    $("#resetConfirmation").slideUp();
  });

  $("#resetYes").click(function() {
    chrome.extension.sendMessage({
      type: "clearSession"
    }, function(response) {
      $("#bugCounter").html("");
      $("#ideaCounter").html("");
      $("#noteCounter").html("");
      $("#questionCounter").html("");
    });
    $("#resetConfirmation").slideUp();
  });

  updateCounters();
  positionPopup();

});

function positionPopup() {
  if ($("#ExploratoryTestingSession").css("display") != 'none') {    
    //$("#ExploratoryTestingSession").css('top', $(window).scrollTop()+'px');

    var scrollBottom = $(window).scrollTop() + $(window).height();
    var popupHeight = $("#ExploratoryTestingSession").outerHeight();

    $("#ExploratoryTestingSession").css('top', (scrollBottom - popupHeight)+'px');
  }
}

function showBugReport() {
  hideAllReports();
  $("#addNewBug").fadeIn();
  positionPopup();
  $("#newBugDescription").focus();
};

function showIdeaReport() {
  hideAllReports();
  $("#addNewIdea").fadeIn();
  positionPopup();
  $("#newIdeaDescription").focus();
};

function showNoteReport() {
  hideAllReports();
  $("#addNewNote").fadeIn();
  positionPopup();
  $("#newNoteDescription").focus();
};

function showQuestionReport() {
  hideAllReports();
  $("#addNewQuestion").fadeIn();
  positionPopup();
  $("#newQuestionDescription").focus();
};

function addNewBug(imageURL) {
  var bugName = $('#newBugDescription').val().trim();
  if (bugName == "") return;

  chrome.extension.sendMessage({
    type: "addBug",
    name: bugName,
    imageURL: imageURL
  }, function(response) {
    updateCounters();
  });

  clearAllReports();
  hideAllReports();
};

function addNewNote(imageURL) {
  var noteName = $('#newNoteDescription').val().trim();
  if (noteName == "") return;

  chrome.extension.sendMessage({
    type: "addNote",
    name: noteName,
    imageURL: imageURL
  }, function(response) {
    updateCounters();
  });

  clearAllReports();
  hideAllReports();
};

function addNewIdea(imageURL) {
  var ideaName = $('#newIdeaDescription').val().trim();
  if (ideaName == "") return;
  chrome.extension.sendMessage({
    type: "addIdea",
    name: ideaName,
    imageURL: imageURL
  }, function(response) {
    updateCounters();
  });

  clearAllReports();
  hideAllReports();
};

function addNewQuestion(imageURL) {
  var questionName = $('#newQuestionDescription').val().trim();
  if (questionName == "") return;
  chrome.extension.sendMessage({
    type: "addQuestion",
    name: questionName,
    imageURL: imageURL
  }, function(response) {
    updateCounters();
  });

  clearAllReports();
  hideAllReports();
};

function addNewAnnotationWithScreenShot(type) {
  captureVisibleTab(type);
}

function createNewAnnotationWithScreenShot(request) {
  switch (request.name) {
    case "bug":
      addNewBug(request.url);
      break;
    case "idea":
      addNewIdea(request.url);
      break;
    case "question":
      addNewQuestion(request.url);
      break;
    case "note":
      addNewNote(request.url);
      break;
  }
}


function captureVisibleTab(annotationName) {
  // temporarly hide extension to allow screenshot without it
  $("#ExploratoryTestingSession").hide();
  chrome.extension.sendMessage({
    type: "captureVisibleTab",
    name: annotationName
  });
}

function exportSessionCSV() {
  chrome.extension.sendMessage({
    type: "exportSessionCSV"
  });
};

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

  window.setTimeout(function() {
    positionPopup();
  }, 500);
};


function createReport() {
  chrome.extension.sendMessage({
    type: "createReport"
  }, function(response) {
  });
}

function updateCounters() {
  chrome.extension.sendMessage({
    type: "getCounters"
  }, function(response) {
    var bugs = response.bugs;
    var notes = response.notes;
    var ideas = response.ideas;
    var questions = response.questions;

    if (bugs > 0) {
      $("#bugCounter").html("(" + bugs + ")");
    } else {
      $("#bugCounter").html("");
    }

    if (notes > 0) {
      $("#noteCounter").html("(" + notes + ")");
    } else {
      $("#noteCounter").html("");
    }

    if (ideas > 0) {
      $("#ideaCounter").html("(" + ideas + ")");
    } else {
      $("#ideaCounter").html("");
    }

    if (questions > 0) {
      $("#questionCounter").html("(" + questions + ")");
    } else {
      $("#questionCounter").html("");
    }
  });
};

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    switch (request.type) {
      case "updateGui":
        updateCounters();
        break;
      case "screenshot":
        $("#ExploratoryTestingSession").show();
        createNewAnnotationWithScreenShot(request);
    }
    return true;
});
