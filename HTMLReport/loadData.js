var session;

document.addEventListener('DOMContentLoaded', function() {
    loadData();
}, false);

function initData() {
    var BrowserInfo = "TestBrowser 10.0.1.3";
    var currentDateTime = new Date(2015, 10, 30, 6, 51);
    var url = "http://www.google.com/images"
    session = new Session(currentDateTime, BrowserInfo);

    session.addBug(new Bug("Sigo viendo fallos en los informes. Adjunto dos pantallazos.", "http://www.ministryoftesting.com/resources/exploratory-testing/", currentDateTime));
    session.addIdea(new Idea("Aded Idea", url, currentDateTime));
    session.addNote(new Note("No hemos validado con el cliente porque nos hemos encontrado con el siguiente error (ver email abajo).", url, currentDateTime));
    session.addBug(new Bug("Add Bug2", url, currentDateTime));
    session.addQuestion(new Question("Add Question", url, currentDateTime));
    session.addNote(new Note("Add Note2", url, currentDateTime));
    session.addBug(new Bug("Add Bug3", url, currentDateTime));


    loadData(session);
}

function loadData(data) {
    //session = data;

    var background = chrome.extension.getBackgroundPage();
    session = background.session;

    loadSessionInfo();
    loadTable();
    drawPieChart();
}

function loadSessionInfo() {
    document.getElementById("sessionDate").innerHTML = "Exploratory Session " + session.getStartDateTime().toString('dd-MM-yyyy HH:mm');
    document.getElementById("browserInfo").innerHTML = "Browser Version: " + session.getBrowserInfo();
}

document.addEventListener('DOMContentLoaded', function() {
    var addNewIdeaBtn = document.getElementById("fakeData");
    addNewIdeaBtn.addEventListener('click', initData)
}, false);

function loadTable() {

    var myTableDiv = document.getElementById("sessionResults");

    myTableDiv.innerHTML = "";

    var table = document.createElement('TABLE');
    table.setAttribute('id', 'sessionActivityTable');


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
        tr.setAttribute('annotationID', i);

        td = document.createElement('TD');
        td.setAttribute('class', 'centered');
        var icon = getIconType(annotaions[i].getType());
        td.appendChild(icon);
        tr.appendChild(td);

        td = document.createElement('TD');
        td.setAttribute('class', 'annotationDescription');
        td.setAttribute('title', 'Double click to edit description');
        td.appendChild(document.createTextNode(annotaions[i].getName()));
        tr.appendChild(td);

        td = document.createElement('TD');

        var a = document.createElement('a');
        var linkText = document.createTextNode(annotaions[i].getURL());
        a.appendChild(linkText);
        a.title = annotaions[i].getURL();
        a.href = annotaions[i].getURL();
        a.target = "_blank";

        td.appendChild(a);
        tr.appendChild(td);

        td = document.createElement('TD');
        td.setAttribute('class', 'centered');

        var screenshotLink = annotaions[i].getImageURL();

        if (screenshotLink != "") {
            var img = document.createElement('img'),
                link = document.createElement('a');

            img.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAMAAABEpIrGAAAAA3NCSVQICAjb4U/gAAAACXBIWXMAAAETAAABEwGpfUaAAAAAGXRFWHRTb2Z0d2FyZQB3d3cuaW5rc2NhcGUub3Jnm+48GgAAAIRQTFRF////AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAvSgy4QAAACt0Uk5TAAEFBgsOEBcYHSwuMDU4REZOUFhebnB/gISIj5CYqK2wu77Fyc7Q0uHo7zP+WRIAAADASURBVDhPvdPZEoIgFIDhk+GSWpq5tkiamMn7v18qDYqBXdT03+DANx7GGQG+zivrhUoPGrpYA5TiozJMaQcC9fzgBfyrNJ+DVD4//SFI5CDhwDpIszhArtAGVk6/Ig6i+3lSTsAZRkQcxJfp19nV4A4g/iu4xZNO78AMhLaw3veryYEyBtqHsrYDBV2sABSO1yNsk4w7IRJG5gzkiht9ALphGJgB3D3qs2Otmt+u0gRgz88ptcVXZET850gGv+oJeV5V7sRlQoMAAAAASUVORK5CYII=";
            img.style.width = "28px";

            link.href = screenshotLink;
            link.appendChild(img);
            link.target = "_blank";

            td.appendChild(link);

        }

        tr.appendChild(td);
        tableBody.appendChild(tr);
    }

    myTableDiv.appendChild(table);

    addTableFilters();
    addTableListeners();
}

function addTableFilters() {
    var sessionActivityTable_Props = {
        col_0: "select",
        col_1: "none",
        col_2: "none",
        col_3: "none",
        custom_cell_data_cols: [0],
        custom_cell_data: function(o, c, i) {
            if (i == 0) {
                var img = c.getElementsByTagName('img')[0];
                if (!img) return '';
                return img.alt;
            }
        },
        display_all_text: " [ Show all ] ",
        sort_select: true
    };

    var tf2 = setFilterGrid("sessionActivityTable", sessionActivityTable_Props);
}

