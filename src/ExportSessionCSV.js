function ExportSessionCSV(session) {
	this.session = session;
}

ExportSessionCSV.prototype.getCSVData = function() {
    var dateFormatOptions = { year: 'numeric', month: '2-digit', day: '2-digit', hour:'numeric', minute:'numeric' };

    //var csvData = [];
    //csvData.push(this.getCSVHeader());

    var annotations = this.session.getAnnotations();

    var csvContent = "";
    csvContent+=this.getCSVHeader() + "\n";

    annotations.forEach(function(annotation) {

        dateFormat = getDateFormat(annotation.getTimeStamp());
        //csvData.push([annotation.getTimeStamp().toLocaleDateString("en-GB",dateFormatOptions), annotation.constructor.name, annotation.getName(),annotation.getURL()])
        dataString = dateFormat + "," + annotation.constructor.name + "," + annotation.getName() + "," + annotation.getURL();

        csvContent += dataString + "\n";
    });

    return csvContent;
};

ExportSessionCSV.prototype.getCSVHeader = function() {
    return "TimeStamp,Type,Name,URL";
};

function getDateFormat(date) {
//    var dateFormat = date.getDate() + "/" + date.getMonth() + 1 + "/" + date.getFullYear() + " " + date.getHours() + ":" + date.getMinutes();

    var dateString= date.toString('dd-MM-yyyy HH:mm');
    return dateString;
};