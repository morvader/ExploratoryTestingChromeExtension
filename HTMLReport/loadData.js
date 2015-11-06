var session;

function initData(){
    var BrowserInfo = "TestBrowser 10.0.1.3";
    var currentDateTime = new Date(2015, 10, 30, 6, 51);
    var url = "http://www.google.com/images"
    session = new Session(currentDateTime, BrowserInfo);

    session.addBug(new Bug("Add Bug",url,currentDateTime));
    session.addIdea(new Idea("Aded Idea",url,currentDateTime));
    session.addNote(new Note("Add Note",url,currentDateTime));
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
    document.getElementById("sessionDate").innerHTML = session.getStartDateTime().toString('dd-MM-yyyy HH:mm');
    document.getElementById("browserInfo").innerHTML = session.getBrowserInfo();
}

document.addEventListener('DOMContentLoaded', function() {
  var addNewIdeaBtn = document.getElementById("fakeData");
  addNewIdeaBtn.addEventListener('click',initData)
}, false);

function loadTable() {

    var myTableDiv = document.getElementById("sessionResults");

    myTableDiv.innerHTML = "";

    var table = document.createElement('TABLE')
    var tableBody = document.createElement('TBODY')

    table.border = '1'
    table.appendChild(tableBody);

    var heading = new Array();
    heading[0] = "Date Time"
    heading[1] = "Type"
    heading[2] = "Description"
    heading[3] = "URL"

    var annotaions = session.getAnnotations();

    //TABLE COLUMNS
    var tr = document.createElement('TR');
    tableBody.appendChild(tr);
    for (i = 0; i < heading.length; i++) {
        var th = document.createElement('TH')
        //th.width = '75';
        th.appendChild(document.createTextNode(heading[i]));
        tr.appendChild(th);
    }

    //TABLE ROWS
    for (i = 0; i < annotaions.length; i++) {
        var tr = document.createElement('TR');

        td = document.createElement('TD');
        td.appendChild(document.createTextNode(annotaions[i].getTimeStamp().toString('dd-MM-yyyy HH:mm')));
        tr.appendChild(td);

        td = document.createElement('TD');
        td.appendChild(document.createTextNode(annotaions[i].getType()));
        tr.appendChild(td);

        td = document.createElement('TD');
        td.appendChild(document.createTextNode(annotaions[i].getName()));
        tr.appendChild(td);

        td = document.createElement('TD');
        td.appendChild(document.createTextNode(annotaions[i].getURL()));
        tr.appendChild(td);

        tableBody.appendChild(tr);
    }
    myTableDiv.appendChild(table);
}

function drawPieChart(){

    var bugs = {y: session.getBugs().length, name: "Bugs",color:"#f5978e",indexLabel: session.getBugs().length == 0 ? "" :"#percent%"};
    var notes = {y: session.getNotes().length, name: "Notes",color: "#FFEC56",indexLabel: session.getNotes().length == 0 ? "" :"#percent%"};
    var ideas = {y: session.getIdeas().length, name: "Ideas",color: "#97c4fe",indexLabel: session.getIdeas().length == 0 ? "" :"#percent%"};
    var questions = {y: session.getQuestions().length, name: "Questions",color: "#e184f3",indexLabel: session.getQuestions().length == 0 ? "" :"#percent%"};

    var datos = [bugs, notes,ideas,questions];

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
			indexLabelFontSize: 20,
			indexLabelFontWeight: "bold",
			startAngle:0,
			indexLabelFontColor: "White",
			indexLabelLineColor: "darkgrey",
			indexLabelPlacement: "inside",
			toolTipContent: "{name}: {y}",
			showInLegend: true,
			dataPoints: datos
		}
		]
	});
	chart.render();

}