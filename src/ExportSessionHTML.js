function ExportSessionHTML(session) {
    this.session = session;
}

ExportSessionHTML.prototype.getHTML = function(fileName) {

    var doc = document.implementation.createHTMLDocument(fileName);

    var meta = document.createElement('meta');
    meta.httpEquiv = "Content-Type";
    meta.content = 'text/html; charset=utf-8';
    doc.head.appendChild(meta);

    this.addStyleCSS(doc);

    this.addJavaScriptFiles(doc);


    var h1 = doc.createElement("h1");
    h1.innerHTML = fileName;

    doc.body.appendChild(h1);

    this.createExportableTable(doc);

    this.addTableFilters(doc);

    doc.body.setAttribute('onload', "loadFilter()");

    return doc;
}

ExportSessionHTML.prototype.addJavaScriptFiles = function(doc) {
    //For table Filter
    var tableFilterScript = document.createElement('script');
    tableFilterScript.type = 'text/javascript';
    tableFilterScript.src = 'http://tablefilter.free.fr/TableFilter/tablefilter_all_min.js';

    doc.getElementsByTagName('head')[0].appendChild(tableFilterScript);
}

ExportSessionHTML.prototype.createExportableTable = function(doc) {

    var tableDiv = doc.createElement("div");
    doc.body.appendChild(tableDiv);

    tableDiv.innerHTML = "";

    var table = document.createElement('TABLE');

    table.setAttribute('id', "exportActivityTable");
    table.style.width = "100%";

    var caption = document.createElement("caption");
    caption.innerHTML = "Session Activity Report";
    table.appendChild(caption);

    var tableHead = document.createElement('THEAD');

    table.border = '1'
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

        td.appendChild(document.createTextNode(annotaions[i].getType()));

        //            var icon = getIconType(annotaions[i].getType());
        //            td.appendChild(icon);
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
        a.target = "_blank";

        td.appendChild(a);
        tr.appendChild(td);

        td = document.createElement('TD');
        td.setAttribute('class', 'centered');

        var screenshotLink = annotaions[i].getImageURL();

        if (screenshotLink != "") {
            var img = document.createElement('img');
            img.src = screenshotLink;
            img.style.width = "720px";
            td.appendChild(img);
        }

        tr.appendChild(td);
        tableBody.appendChild(tr);
    }

    tableDiv.appendChild(table);

}

ExportSessionHTML.prototype.addStyleCSS = function(doc) {
    var css = document.createElement("style");
    css.type = "text/css";
    css.innerHTML = "#exportActivityTable { \
                     border: 1px solid #B0B0B0; \
                     } \
                     #exportActivityTable tbody { \
                     margin: 0; \
                     padding: 0; \
                     border: 0; \
                     outline: 0; \
                     font-size: 100%; \
                     vertical-align: baseline; \
                     background: transparent; \
                     } \
                     #exportActivityTable thead { \
                     text-align: center; \
                     } \
                     #exportActivityTable thead th { \
                     background: -moz-linear-gradient(top, #F0F0F0 0, #DBDBDB 100%); \
                     background: -webkit-gradient(linear, left top, left bottom, color-stop(0%, #F0F0F0), color-stop(100%, #DBDBDB)); \
                     filter: progid:DXImageTransform.Microsoft.gradient(startColorstr='#F0F0F0', endColorstr='#DBDBDB', GradientType=0); \
                     border: 1px solid #B0B0B0; \
                     color: #444; \
                     font-size: 16px; \
                     font-weight: bold; \
                     padding: 3px 10px; \
                     } \
                     #exportActivityTable td { \
                     padding: 3px 10px;\
                     } \
                     #exportActivityTable tr:nth-child(even) { \
                     background: #F2F2F2; \
                     } \
                     .centered{text-align:center;} \
                     td{vertical-align: top;} \
                     .noWrap{white-space: nowrap;} \
                     TH{padding:5px;} \
                     body{ font-family: 'Segoe UI', Tahoma, sans-serif;} \
     ";
    doc.head.appendChild(css);
}

ExportSessionHTML.prototype.addTableFilters = function(doc) {
    var script = document.createElement("script");

    // Add script content

    script.innerHTML = "function loadFilter(){ var sessionActivityTable_Props = {col_0: 'select',col_1: 'none',col_2: 'none',col_3: 'none',custom_cell_data_cols: [0],display_all_text: ' [ Show all ] ',sort_select: true};var tf2 = setFilterGrid('exportActivityTable', sessionActivityTable_Props);} ";

    doc.getElementsByTagName('head')[0].appendChild(script);
}