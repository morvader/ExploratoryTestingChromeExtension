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
