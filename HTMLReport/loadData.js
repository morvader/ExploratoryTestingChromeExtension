var session;

function initData(){
    var BrowserInfo = "TestBrowser 10.0.1.3";
    var currentDateTime = new Date(2015, 10, 30, 6, 51);
    var url = "http://www.google.com/images"
    session = new Session(currentDateTime, BrowserInfo);

    session.addBug(new Bug("Sigo viendo fallos en los informes. Adjunto dos pantallazos.","http://www.ministryoftesting.com/resources/exploratory-testing/",currentDateTime));
    session.addIdea(new Idea("Aded Idea",url,currentDateTime));
    session.addNote(new Note("No hemos validado con el cliente porque nos hemos encontrado con el siguiente error (ver email abajo).",url,currentDateTime));
    session.addBug(new Bug("Add Bug2",url,currentDateTime));
    session.addQuestion(new Question("Add Question",url,currentDateTime));
    session.addNote(new Note("Add Note2",url,currentDateTime));
    session.addBug(new Bug("Add Bug3",url,currentDateTime));


    loadData(session);
}

function loadData(data){
        session = data;

        loadSessionInfo();
        loadTable();
        drawPieChart();
}

function loadSessionInfo(){
    document.getElementById("sessionDate").innerHTML = "Exploratory Session " + session.getStartDateTime().toString('dd-MM-yyyy HH:mm');
    document.getElementById("browserInfo").innerHTML = "Browser Version: " + session.getBrowserInfo();
}

document.addEventListener('DOMContentLoaded', function() {
  var addNewIdeaBtn = document.getElementById("fakeData");
  addNewIdeaBtn.addEventListener('click',initData)
}, false);

function loadTable() {

    var myTableDiv = document.getElementById("sessionResults");

    myTableDiv.innerHTML = "";

    var table = document.createElement('TABLE');
    table.setAttribute('id', 'sessionActivityTable');

//    var caption = document.createElement("caption");
//    caption.innerHTML ="Session Activity";
//    table.appendChild(caption);

    var tableHead = document.createElement('THEAD');

    //table.border = '1'
    table.appendChild(tableHead);



    var heading = new Array();
    heading[0] = "Type"
    heading[1] = "Description"
    heading[2] = "URL"
    heading[3] = "Screenshot"

    var annotaions = session.getAnnotations();

    //TABLE COLUMNS
    var tr = document.createElement('TR');
    tableHead.appendChild(tr);
    for (i = 0; i < heading.length; i++) {
        var th = document.createElement('TH')
        //th.width = '75';
        th.appendChild(document.createTextNode(heading[i]));
        tr.appendChild(th);
    }

    var tableBody = document.createElement('TBODY');
    table.appendChild(tableBody);


    //TABLE ROWS
    for (i = 0; i < annotaions.length; i++) {
        var tr = document.createElement('TR');

        td = document.createElement('TD');
        td.setAttribute('class', 'centered');
        //td.appendChild(document.createTextNode(annotaions[i].getType()));
        var icon = getIconType(annotaions[i].getType());
        td.appendChild(icon);
        tr.appendChild(td);

        td = document.createElement('TD');
        td.appendChild(document.createTextNode(annotaions[i].getName()));
        tr.appendChild(td);

        td = document.createElement('TD');

        var a = document.createElement('a');
        var linkText = document.createTextNode(annotaions[i].getURL());
        a.appendChild(linkText);
        a.title = annotaions[i].getURL();
        a.href = annotaions[i].getURL();
        a.target ="_blank";

        td.appendChild(a);
        tr.appendChild(td);

        td = document.createElement('TD');
        td.setAttribute('class', 'centered');

        var screenshotLink = annotaions[i].getImageURL();

        if(screenshotLink != ""){
            var img = document.createElement('img'), link = document.createElement('a');

            img.src = "../images/screenshot.png";
            img.style.width = "28px";

            link.href = screenshotLink;
            link.appendChild(img);
            link.target ="_blank";

            td.appendChild(link);

        }

        tr.appendChild(td);
        tableBody.appendChild(tr);
    }

    myTableDiv.appendChild(table);

    addTableFilters();
}

function addTableFilters(){
    var sessionActivityTable_Props = {
        col_0: "select",
        col_1: "none",
        col_2: "none",
        col_3: "none",
        custom_cell_data_cols: [0],
        custom_cell_data: function(o, c, i){
            if(i==0){
               var img = c.getElementsByTagName('img')[0];
                 if(!img) return '';
                  return img.alt;
            }
        },
        display_all_text: " [ Show all ] ",
        sort_select: true
    };

    var tf2 = setFilterGrid("sessionActivityTable", sessionActivityTable_Props);
}

function getIconType(type){
    var DOM_img = document.createElement("img");
    switch(type){
        case "Bug":
            DOM_img.src = "../images/bug.png";
            DOM_img.alt = "Bug";
            DOM_img.title = "Bug";
            break;
        case "Note":
            DOM_img.src = "../images/note.png";
            DOM_img.alt = "Note";
            DOM_img.title = "Note";
            break;
        case "Idea":
            DOM_img.src = "../images/idea.png";
            DOM_img.alt = "Idea";
            DOM_img.title = "Idea";
            break;
        case "Question":
            DOM_img.src = "../images/question.png";
            DOM_img.alt = "Question";
            DOM_img.title = "Question";
            break;
    }

    return DOM_img;
}

function drawPieChart(){

    var bugs = {y: session.getBugs().length, name: "Bugs",color:"#f5978e",indexLabel: session.getBugs().length == 0 ? "" :"#percent%"};
    var notes = {y: session.getNotes().length, name: "Notes",color: "#FFEC56",indexLabel: session.getNotes().length == 0 ? "" :"#percent%"};
    var ideas = {y: session.getIdeas().length, name: "Ideas",color: "#97c4fe",indexLabel: session.getIdeas().length == 0 ? "" :"#percent%"};
    var questions = {y: session.getQuestions().length, name: "Questions",color: "#e184f3",indexLabel: session.getQuestions().length == 0 ? "" :"#percent%"};

    var data = [bugs, notes,ideas,questions];

    var chart = new CanvasJS.Chart("canvasHolder",
	{
		title:{
			text: "Session Activity",
			fontFamily: "arial black"
		},
            animationEnabled: true,
		legend: {
			verticalAlign: "bottom",
			horizontalAlign: "center"
		},
		theme: "theme1",
		data: [
		{
			type: "pie",
			indexLabelFontFamily: "Garamond",
			indexLabelFontSize: 14,
			indexLabelFontWeight: "bold",
			startAngle:0,
			indexLabelFontColor: "White",
			indexLabelLineColor: "darkgrey",
			indexLabelPlacement: "inside",
			toolTipContent: "{name}: {y}",
			showInLegend: true,
			dataPoints: data
		}
		]
	});
	chart.render();

	resizeSessionDataHeight();

}

function resizeSessionDataHeight(){
    var sessionInfo = document.getElementById("sessionInfo");
	var canvasHolder = document.getElementsByClassName("canvasjs-chart-canvas")[0];

    if(canvasHolder == null) return;
	sessionData.style.height = sessionInfo.offsetHeight + canvasHolder.offsetHeight + "px";
}

window.onload = window.onresize = function () {
    resizeSessionDataHeight();
}