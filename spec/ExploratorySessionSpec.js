describe("Exploratory Session", function(){

	describe("when Session starts", function(){
		it("should store sarting DateTime and Browser Info", function(){

			var BrowserInfo = "TestBrowser 10.0.1.3";
			var currentDateTime = new Date(2015, 10, 30, 6, 51);

			var session = new Session(currentDateTime, BrowserInfo);
			
			expect(session.getBrowserInfo()).toEqual(BrowserInfo);
			expect(session.getStartDateTime()).toEqual(currentDateTime);
		});


	});

	describe("shloud store annotations: bugs, ideas, questions and notes", function(){

		var session;

		beforeEach(function() {
			var BrowserInfo = "TestBrowser 10.0.1.3";
			var currentDateTime = new Date(2015, 10, 30, 6, 51);

			session = new Session(currentDateTime, BrowserInfo);
		});

		it("annotations should be empty at the begining", function(){
			var annotations = session.getAnnotations();

			expect(annotations.length).toEqual(0);
		});

	});
	
});