function getIconType(type) {
    var DOM_img = document.createElement("img");
    switch (type) {
        case "Bug":
            //DOM_img.src = "../images/bug.png";
            DOM_img.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAAugAAALoBTx5ghQAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAGZSURBVEiJtZY9SwNBEIafCUG0k0BixMrKykbEL47EKtrbpNPKRgVrq6uDWKs/RVIE7URs7IVANFgIaoQUEtYic7C53N2eng683O18vDOzs+ydGGNwiYhMA/vAkqrugUtjzJsz2BiTCMADOoAJoQN4zngHeQHoRpAH6AKFJI6co8FDoJxgL6tPrOQARKQmInci4oXsK44CxnxExFOuGkCwFXWGLfew9hWYACYdmAjNq6dc9ZEZAL6VpJqCOIyqRe5HDtlKkgV+4ikCmgnBbUWcvRnmy0cM7TNqkioL+uzH2MdiXcc0s/x7gryIzAGLlq6Uga8kItvW+gGShxZGcCTT+rcF2AM2rawVYD6mwil9xg25DbSsdSvqmPoZOjhPc9ndxlSXRp7Cir9OcDOmifkOPPPzLXoExLlFInICzP6i+iKwkdgBsKvV9IELYJCigwFwre8fwHrkZQdsAV8asKO6ZeDKSmQnGKhtTX1PVf8OrI4kYDjsV3U4ipjJDMP7PqeoAMUIv4ZyvAD5cAdnwIHrLyHFX8gx0AjW334V9JGY6/lGAAAAAElFTkSuQmCC";
            DOM_img.alt = "Bug";
            DOM_img.title = "Bug";
            break;
        case "Note":
            //DOM_img.src = "../images/note.png";
            DOM_img.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAApgAAAKYB3X3/OAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAEBSURBVEiJvZW7DcIwEECfUSIKGAGJliEyAANkASaBKWAAihQZI2UGYYA0SBSmuYBlbPzB4qRrfOf3zo4io7WmVAIV0AHtvLagbCyBDdAppVqAkpNfgB2wBgbgAbQANXAARkAn5AQ0ItgCN0lT0iHwFPALLpMfBbizJCup500um3tZGyzJxbi+9+bEO+8t8SzZAlW2wAOf8+jojxcE4L3UmyxBLByYkgUpcJsTFMTApW9ycb4KYuHS6+SEBNcY+C+CPXAPwbMEwMkhccJzBdqSXH3wXwQvScRP6ORUeEJrrXy1lCj9ov1fAOnvQShH8xssgHPhgT94uW/yx+TCqc0TPAFFMPiqY8cw3gAAAABJRU5ErkJggg==";
            DOM_img.alt = "Note";
            DOM_img.title = "Note";
            break;
        case "Idea":
            //DOM_img.src = "../images/idea.png";
            DOM_img.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAKcQAACnEBtdha7wAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAH4SURBVEiJpdXBi81RFAfwzx0vnmaEjUkzpCkmK4kUZUeNjY2/wJ4iC4UVZaFsxhpTsxDKkp3NlEbsSBM1ZjPKEEImjZlr8c6bfp73e+/3mlO39zvnfM/3vHPvOffKOau68BJXe4np05tsxtZeAmo9JritUUVlSVF6Q0mplnP+UwpOaRBLOecvHfwrOedPq8aWPX6DB6gXbPtxB++RY73GOIYLuH34iEf/cLYkOItFnAn9HH4XiFvXZ5wM7DheYE9pggBuQx0XC0TvItlRHMclLBT8Y6WdV9KOu6OSjHvob4MZxFRg5jDQS4KJCHyLjR3mYghfA3u+lzk4GL83cs6LJRg553ncDfVQO8x/CVJKGzAa6nQZeUGac3GgUgIs4Vd8L1dI0MR8L02QUhpJKZ1OKZ3IOa/gWfjblt0izX8+FVwXUko3U0pj0Dys5xoHNRn65dAfd7n86pgJ7KmwXdFo4aerXYQR7CoEjuJbBF5HXxvyfjwMzCy2FHx9WFfapgE6gp9B8KTFV9No4Yx5jPQ0aAWiY0Ey12Zrchzs3o4c3R6MIPqBHQXb4bDPdIuv8h4sYwCzKaUPsb9D4Su92ptS5UVrTmoNOzGM1OJbU4J6B9/6rtEVzqDZru3WdLf4KhVMaLRrqyzg/poriCq245bGvf8K17CpSuxfOACsF3meNvIAAAAASUVORK5CYII=";
            DOM_img.alt = "Idea";
            DOM_img.title = "Idea";
            break;
        case "Question":
            //DOM_img.src = "../images/question.png";
            DOM_img.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAAXQAAAF0BVWAulAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAHqSURBVEiJxdRPiE5RGAbw35mZxohk8pVJmZSdIjuzQzRRxoaVlWSnLCxslK2NnZItNrMhDaWUWFL+JpkVGmmYyEwaNVO8Fvdebsf9vvlDeer0nfO89zzPOe/7nVdEQB/O4Dlm8RpXMBgR/mZAN+4jGsY0Ni9RcBBncRBdcKIm+B4X8bLGjS1BfCU+1/aehNs1Yrj8sB/fSu7TEgwOZxl41IPLmMOLiLijwBqkcj5l8Vidr3siYhSjFZNSWo+7isLDWC02jJ3YgCe4ERHvOlo25PBh7Yr30IsWbvrzT/AVx2v7j2bx8dzgVC34FGtLfqxBvBo/sKudQVd2oa21+f6ImE4p7cFIhyQknG8XzA0Gyt83EfGhnA91EK+wPaW0qinQk62PYYeigBVaizDoxrqmQH6D3Yo87q1xzxZhMBURE9iS8XN5kccVxXlb41r4qH2RA+cU2ZjM+Eu5wdUycD3jRxSPsUn8seLNHGiIDeUGqfw4NbSBbYoHOFtunihPvqKMX8vEX0WEBftLg1E3+jOuhfnM4HREFCdtQkqpS9Fpj2CT372pCb2KBlnhOzZGxGSnk15YoLCdxq1fOm3EBxQtYLkGhxYy2PcX4l/QW2nlD61CXxt+MZiJiPlq0c7gn+G/GYxjZpmaD+qLn3+uLAoP3yWBAAAAAElFTkSuQmCC";
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
        color: "#f5978e",
        indexLabel: session.getBugs().length == 0 ? "" : "#percent%"
    };
    var notes = {
        y: session.getNotes().length,
        name: "Notes",
        color: "#FFEC56",
        indexLabel: session.getNotes().length == 0 ? "" : "#percent%"
    };
    var ideas = {
        y: session.getIdeas().length,
        name: "Ideas",
        color: "#97c4fe",
        indexLabel: session.getIdeas().length == 0 ? "" : "#percent%"
    };
    var questions = {
        y: session.getQuestions().length,
        name: "Questions",
        color: "#e184f3",
        indexLabel: session.getQuestions().length == 0 ? "" : "#percent%"
    };

    var data = [bugs, notes, ideas, questions];

    var chart = new CanvasJS.Chart("canvasHolder", {
        title: {
            text: "Session Activity",
            fontFamily: "arial black"
        },
        animationEnabled: true,
        legend: {
            verticalAlign: "bottom",
            horizontalAlign: "center"
        },
        theme: "theme1",
        data: [{
            type: "pie",
            indexLabelFontFamily: "Garamond",
            indexLabelFontSize: 14,
            indexLabelFontWeight: "bold",
            startAngle: 0,
            indexLabelFontColor: "White",
            indexLabelLineColor: "darkgrey",
            indexLabelPlacement: "inside",
            toolTipContent: "{name}: {y}",
            showInLegend: true,
            dataPoints: data
        }]
    });
    chart.render();

    resizeSessionDataHeight();

}

