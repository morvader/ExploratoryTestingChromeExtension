var session;


document.addEventListener(
  "DOMContentLoaded",
  function() {
    loadData();
  
  },
  false
);

function initData() {
  var BrowserInfo = "TestBrowser 10.0.1.3";
  var currentDateTime = new Date(2015, 10, 30, 6, 51);
  var url = "http://www.google.com/images";
  session = new Session(currentDateTime, BrowserInfo);

  session.addBug(
    new Bug(
      "Sigo viendo fallos en los informes. Adjunto dos pantallazos.",
      "http://www.ministryoftesting.com/resources/exploratory-testing/",
      currentDateTime
    )
  );
  session.addIdea(new Idea("Aded Idea", url, currentDateTime));
  session.addNote(
    new Note(
      "No hemos validado con el cliente porque nos hemos encontrado con el siguiente error (ver email abajo).",
      url,
      currentDateTime
    )
  );
  session.addBug(new Bug("Add Bug2", url, currentDateTime));
  session.addQuestion(new Question("Add Question", url, currentDateTime));
  session.addNote(new Note("Add Note2", url, currentDateTime));
  session.addBug(new Bug("Add Bug3", url, currentDateTime));

  loadData(session);
}

function loadData(data) {
  var background = chrome.extension.getBackgroundPage();
  session = background.session;

  loadSessionInfo();
  loadTable();
  drawPieChart();
  
  addExportBtn();
  imagePreview();
}

function loadSessionInfo() {
  var browserInfo = session.getBrowserInfo();

  $("#sessionDate").html(
    "<span>Date/Time: </span>" +
      session.getStartDateTime().toString("dd-MM-yyyy HH:mm")
  );
  $("#browserInfo").html(
    "<span>Browser: </span>" +
      browserInfo.browser +
      " " +
      browserInfo.browserVersion
  );
  $("#osInfo").html(
    "<span>OS: </span>" + browserInfo.os + " " + browserInfo.osVersion
  );
  $("#miscInfo").html("<span>Cookies Enabled: </span>" + browserInfo.cookies);
}

document.addEventListener(
  "DOMContentLoaded",
  function() {
    var addNewIdeaBtn = document.getElementById("fakeData");
    addNewIdeaBtn.addEventListener("click", initData);
  },
  false
);

function loadTable() {
  var myTableDiv = document.getElementById("sessionResults");

  myTableDiv.innerHTML = "";

  var table = document.createElement("table");
  table.setAttribute("id", "sessionActivityTable");
  table.setAttribute("class", "table");

  var tableHead = document.createElement("thead");

  table.appendChild(tableHead);

  var heading = new Array();
  heading[0] = "";
  heading[1] = "Type";
  heading[2] = "Description";
  heading[3] = "URL";
  heading[4] = "Screenshot";

  var annotaions = session.getAnnotations();

  //TABLE COLUMNS
  var tr = document.createElement("tr");
  tableHead.appendChild(tr);
  for (i = 0; i < heading.length; i++) {
    var th = document.createElement("th");
    th.setAttribute("class", heading[i]);
    th.appendChild(document.createTextNode(heading[i]));
    tr.appendChild(th);
  }

  var tableBody = document.createElement("tbody");
  table.appendChild(tableBody);

  //TABLE ROWS
  for (i = 0; i < annotaions.length; i++) {
    var annotationType = annotaions[i].getType();

    var tr = document.createElement("tr");
    tr.setAttribute("annotationID", i);
    tr.setAttribute("class", annotationType);

    td = document.createElement("td");

    var img = document.createElement("img");
    img.src = img.src = "../images/trashcan.svg";

    img.alt = "Delete " + annotationType;
    img.title = "Delete " + annotationType;

    img.setAttribute("class", "deleteBtn");

    td.appendChild(img);

    tr.appendChild(td);

    td = document.createElement("td");
    var icon = getIconType(annotationType);
    td.appendChild(icon);
    tr.appendChild(td);

    td = document.createElement("td");
    td.setAttribute("class", "annotationDescription");
    td.setAttribute("title", "Double click to edit description");
    td.appendChild(document.createTextNode(annotaions[i].getName()));
    tr.appendChild(td);

    td = document.createElement("td");
    td.setAttribute("class", "annotationUrl");
    var a = document.createElement("a");
    var linkText = document.createTextNode(annotaions[i].getURL());
    a.appendChild(linkText);
    a.title = annotaions[i].getURL();
    a.href = annotaions[i].getURL();
    a.target = "_blank";

    td.appendChild(a);
    tr.appendChild(td);

    td = document.createElement("td");
    var screenshotLink = annotaions[i].getImageURL();

    if (screenshotLink != "") {
      var img = document.createElement("img");
      img.setAttribute("class", "rounded mx-auto d-block");
      var link = document.createElement("a");
      link.setAttribute("class", "preview");
      link.setAttribute("title", "Click to open in a new window");

      img.src = "../images/device-camera.svg";
      link.onclick = function() {
        openNewWindow(annotationType, screenshotLink);
      };

      link.href = screenshotLink;
      link.appendChild(img);

      td.appendChild(link);
    }

    tr.appendChild(td);
    tableBody.appendChild(tr);
  }

  myTableDiv.appendChild(table);

  addTableFilters();
  addTableListeners();
}

