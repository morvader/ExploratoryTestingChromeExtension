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

		it("when a bug is added there is one more annotation", function(){
			var bugName = "Add a new bug test";

			var newBug = new Bug(bugName);

			session.addBug(newBug);

			var annotations = session.getAnnotations();

			expect(annotations.length).toEqual(1);

			//Check that is the bug just inserted
			expect(annotations[0].getName()).toEqual(bugName);

		});

		it("when a idea is added there is one more annotation", function(){
			var ideaName = "Add a new idea test";

			var newIdea = new Idea(ideaName);

			session.addIdea(newIdea);

			var annotations = session.getAnnotations();

			expect(annotations.length).toEqual(1);

			//Check that is the idea just inserted
			expect(annotations[0].getName()).toEqual(ideaName);

		});

		it("when a note is added there is one more annotation", function(){
			var noteName = "Add a new note test";

			var newNote = new Note(noteName);

			session.addNote(newNote);

			var annotations = session.getAnnotations();

			expect(annotations.length).toEqual(1);

			//Check that is the Note just inserted
			expect(annotations[0].getName()).toEqual(noteName);

		});

		it("when a question is added there is one more annotation", function(){
			var questionName = "Add a new question test";

			var newQuestion = new Question(questionName);

			session.addQuestion(newQuestion);

			var annotations = session.getAnnotations();

			expect(annotations.length).toEqual(1);

			//Check that is the Note just inserted
			expect(annotations[0].getName()).toEqual(questionName);

		});

	});
	
});