function resizeSessionDataHeight() {
    var sessionInfo = document.getElementById("sessionInfo");
    var canvasHolder = document.getElementsByClassName("canvasjs-chart-canvas")[0];

    if (canvasHolder == null) return;
    sessionData.style.height = sessionInfo.offsetHeight + canvasHolder.offsetHeight + "px";
}

window.onload = window.onresize = function() {
    resizeSessionDataHeight();
}

document.addEventListener('DOMContentLoaded', function() {
    var exportbtn = document.getElementById("export");
    exportbtn.addEventListener('click', function() {

        var browserInfo = session.getBrowserInfo();
        //Take the timestamp of the first Annotation
        var startDateTime = session.getStartDateTime().toString('yyyyMMdd_HHmm');
        var fileName = "ExploratorySession_" + browserInfo + "_" + startDateTime;

        var exportHTMLService = new ExportSessionHTML(session);
        var elHtml = exportHTMLService.getHTML(fileName).documentElement.innerHTML;

        var link = document.createElement('a');
        mimeType = 'text/html' || 'text/plain';

        link.setAttribute('download', fileName + ".html");
        link.setAttribute('href', 'data:' + mimeType + ';charset=utf-8,' + encodeURIComponent(elHtml));
        link.click();

    })
}, false);


function addTableListeners() {
    //var descriptionElements = document.getElementsByClassName('annotationDescription');
    $('.annotationDescription').each(function(index, el) {
        el.addEventListener('dblclick', function(e) {
            e.stopPropagation();
            var currentEle = $(this);
            var value = $(this).html();
            updateVal(currentEle, value);

        });
    });

};


function updateVal(currentEle, value) {
    var annotationID = currentEle[0].parentNode.getAttribute('annotationID');
    $(document).off('click');
    if (!currentEle.children().is('textarea'))
        $(currentEle).html('<textarea class="updatethVal" >' + value + '</textarea>');
    $(".updatethVal").focus();
    $(".updatethVal").keyup(function(event) {
        if (event.keyCode == 13) {
            var text = $(".updatethVal").val().trim();
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