function openNewWindow(annotationType, data) {
  var image = new Image();
  image.src = data;

  var w = window.open(data,annotationType);

  w.document.write("<title>" + annotationType + " ScreenShot</title>");
  w.document.write(image.outerHTML);
}

function addTableFilters() {
  var sessionActivityTable_Props = {
    col_0: "none",
    col_1: "select",
    col_2: "none",
    col_3: "none",
    col_4: "none",
    custom_cell_data_cols: [1],
    custom_cell_data: function(o, c, i) {
      if (i == 1) {
        var img = c.getElementsByTagName("img")[0];
        if (!img) return "";
        return img.alt;
      }
    },
    display_all_text: " - All - ",
    sort_select: true
  };

  setFilterGrid("sessionActivityTable", sessionActivityTable_Props);
}

function addExportBtn(){
    $(".fltrow td:nth-child(5)").html(getExportBtnHTML());
    exportBtnAction();
}
function getExportBtnHTML(){
    return '<button id="export" class="actionButton btn btn-primary" title="Get report in a plain HTML file">Export to HTML</button>'
}
function getIconType(type) {
  var DOM_img = document.createElement("img");
  switch (type) {
    case "Bug":
      DOM_img.src = "../images/bug.svg";
      DOM_img.alt = "Bug";
      DOM_img.title = "Bug";
      break;
    case "Note":
      DOM_img.src = "../images/note.svg";
      DOM_img.alt = "Note";
      DOM_img.title = "Note";
      break;
    case "Idea":
      DOM_img.src = "../images/light-bulb.svg";
      DOM_img.alt = "Idea";
      DOM_img.title = "Idea";
      break;
    case "Question":
      DOM_img.src = "../images/question.svg";
      DOM_img.alt = "Question";
      DOM_img.title = "Question";
      break;
  }

  return DOM_img;
}

function drawPieChart() {
  var bugs = {
    y: session.getBugs().length,
    name: "Bugs",
    color: "#dc3545",
    indexLabel: session.getBugs().length == 0 ? "" : "#percent%"
  };
  var notes = {
    y: session.getNotes().length,
    name: "Notes",
    color: "#ffc107",
    indexLabel: session.getNotes().length == 0 ? "" : "#percent%"
  };
  var ideas = {
    y: session.getIdeas().length,
    name: "Ideas",
    color: "#17a2b8",
    indexLabel: session.getIdeas().length == 0 ? "" : "#percent%"
  };
  var questions = {
    y: session.getQuestions().length,
    name: "Questions",
    color: "#28a745",
    indexLabel: session.getQuestions().length == 0 ? "" : "#percent%"
  };

  var data = [bugs, notes, ideas, questions];

  var chart = new CanvasJS.Chart("canvasHolder", {
    animationEnabled: true,
    theme: "theme1",
    data: [
      {
        type: "pie",
        indexLabelFontFamily: "Arial",
        indexLabelFontSize: 10,
        indexLabelFontWeight: "bold",
        startAngle: 0,
        indexLabelFontColor: "White",
        indexLabelLineColor: "darkgrey",
        indexLabelPlacement: "inside",
        toolTipContent: "{name}: {y}",
        showInLegend: false,
        dataPoints: data
      }
    ]
  });
  chart.render();

  resizeSessionDataHeight();
}

function resizeSessionDataHeight() {
  var sessionInfo = document.getElementById("sessionInfo");
  var canvasHolder = document.getElementsByClassName(
    "canvasjs-chart-canvas"
  )[0];

  if (canvasHolder == null) return;
  sessionData.style.height =
    sessionInfo.offsetHeight + canvasHolder.offsetHeight + "px";
}

window.onload = window.onresize = function() {
  resizeSessionDataHeight();
};

