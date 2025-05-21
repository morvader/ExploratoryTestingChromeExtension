import { ExportSessionCSV } from '../../src/ExportSessionCSV';
import { Session } from '../../src/Session';
import { Bug, Idea, Note, Question } from '../../src/Annotation';

describe("Export Session to CSV", function () {

	describe("export data to CSV", function () {
		it("should export all annotations to CSV", function () { // Typo "shloud" corrected

			var BrowserInfo = "TestBrowser 10.0.1.3";
			var currentDateTime = new Date(2015, 10, 30, 6, 51); // Month 10 is November
			// Removed duplicated line currentDateTime

			var session = new Session(currentDateTime, BrowserInfo);

			// Month 9 is October for annotations
			session.addBug(new Bug("Add Bug", "http://TestSite/bugUrl.com", new Date(2015, 9, 30, 8, 0, 0)));
			session.addIdea(new Idea("Add Idea", "http://TestSite/IdeaUrl.com", new Date(2015, 9, 30, 8, 5, 0)));
			session.addNote(new Note("Add Note", "http://TestSite/NoteUrl.com", new Date(2015, 9, 30, 8, 10, 0)));
			session.addQuestion(new Question("Add Question", "http://TestSite/QuestionUrl.com", new Date(2015, 9, 30, 8, 15, 0)));

			var expectedCSV = "TimeStamp,Type,Name,URL\n" +
				"30-10-2015 08:00,Bug,Add Bug,http://TestSite/bugUrl.com\n" +
				"30-10-2015 08:05,Idea,Add Idea,http://TestSite/IdeaUrl.com\n" +
				"30-10-2015 08:10,Note,Add Note,http://TestSite/NoteUrl.com\n" +
				"30-10-2015 08:15,Question,Add Question,http://TestSite/QuestionUrl.com\n";

			var actualCSV = new ExportSessionCSV(session).getCSVData();

			expect(actualCSV).toEqual(expectedCSV); // Standard order: actual, expected
		});
	});
});

describe('ExportSessionCSV', function () {
	let exportCSV;
	let testSession;
	let testBug;
	let testNote;

	beforeEach(function () {
		testSession = new Session(new Date(), "Chrome");

		// Crear anotaciones de prueba
		testBug = new Bug("Test Bug", "http://test.com", new Date().getTime(), "http://test.com/bug.jpg");
		testNote = new Note("Test Note", "http://test.com", new Date().getTime(), "http://test.com/note.jpg");

		testSession.addBug(testBug);
		testSession.addNote(testNote);

		exportCSV = new ExportSessionCSV(testSession);
	});

	describe('getCSVData', function () {
		it('should generate correct CSV header', function () {
			const csvData = exportCSV.getCSVData();
			expect(csvData.startsWith('TimeStamp,Type,Name,URL\n')).toBe(true);
		});

		it('should include all annotations in CSV', function () {
			const csvData = exportCSV.getCSVData();
			const lines = csvData.split('\n');

			// Header + 2 annotations + empty line at end
			expect(lines.length).toBe(4);

			// Verificar que las anotaciones están en el CSV
			expect(lines[1]).toContain('Bug');
			expect(lines[1]).toContain('Test Bug');
			expect(lines[1]).toContain('http://test.com');

			expect(lines[2]).toContain('Note');
			expect(lines[2]).toContain('Test Note');
			expect(lines[2]).toContain('http://test.com');
		});

		it('should handle empty session', function () {
			const emptySession = new Session(new Date(), "Chrome");
			const emptyExportCSV = new ExportSessionCSV(emptySession);
			const csvData = emptyExportCSV.getCSVData();

			expect(csvData).toBe('TimeStamp,Type,Name,URL\n');
		});
	});

	describe('downloadCSVFile', function () {
		it('should create a download link', function () {
			// Mock del DOM que registra todos los cambios
			const mockLink = {
				href: '',
				download: '',
				click: jest.fn(),
				setAttribute: jest.fn(function (name, value) { // Simplified mockImplementation
					this[name] = value;
				})
			};

			jest.spyOn(document, 'createElement').mockReturnValue(mockLink);
			jest.spyOn(URL, 'createObjectURL').mockReturnValue('mock-url');

			exportCSV.downloadCSVFile();

			// Verificar llamada a createElement
			expect(document.createElement).toHaveBeenCalledWith('a');

			// Verificar que href es el esperado (sin importar cómo se estableció)
			expect(mockLink.href).toBe('mock-url');

			// Verificar que download es el esperado (sin importar cómo se estableció)
			// expect(mockLink.download).toBe('foo.csv'); // Direct property check might be less reliable with some mock setups
			// Instead, check if setAttribute was called correctly for 'download'

			// Verificar que se llamó a setAttribute específicamente para download
			expect(mockLink.setAttribute).toHaveBeenCalledWith('download', 'foo.csv');
			
			// Verify that the click method was called
			expect(mockLink.click).toHaveBeenCalled();
		});
	});