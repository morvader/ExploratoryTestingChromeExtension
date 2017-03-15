describe("Manage Session with Json format", function () {
    describe("export session to Json", function () {
        it("should export every session data to JSon format", function () {
            var BrowserInfo = "TestBrowser 10.0.1.3";
            var currentDateTime = new Date(2015, 10, 30, 6, 51);

            var session = new Session(currentDateTime, BrowserInfo);

            session.addBug(new Bug("Add Bug", "http://TestSite/bugUrl.com", new Date("2015-10-30 08:00:00")));
            session.addIdea(new Idea("Add Idea", "http://TestSite/IdeaUrl.com", new Date("2015-10-30 08:05:00")));
            session.addNote(new Note("Add Note", "http://TestSite/NoteUrl.com", new Date("2015-10-30 08:10:00")));
            session.addQuestion(new Question("Add Question", "http://TestSite/QuestionUrl.com", new Date("2015-10-30 08:15:00")));

            //debugger;
            var expectedJSon = "{\"BrowserInfo\":\"TestBrowser 10.0.1.3\",\"StartDateTime\":\"2015-11-30T05:51:00.000Z\",\"annotations\":[{\"type\":\"Bug\",\"name\":\"Add Bug\",\"URL\":\"http://TestSite/bugUrl.com\",\"timeStamp\":\"2015-10-30T07:00:00.000Z\"},{\"type\":\"Idea\",\"name\":\"Add Idea\",\"URL\":\"http://TestSite/IdeaUrl.com\",\"timeStamp\":\"2015-10-30T07:05:00.000Z\"},{\"type\":\"Note\",\"name\":\"Add Note\",\"URL\":\"http://TestSite/NoteUrl.com\",\"timeStamp\":\"2015-10-30T07:10:00.000Z\"},{\"type\":\"Question\",\"name\":\"Add Question\",\"URL\":\"http://TestSite/QuestionUrl.com\",\"timeStamp\":\"2015-10-30T07:15:00.000Z\"}]}"
            var JSONService = new JSonSessionService();
            var actualJson = JSONService.getJSon(session);

            expect(expectedJSon).toEqual(actualJson);
        });

        it("should export session with no annotations", function () {
            var BrowserInfo = "TestBrowser 10.0.1.3";
            var currentDateTime = new Date(2015, 10, 30, 6, 51);

            var session = new Session(currentDateTime, BrowserInfo);

            var expectedJSon = "{\"BrowserInfo\":\"TestBrowser 10.0.1.3\",\"StartDateTime\":\"2015-11-30T05:51:00.000Z\",\"annotations\":[]}"
            var JSONService = new JSonSessionService();
            var actualJson = JSONService.getJSon(session);

            expect(expectedJSon).toEqual(actualJson);
        });
    });
    describe("import session from Json", function () {
        it("should create a session object from json with no annotations", function () {
            var JSonString = "{\"BrowserInfo\":\"TestBrowser 10.0.1.3\",\"StartDateTime\":\"2015-11-30T05:51:00.000Z\",\"annotations\":[]}";

            var BrowserInfo = "TestBrowser 10.0.1.3";
            var currentDateTime = new Date(2015, 10, 30, 6, 51);

            var expectedSession = new Session(currentDateTime, BrowserInfo);

            var JSONService = new JSonSessionService();
            var actualSession = JSONService.getSession(JSonString);

            expect(expectedSession).toEqual(actualSession);
        });
        it("should create a session object from json with many annotations", function () {
            var JSonString = "{\"BrowserInfo\":\"TestBrowser 10.0.1.3\",\"StartDateTime\":\"2015-11-30T05:51:00.000Z\",\"annotations\":[{\"type\":\"Bug\",\"name\":\"Add Bug\",\"URL\":\"http://TestSite/bugUrl.com\",\"timeStamp\":\"2015-10-30T07:00:00.000Z\"},{\"type\":\"Idea\",\"name\":\"Add Idea\",\"URL\":\"http://TestSite/IdeaUrl.com\",\"timeStamp\":\"2015-10-30T07:05:00.000Z\"},{\"type\":\"Note\",\"name\":\"Add Note\",\"URL\":\"http://TestSite/NoteUrl.com\",\"timeStamp\":\"2015-10-30T07:10:00.000Z\"},{\"type\":\"Question\",\"name\":\"Add Question\",\"URL\":\"http://TestSite/QuestionUrl.com\",\"timeStamp\":\"2015-10-30T07:15:00.000Z\"}]}";

            var BrowserInfo = "TestBrowser 10.0.1.3";
            var currentDateTime = new Date(2015, 10, 30, 6, 51);

            var expectedSession = new Session(currentDateTime, BrowserInfo);
            expectedSession.addBug(new Bug("Add Bug", "http://TestSite/bugUrl.com", new Date("2015-10-30 08:00:00")));
            expectedSession.addIdea(new Idea("Add Idea", "http://TestSite/IdeaUrl.com", new Date("2015-10-30 08:05:00")));
            expectedSession.addNote(new Note("Add Note", "http://TestSite/NoteUrl.com", new Date("2015-10-30 08:10:00")));
            expectedSession.addQuestion(new Question("Add Question", "http://TestSite/QuestionUrl.com", new Date("2015-10-30 08:15:00")));

            var JSONService = new JSonSessionService();
            //debugger;
            var actualSession = JSONService.getSession(JSonString);

            expect(expectedSession).toEqual(actualSession);
        });
    });
    describe("Exportar and importa sesion", function () {
        it("Import an exported session should be consistent", function () {

            var BrowserInfo = "TestBrowser 10.0.1.3";
            var currentDateTime = new Date(2015, 10, 30, 6, 51);

            var initSession = new Session(currentDateTime, BrowserInfo);

            initSession.addBug(new Bug("Add Bug", "http://TestSite/bugUrl.com", new Date("2015-10-30 08:00:00")));
            initSession.addIdea(new Idea("Add Idea", "http://TestSite/IdeaUrl.com", new Date("2015-10-30 08:05:00")));
            initSession.addNote(new Note("Add Note", "http://TestSite/NoteUrl.com", new Date("2015-10-30 08:10:00")));
            initSession.addQuestion(new Question("Add Question", "http://TestSite/QuestionUrl.com", new Date("2015-10-30 08:15:00")));
            
            var JSONService = new JSonSessionService();

            var newSession = JSONService.getSession(JSONService.getJSon(initSession));

            expect(initSession).toEqual(newSession);

        });
    });
});