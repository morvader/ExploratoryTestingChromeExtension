
//Annotation father class
function Annotation(name) {
	this.name = name;

}

Annotation.prototype.getName = function() { 
	return this.name 
}; 


//Bug class inherit from annotation
Bug.prototype = new Annotation();        // Here's where the inheritance occurs 
Bug.prototype.constructor=Bug;       
function Bug(name){ 
	this.name=name;
} 

//Idea class inherit from annotation
Idea.prototype = new Annotation();        // Here's where the inheritance occurs 
Idea.prototype.constructor=Idea;       
function Idea(name){ 
	this.name=name;
} 

//Note class inherit from annotation
Note.prototype = new Annotation();        // Here's where the inheritance occurs 
Note.prototype.constructor=Note;       
function Note(name){ 
	this.name=name;
}

//Question class inherit from annotation
Question.prototype = new Annotation();        // Here's where the inheritance occurs 
Question.prototype.constructor=Question;       
function Question(name){ 
	this.name=name;
}  


