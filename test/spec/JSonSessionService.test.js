import { JSonSessionService } from '../../src/JSonSessionService';
import { Session } from '../../src/Session';
import { Bug, Idea, Note, Question } from '../../src/Annotation';

describe("Manage Session with Json format", function () {
    describe("export session to Json", function () {
        it("should export every session data to JSon format", function () {
            var BrowserInfo = "TestBrowser 10.0.1.3";
            var currentDateTime = new Date(2015, 10, 30, 6, 51); // Assuming this creates a date in local TZ

            var session = new Session(currentDateTime, BrowserInfo);

            // These will also be local TZ, then toJSON converts to UTC
            session.addBug(new Bug("Add Bug", "http://TestSite/bugUrl.com", new Date(2015, 9, 30, 8, 0, 0))); // Month is 0-indexed for Date constructor
            session.addIdea(new Idea("Add Idea", "http://TestSite/IdeaUrl.com", new Date(2015, 9, 30, 8, 5, 0)));
            session.addNote(new Note("Add Note", "http://TestSite/NoteUrl.com", new Date(2015, 9, 30, 8, 10, 0)));
            session.addQuestion(new Question("Add Question", "http://TestSite/QuestionUrl.com", new Date(2015, 9, 30, 8, 15, 0)));

            // Expected JSON should match the toJSON() output from the above Date objects
            // Based on the previous test run, the dates are serialized with an offset.
            // If currentDateTime = new Date(2015, 10, 30, 6, 51) becomes "2015-11-30T06:51:00.000Z"
            // and new Date(2015, 9, 30, 8, 0, 0) becomes "2015-10-30T08:00:00.000Z"
            var parsedExpected = JSON.parse(`{
                "BrowserInfo": "TestBrowser 10.0.1.3",
                "StartDateTime": "${new Date(2015, 10, 30, 6, 51).toJSON()}",
                "annotations": [
                    {
                        "type": "Bug",
                        "name": "Add Bug",
                        "url": "http://TestSite/bugUrl.com",
                        "timestamp": "${new Date(2015, 9, 30, 8, 0, 0).toJSON()}"
                    },
                    {
                        "type": "Idea",
                        "name": "Add Idea",
                        "url": "http://TestSite/IdeaUrl.com",
                        "timestamp": "${new Date(2015, 9, 30, 8, 5, 0).toJSON()}"
                    },
                    {
                        "type": "Note",
                        "name": "Add Note",
                        "url": "http://TestSite/NoteUrl.com",
                        "timestamp": "${new Date(2015, 9, 30, 8, 10, 0).toJSON()}"
                    },
                    {
                        "type": "Question",
                        "name": "Add Question",
                        "url": "http://TestSite/QuestionUrl.com",
                        "timestamp": "${new Date(2015, 9, 30, 8, 15, 0).toJSON()}"
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
            // Expected JSON should match the toJSON() output from currentDateTime
            var expectedJSon = `{"BrowserInfo":"TestBrowser 10.0.1.3","StartDateTime":"${currentDateTime.toJSON()}","annotations":[]}`
            var JSONService = new JSonSessionService();
            var actualJson = JSONService.getJSon(session);

            expect(actualJson).toEqual(expectedJSon); // Swapped actual and expected to match Jest's typical order, and compare JSON strings
        });
    });
    describe("import session from Json", function () {
        it("should create a session object from json with no annotations", function () {
            const testDate = new Date(2015, 10, 30, 6, 51);
            const testDateJSON = testDate.toJSON();
            var JSonString = `{"BrowserInfo":"TestBrowser 10.0.1.3","StartDateTime":"${testDateJSON}","annotations":[]}`;

            var BrowserInfo = "TestBrowser 10.0.1.3";
            // For expectedSession, use the exact same date object that generated the JSON string to ensure consistency
            var expectedSession = new Session(new Date(testDateJSON), BrowserInfo);

            var JSONService = new JSonSessionService();
            var actualSession = JSONService.getSession(JSonString);

            // Compare the toJSON strings of dates, or getTime() values for robust comparison
            expect(actualSession.getStartDateTime().getTime()).toEqual(expectedSession.getStartDateTime().getTime());
            expect(actualSession.getBrowserInfo()).toEqual(expectedSession.getBrowserInfo());
            expect(actualSession.getAnnotations()).toEqual(expectedSession.getAnnotations());
        });
        it("should create a session object from json with many annotations", function () {
            const sessionStartDate = new Date(2015, 10, 30, 6, 51);
            const bugDate = new Date(2015, 9, 30, 8, 0, 0);
            const ideaDate = new Date(2015, 9, 30, 8, 5, 0);
            const noteDate = new Date(2015, 9, 30, 8, 10, 0);
            const questionDate = new Date(2015, 9, 30, 8, 15, 0);

            // El JSON de entrada parseado
            var JSonString = `{
        "BrowserInfo": "TestBrowser 10.0.1.3",
        "StartDateTime": "${sessionStartDate.toJSON()}",
        "annotations": [
            {
                "type": "Bug",
                "name": "Add Bug",
                "url": "http://TestSite/bugUrl.com",
                "timestamp": "${bugDate.toJSON()}"
            },
            {
                "type": "Idea",
                "name": "Add Idea",
                "url": "http://TestSite/IdeaUrl.com",
                "timestamp": "${ideaDate.toJSON()}"
            },
            {
                "type": "Note",
                "name": "Add Note",
                "url": "http://TestSite/NoteUrl.com",
                "timestamp": "${noteDate.toJSON()}"
            },
            {
                "type": "Question",
                "name": "Add Question",
                "url": "http://TestSite/QuestionUrl.com",
                "timestamp": "${questionDate.toJSON()}"
            }
        ]
    }`;

            var BrowserInfo = "TestBrowser 10.0.1.3";
            // Use the .toJSON() string for constructing dates for expectedSession to ensure they are parsed identically
            var expectedSession = new Session(new Date(sessionStartDate.toJSON()), BrowserInfo);
            expectedSession.addBug(new Bug("Add Bug", "http://TestSite/bugUrl.com", new Date(bugDate.toJSON())));
            expectedSession.addIdea(new Idea("Add Idea", "http://TestSite/IdeaUrl.com", new Date(ideaDate.toJSON())));
            expectedSession.addNote(new Note("Add Note", "http://TestSite/NoteUrl.com", new Date(noteDate.toJSON())));
            expectedSession.addQuestion(new Question("Add Question", "http://TestSite/QuestionUrl.com", new Date(questionDate.toJSON())));

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
            var currentDateTime = new Date(2015, 10, 30, 6, 51); // Local time

            var initSession = new Session(currentDateTime, BrowserInfo);

            // Use 0-indexed months for Date constructor
            initSession.addBug(new Bug("Add Bug", "http://TestSite/bugUrl.com", new Date(2015, 9, 30, 8, 0, 0)));
            initSession.addIdea(new Idea("Add Idea", "http://TestSite/IdeaUrl.com", new Date(2015, 9, 30, 8, 5, 0)));
            initSession.addNote(new Note("Add Note", "http://TestSite/NoteUrl.com", new Date(2015, 9, 30, 8, 10, 0)));
            initSession.addQuestion(new Question("Add Question", "http://TestSite/QuestionUrl.com", new Date(2015, 9, 30, 8, 15, 0)));

            var JSONService = new JSonSessionService();

            var newSession = JSONService.getSession(JSONService.getJSon(initSession));

            expect(initSession).toEqual(newSession);

        });
    });

    describe('getSession error handling', function() {
        let jsonService;

        beforeEach(function() {
            jsonService = new JSonSessionService();
        });

        it('should throw error for invalid JSON string', function() {
            const invalidJsonString = "this is not json";
            expect(() => {
                jsonService.getSession(invalidJsonString);
            }).toThrow(SyntaxError); // JSON.parse throws SyntaxError
        });

        it('should throw an error or return null for JSON not matching session structure (empty object)', function() {
            const jsonString = "{}";
            // Depending on implementation, this might throw TypeError if properties are accessed on undefined,
            // or it might return a Session object with undefined/default values.
            // Current implementation of getSession directly accesses properties like object.StartDateTime.
            // If object.StartDateTime is undefined, new Date(undefined) results in an Invalid Date.
            // Session constructor might handle this, or it might result in an unexpected session state.
            // Let's test for a TypeError or if it creates a session with invalid dates.
            expect(() => {
                 const session = jsonService.getSession(jsonString);
                 // Further check if session or its properties are valid if no error is thrown
                 // For example, if StartDateTime is crucial and becomes "Invalid Date"
                 if (session && session.getStartDateTime() instanceof Date && isNaN(session.getStartDateTime().getTime())) {
                    throw new Error("Session created with Invalid Date");
                 } else if (!session) {
                    throw new Error("Session is null or undefined");
                 }
            }).toThrow(); // Broad error check, refine if specific error is known/expected
        });

        it('should throw an error or return null for JSON not matching session structure (empty array)', function() {
            const jsonString = "[]";
            // JSON.parse of "[]" results in an array. Accessing .StartDateTime on an array will be undefined.
            expect(() => {
                const session = jsonService.getSession(jsonString);
                 if (session && session.getStartDateTime() instanceof Date && isNaN(session.getStartDateTime().getTime())) {
                    throw new Error("Session created with Invalid Date from array JSON");
                 } else if (!session && typeof session !== 'object') { // if it returns something not an object
                    throw new Error("Session is not an object or is null/undefined");
                 }
            }).toThrow();
        });

        it('should throw an error or return null for JSON with unexpected structure', function() {
            const jsonString = '{ "foo": "bar" }';
            expect(() => {
                const session = jsonService.getSession(jsonString);
                if (session && session.getStartDateTime() instanceof Date && isNaN(session.getStartDateTime().getTime())) {
                    throw new Error("Session created with Invalid Date from custom JSON");
                 } else if (!session) {
                    throw new Error("Session is null or undefined");
                 }
            }).toThrow();
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