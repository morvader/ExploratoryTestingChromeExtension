function JSonSessionService() {}

JSonSessionService.prototype.getJSon = function (session) {
    return JSON.stringify(session);
}

JSonSessionService.prototype.getSession = function (jsonString) {
    var object = JSON.parse(jsonString);
    var annotations = [];

    var i;
    var tempAnnotations = object.annotations;
    if (tempAnnotations.length != 0) {
        for (i = 0; i < tempAnnotations.length; i++) {
            var ann = new Annotation();
            ann = tempAnnotations[i];
            annotations.push(getAnnotaionFromType(ann));
        }
    }
    var sessionDate = new Date(object.StartDateTime);
    var session = new Session(sessionDate, object.BrowserInfo);
    session.setAnnotations(annotations);
    return session;
}

function getAnnotaionFromType(annotation) {
    var name = annotation.name;
    var URL = annotation.URL;
    var timeStamp = new Date(annotation.timeStamp);
    var image = annotation.imageURL;

    if (annotation.type == "Bug") return new Bug(name, URL,timeStamp,image);
    if (annotation.type == "Note") return new Note(name, URL,timeStamp,image);
    if (annotation.type == "Idea") return new Idea(name, URL,timeStamp,image);
    if (annotation.type == "Question") return new Question(name, URL,timeStamp,image);
    if (annotation.type == "Charter") return new Charter(name, URL, timeStamp, image);
}