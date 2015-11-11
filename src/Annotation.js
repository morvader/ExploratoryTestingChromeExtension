
//Annotation father class
function Annotation(name, url, timestamp,imageURL) {
	this.name = name;
	this.URL = url;
	this.timeStamp = timestamp;
	this.imageURL = imageURL;
}

Annotation.prototype.getName = function() {
	return this.name;
};

Annotation.prototype.getURL = function() {
	return this.URL;
};

Annotation.prototype.getTimeStamp = function() {
	return new Date(this.timeStamp);
};

Annotation.prototype.setImageURL = function(imageURL) {
	this.imageURL = imageURL;
};

Annotation.prototype.getImageURL = function() {
	return this.imageURL;
};


//Bug class inherit from annotation
Bug.prototype = new Annotation();        // Here's where the inheritance occurs
Bug.prototype.constructor=Bug;
function Bug(name,url,timestamp,imageURL){
	this.name = name;
    this.URL = url;
    this.timeStamp = timestamp;
    this.imageURL = imageURL;
}
Bug.prototype.getType = function(){
    return "Bug";
};

//Idea class inherit from annotation
Idea.prototype = new Annotation();        // Here's where the inheritance occurs
Idea.prototype.constructor=Idea;
function Idea(name,url,timestamp,imageURL){
	this.name = name;
    this.URL = url;
    this.timeStamp = timestamp;
    this.imageURL = imageURL;
}
Idea.prototype.getType = function(){
    return "Idea";
};

//Note class inherit from annotation
Note.prototype = new Annotation();        // Here's where the inheritance occurs
Note.prototype.constructor=Note;
function Note(name,url,timestamp,imageURL){
	this.name = name;
    this.URL = url;
    this.timeStamp = timestamp;
    this.imageURL = imageURL;
}
Note.prototype.getType = function(){
    return "Note";
};

//Question class inherit from annotation
Question.prototype = new Annotation();        // Here's where the inheritance occurs
Question.prototype.constructor=Question;
function Question(name,url,timestamp,imageURL){
	this.name = name;
    this.URL = url;
    this.timeStamp = timestamp;
    this.imageURL = imageURL;
}
Question.prototype.getType = function(){
    return "Question";
};

