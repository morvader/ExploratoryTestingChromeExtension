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

        dateFormat = annotation.getTimeStamp().toString('dd-MM-yyyy HH:mm');
        //csvData.push([annotation.getTimeStamp().toLocaleDateString("en-GB",dateFormatOptions), annotation.constructor.name, annotation.getName(),annotation.getURL()])
        dataString = dateFormat + "," + annotation.constructor.name + "," + annotation.getName() + "," + annotation.getURL();

        csvContent += dataString + "\n";
    });

    return csvContent;
};

ExportSessionCSV.prototype.getCSVHeader = function() {
    return "TimeStamp,Type,Name,URL";
};

ExportSessionCSV.prototype.donwloadCSVFile = function() {
    var pom = document.createElement('a');
    var csvContent=actualCSV; //here we load our csv data
    var blob = new Blob([csvContent],{type: 'text/csv;charset=utf-8;'});
    var url = URL.createObjectURL(blob);
    pom.href = url;
    pom.setAttribute('download', 'foo.csv');
    pom.click();
};

