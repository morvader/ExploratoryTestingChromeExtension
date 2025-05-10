describe('Annotation Classes', function () {
    let testName = "Test Annotation";
    let testUrl = "http://test.com";
    let testTimestamp = new Date().getTime();
    let testImageUrl = "http://test.com/image.jpg";

    describe('Base Annotation Class', function () {
        let annotation;

        beforeEach(function () {
            annotation = new Annotation(testName, testUrl, testTimestamp, testImageUrl);
        });

        it('should create an annotation with correct properties', function () {
            expect(annotation.getName()).toBe(testName);
            expect(annotation.getURL()).toBe(testUrl);
            expect(annotation.getTimeStamp().getTime()).toBe(testTimestamp);
            expect(annotation.getImageURL()).toBe(testImageUrl);
        });

        it('should allow changing the name', function () {
            const newName = "New Name";
            annotation.setName(newName);
            expect(annotation.getName()).toBe(newName);
        });

        it('should allow changing the image URL', function () {
            const newImageUrl = "http://test.com/new-image.jpg";
            annotation.setImageURL(newImageUrl);
            expect(annotation.getImageURL()).toBe(newImageUrl);
        });
    });

    describe('Bug Class', function () {
        let bug;

        beforeEach(function () {
            bug = new Bug(testName, testUrl, testTimestamp, testImageUrl);
        });

        it('should create a bug with correct type', function () {
            expect(bug.getType()).toBe("Bug");
        });

        it('should inherit from Annotation', function () {
            expect(bug instanceof Annotation).toBe(true);
        });
    });

    describe('Idea Class', function () {
        let idea;

        beforeEach(function () {
            idea = new Idea(testName, testUrl, testTimestamp, testImageUrl);
        });

        it('should create an idea with correct type', function () {
            expect(idea.getType()).toBe("Idea");
        });

        it('should inherit from Annotation', function () {
            expect(idea instanceof Annotation).toBe(true);
        });
    });

    describe('Note Class', function () {
        let note;

        beforeEach(function () {
            note = new Note(testName, testUrl, testTimestamp, testImageUrl);
        });

        it('should create a note with correct type', function () {
            expect(note.getType()).toBe("Note");
        });

        it('should inherit from Annotation', function () {
            expect(note instanceof Annotation).toBe(true);
        });
    });

    describe('Question Class', function () {
        let question;

        beforeEach(function () {
            question = new Question(testName, testUrl, testTimestamp, testImageUrl);
        });

        it('should create a question with correct type', function () {
            expect(question.getType()).toBe("Question");
        });

        it('should inherit from Annotation', function () {
            expect(question instanceof Annotation).toBe(true);
        });
    });
}); 