function Session(dateTime,BrowserInfo) {
	this.BrowserInfo = BrowserInfo;
	this.StartDateTime = dateTime;

	this.annotations = new Array();
}

Session.prototype.getBrowserInfo = function() {
  return this.BrowserInfo;
};

Session.prototype.getStartDateTime = function() {
  return this.StartDateTime;
};

Session.prototype.getAnnotations = function() {
  return this.annotations;
};

Session.prototype.addBug = function(newBug) {
  this.annotations.push(newBug);
};

Session.prototype.addIdea = function(newIdea) {
  this.annotations.push(newIdea);
};

Session.prototype.addNote = function(newNote) {
  this.annotations.push(newNote);
};

Session.prototype.addQuestion = function(newQuestion) {
  this.annotations.push(newQuestion);
};
