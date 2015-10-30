function ExportSessionHTML(session) {
	this.session = session;
}

ExportSessionHTML.prototype.getHTMLData = function() {
    var htmlData = "";
    //InitHead
    htmlData += this.getHtmlHead() + "\n";
    //EndHead

    //InitBody
    htmlData += "<body>\n"
    htmlData += this.getHtmlH1();


    htmlData+= "</body>"
    //EndBody

    return htmlData;
};

ExportSessionHTML.prototype.getHtmlHead = function() {
    var head =  "<head>\n";
    var title = this.getHtmlTitle();

    head +=title;
    head += "</head>";

    return head;
};

ExportSessionHTML.prototype.getHtmlTitle = function() {
 var tittle = "<title>Chrome Exporatory Session</title>\n";
 return tittle;
};

ExportSessionHTML.prototype.getHtmlH1 = function() {

    var browserInfo = this.session.getBrowserInfo();
    var startDateTime = this.session.getStartDateTime().toString('dd-MM-yyyy HH:mm');

    var h1 = "<h1>";
    h1+= "Exploratory Session Report " + browserInfo + " Date: " + startDateTime;
    h1+= "</h1>\n";

    return h1;
}