function exportBtnAction(){
    var exportbtn = document.getElementById("export");
    exportbtn.addEventListener("click", function() {
      var browserInfo = session.getBrowserInfo();
      var browserInfoString =
        browserInfo.browser + "_" + browserInfo.browserVersion;
      //Take the timestamp of the first Annotation
      var startDateTime = session.getStartDateTime().toString("yyyyMMdd_HHmm");
      var fileName =
        "ExploratorySession_" + browserInfoString + "_" + startDateTime;

      var exportHTMLService = new ExportSessionHTML(session);
      var elHtml = exportHTMLService.getHTML(fileName).documentElement.innerHTML;

      mimeType = "text/html" || "text/plain";

      var a = window.document.createElement("a");
      a.href = window.URL.createObjectURL(
        new Blob([elHtml], {
          type: mimeType
        })
      );
      a.download = fileName + ".html";
      a.click();
    });
}

function addTableListeners() {
  $(".annotationDescription").each(function(index, el) {
    el.addEventListener("dblclick", function(e) {
      e.stopPropagation();
      var currentEle = $(this);
      var value = $(this).html();
      updateVal(currentEle, value);
    });
  });

  deleteAnnotationListener();
}

function updateVal(currentEle, value) {
  var annotationID = currentEle[0].parentNode.getAttribute("annotationID");
  $(document).off("click");
  if (!currentEle.children().is("textarea"))
    $(currentEle).html(
      '<textarea class="updatethVal" >' + value + "</textarea>"
    );
  $(".updatethVal").focus();
  $(".updatethVal").keyup(function(event) {
    if (event.keyCode == 13) {
      var text = $(".updatethVal")
        .val()
        .trim();
      $(currentEle).html(text);

      updateSessionAnnotation(annotationID, text);
    }
  });
}

function updateSessionAnnotation(annotationID, text) {
  chrome.extension.sendMessage({
    type: "updateAnnotationName",
    annotationID: annotationID,
    newName: text
  });
}

function deleteAnnotationListener() {
  $(".deleteBtn").each(function(index, el) {
    el.addEventListener("click", function(e) {
      e.stopPropagation();
      var row = $(this)
        .parent()
        .parent("tr");

      var $divOverlay = $("#divOverlay");
      var bottomWidth = row.css("width");
      var bottomHeight = row.css("height");
      var bottomTop = row.offset().top;
      var bottomLeft = row.offset().left;

      $divOverlay.css({
        position: "absolute",
        top: bottomTop,
        height: bottomHeight,
        left: bottomLeft,
        width: bottomWidth
      });

      var annotationID = row.attr("annotationid");

      $("#divOverlay #deleteYes").attr("idAnnotation", annotationID);

      $divOverlay.slideDown();
    });
  });
}

document.addEventListener("DOMContentLoaded", function() {
  var cancelDeleteBtn = document.getElementById("cancelDelete");
  cancelDeleteBtn.addEventListener("click", function() {
    $("#divOverlay").slideUp();
  });
});

document.addEventListener("DOMContentLoaded", function() {
  var exportbtn = document.getElementById("deleteYes");
  exportbtn.addEventListener("click", function(e) {
    var idAnnotation = $("#divOverlay #deleteYes").attr("idAnnotation");

    deleteAnnotation(idAnnotation);

    $("#divOverlay").slideUp();
  });
});

function deleteAnnotation(annotationID) {
  chrome.extension.sendMessage(
    {
      type: "deleteAnnotation",
      annotationID: annotationID
    },
    function(response) {
      loadData();
    }
  );
}

this.imagePreview = function(){	
	/* CONFIG */
		
		xOffset = -10;
		yOffset = -400;
		
		// these 2 variable determine popup's distance from the cursor
		// you might want to adjust to get the right result
		
	/* END CONFIG */
	$("a.preview").hover(function(e){
		this.t = this.title;
		this.title = "";	
		var c = (this.t != "") ? "<br/>" + this.t : "";
		$("body").append("<p id='preview'><img id='imgPreview' src='"+ this.href +"' alt='Image preview' />"+ c +"</p>");								 
		$("#preview")
			.css("top",(e.pageY - xOffset) + "px")
      .css("left",(e.pageX + yOffset) + "px")
			.fadeIn("fast");						
    },
	function(){
		this.title = this.t;	
		$("#preview").remove();
    });	
	$("a.preview").mousemove(function(e){
		$("#preview")
			.css("top",(e.pageY - xOffset) + "px")
      .css("left",(e.pageX + yOffset) + "px")
	});			
};
