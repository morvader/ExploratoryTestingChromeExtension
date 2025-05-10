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

            var parsedExpected = JSON.parse(`{
                "BrowserInfo": "TestBrowser 10.0.1.3",
                "StartDateTime": "2015-11-30T05:51:00.000Z",
                "annotations": [
                    {
                        "type": "Bug",
                        "name": "Add Bug",
                        "url": "http://TestSite/bugUrl.com",
                        "timestamp": "2015-10-30T07:00:00.000Z"
                    },
                    {
                        "type": "Idea",
                        "name": "Add Idea",
                        "url": "http://TestSite/IdeaUrl.com",
                        "timestamp": "2015-10-30T07:05:00.000Z"
                    },
                    {
                        "type": "Note",
                        "name": "Add Note",
                        "url": "http://TestSite/NoteUrl.com",
                        "timestamp": "2015-10-30T07:10:00.000Z"
                    },
                    {
                        "type": "Question",
                        "name": "Add Question",
                        "url": "http://TestSite/QuestionUrl.com",
                        "timestamp": "2015-10-30T07:15:00.000Z"
                    }
                ]
            }`);

            var JSONService = new JSonSessionService();
            var actualJson = JSONService.getJSon(session);

            var parsedActual = JSON.parse(actualJson);

            // Comparar los objetos JavaScript en lugar de los strings JSON
            expect(parsedActual).toEqual(parsedExpected);
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

            // El JSON de entrada parseado
            var JSonString = `{
        "BrowserInfo": "TestBrowser 10.0.1.3",
        "StartDateTime": "2015-11-30T05:51:00.000Z",
        "annotations": [
            {
                "type": "Bug",
                "name": "Add Bug",
                "url": "http://TestSite/bugUrl.com",
                "timestamp": "2015-10-30T07:00:00.000Z"
            },
            {
                "type": "Idea",
                "name": "Add Idea",
                "url": "http://TestSite/IdeaUrl.com",
                "timestamp": "2015-10-30T07:05:00.000Z"
            },
            {
                "type": "Note",
                "name": "Add Note",
                "url": "http://TestSite/NoteUrl.com",
                "timestamp": "2015-10-30T07:10:00.000Z"
            },
            {
                "type": "Question",
                "name": "Add Question",
                "url": "http://TestSite/QuestionUrl.com",
                "timestamp": "2015-10-30T07:15:00.000Z"
            }
        ]
    }`;

            var BrowserInfo = "TestBrowser 10.0.1.3";
            var currentDateTime = new Date("2015-11-30T05:51:00.000Z");

            var expectedSession = new Session(currentDateTime, BrowserInfo);
            expectedSession.addBug(new Bug("Add Bug", "http://TestSite/bugUrl.com", new Date("2015-10-30T07:00:00.000Z")));
            expectedSession.addIdea(new Idea("Add Idea", "http://TestSite/IdeaUrl.com", new Date("2015-10-30T07:05:00.000Z")));
            expectedSession.addNote(new Note("Add Note", "http://TestSite/NoteUrl.com", new Date("2015-10-30T07:10:00.000Z")));
            expectedSession.addQuestion(new Question("Add Question", "http://TestSite/QuestionUrl.com", new Date("2015-10-30T07:15:00.000Z")));

            var JSONService = new JSonSessionService();
            var actualSession = JSONService.getSession(JSonString);

            // En lugar de comparar directamente los objetos Session, creamos representaciones JSON de ambos y los comparamos
            var actualSessionJson = JSON.stringify(actualSession);
            var expectedSessionJson = JSON.stringify(expectedSession);

            // Parseamos los JSON para ignorar diferencias de formato
            var parsedActual = JSON.parse(actualSessionJson);
            var parsedExpected = JSON.parse(expectedSessionJson);

            // Comparamos los objetos parseados
            expect(parsedActual).toEqual(parsedExpected);
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

describe('JSonSessionService', function () {
    let jsonService;
    let testSession;
    let testBug;
    let testNote;
    let testIdea;
    let testQuestion;

    beforeEach(function () {
        jsonService = new JSonSessionService();
        testSession = new Session(new Date(), "Chrome");

        // Crear anotaciones de prueba
        testBug = new Bug("Test Bug", "http://test.com", new Date().getTime(), "http://test.com/bug.jpg");
        testNote = new Note("Test Note", "http://test.com", new Date().getTime(), "http://test.com/note.jpg");
        testIdea = new Idea("Test Idea", "http://test.com", new Date().getTime(), "http://test.com/idea.jpg");
        testQuestion = new Question("Test Question", "http://test.com", new Date().getTime(), "http://test.com/question.jpg");

        testSession.addBug(testBug);
        testSession.addNote(testNote);
        testSession.addIdea(testIdea);
        testSession.addQuestion(testQuestion);
    });

    describe('getJSon', function () {
        it('should convert session to JSON string', function () {
            const jsonString = jsonService.getJSon(testSession);
            const parsedJson = JSON.parse(jsonString);

            expect(parsedJson.annotations.length).toBe(4);
            expect(parsedJson.BrowserInfo).toBe("Chrome");
            expect(new Date(parsedJson.StartDateTime)).toEqual(testSession.getStartDateTime());
        });
    });

    describe('getSession', function () {
        it('should convert JSON string back to session', function () {
            const jsonString = jsonService.getJSon(testSession);
            const restoredSession = jsonService.getSession(jsonString);

            expect(restoredSession.getAnnotations().length).toBe(4);
            expect(restoredSession.getBrowserInfo()).toBe("Chrome");
            expect(restoredSession.getStartDateTime()).toEqual(testSession.getStartDateTime());
        });

        it('should handle empty annotations array', function () {
            const emptySession = new Session(new Date(), "Chrome");
            const jsonString = jsonService.getJSon(emptySession);
            const restoredSession = jsonService.getSession(jsonString);

            expect(restoredSession.getAnnotations().length).toBe(0);
        });
    });

    describe('getAnnotaionFromType', function () {
        it('should create correct annotation type from JSON', function () {
            const bugJson = {
                type: "Bug",
                name: "Test Bug",
                url: "http://test.com",
                timestamp: new Date().getTime(),
                imageURL: "http://test.com/bug.jpg"
            };

            const noteJson = {
                type: "Note",
                name: "Test Note",
                url: "http://test.com",
                timestamp: new Date().getTime(),
                imageURL: "http://test.com/note.jpg"
            };

            const ideaJson = {
                type: "Idea",
                name: "Test Idea",
                url: "http://test.com",
                timestamp: new Date().getTime(),
                imageURL: "http://test.com/idea.jpg"
            };

            const questionJson = {
                type: "Question",
                name: "Test Question",
                url: "http://test.com",
                timestamp: new Date().getTime(),
                imageURL: "http://test.com/question.jpg"
            };

            expect(jsonService.getAnnotaionFromType(bugJson) instanceof Bug).toBe(true);
            expect(jsonService.getAnnotaionFromType(noteJson) instanceof Note).toBe(true);
            expect(jsonService.getAnnotaionFromType(ideaJson) instanceof Idea).toBe(true);
            expect(jsonService.getAnnotaionFromType(questionJson) instanceof Question).toBe(true);
        });
    });
});