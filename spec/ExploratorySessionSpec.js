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
            var url = "http://myTestPage.com"

			var newBug = new Bug(bugName,url);

			session.addBug(newBug);

			var annotations = session.getAnnotations();

			expect(annotations.length).toEqual(1);

			//Check that is the bug just inserted
			expect(annotations[0].getName()).toEqual(bugName);
			expect(annotations[0].getURL()).toEqual(url);

		});

		it("when a idea is added there is one more annotation", function(){
			var ideaName = "Add a new idea test";
            var url = "http://myTestPage.com"

			var newIdea = new Idea(ideaName,url);

			session.addIdea(newIdea);

			var annotations = session.getAnnotations();

			expect(annotations.length).toEqual(1);

			//Check that is the idea just inserted
			expect(annotations[0].getName()).toEqual(ideaName);
			expect(annotations[0].getURL()).toEqual(url);

		});

		it("when a note is added there is one more annotation", function(){
			var noteName = "Add a new note test";
            var url = "http://myTestPage.com"

			var newNote = new Note(noteName,url);

			session.addNote(newNote);

			var annotations = session.getAnnotations();

			expect(annotations.length).toEqual(1);

			//Check that is the Note just inserted
			expect(annotations[0].getName()).toEqual(noteName);
			expect(annotations[0].getURL()).toEqual(url);

		});

		it("when a question is added there is one more annotation", function(){
			var questionName = "Add a new question test";
            var url = "http://myTestPage.com"

			var newQuestion = new Question(questionName,url);

			session.addQuestion(newQuestion);

			var annotations = session.getAnnotations();

			expect(annotations.length).toEqual(1);

			//Check that is the question just inserted
			expect(annotations[0].getName()).toEqual(questionName);
			expect(annotations[0].getURL()).toEqual(url);

		});

		it("different types of annotations can be added", function(){

			session.addBug(new Bug("Add Bug"));
			session.addIdea(new Idea("Aded Idea"));
			session.addNote(new Note("Add Note"));
			session.addQuestion(new Question("Add Question"));

			var annotations = session.getAnnotations();

			expect(annotations.length).toEqual(4);

			//Check inserted types order
			expect(annotations[0] instanceof Bug).toBeTruthy();
			expect(annotations[1] instanceof Idea).toBeTruthy();
			expect(annotations[2] instanceof Note).toBeTruthy();
			expect(annotations[3] instanceof Question).toBeTruthy();

		});
		it("retrieve annotations by type", function(){

        	session.addBug(new Bug("Add Bug"));
        	session.addIdea(new Idea("Aded Idea"));
        	session.addNote(new Note("Add Note"));
        	session.addBug(new Bug("Add Bug2"));
        	//session.addQuestion(new Question("Add Question"));
        	session.addNote(new Note("Add Note2"));
        	session.addBug(new Bug("Add Bug3"));

        	var bugs = session.getBugs();
        	var notes = session.getNotes();
        	var ideas = session.getIdeas();
        	var questions = session.getQuestions();

        	expect(bugs.length).toEqual(3);
        	expect(notes.length).toEqual(2);
        	expect(ideas.length).toEqual(1);
        	expect(questions.length).toEqual(0);

        });


	});

});