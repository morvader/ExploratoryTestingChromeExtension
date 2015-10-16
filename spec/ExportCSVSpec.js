describe("Export Session to CSV", function(){

	describe("export data to CSV", function(){
		it("shloud export all annotations to CSV", function(){

			var BrowserInfo = "TestBrowser 10.0.1.3";
			var currentDateTime = new Date(2015, 10, 30, 6, 51);

			var session = new Session(currentDateTime, BrowserInfo);

            session.addBug(new Bug("Add Bug","http://TestSite/bugUrl.com",new Date("2015-10-30T08:00:00")));
			session.addIdea(new Idea("Aded Idea","http://TestSite/IdeaUrl.com",new Date("2015-10-30T08:05:00")));
			session.addNote(new Note("Add Note","http://TestSite/NoteUrl.com",new Date("2015-10-30T08:10:00")));
			session.addQuestion(new Question("Add Question","http://TestSite/QuestionUrl.com",new Date("2015-10-30T08:15:00")));

			//expect(session.getBrowserInfo()).toEqual(BrowserInfo);
			//expect(session.getStartDateTime()).toEqual(currentDateTime);

            var expectedCSV = "TimeStamp,Type,Name,URL\n" +
            			      "30-10-2015 8:00,Bug,Add Bug,http://TestSite/bugUrl.com\n" +
            			      "30-10-2015 8:05,Idea,Add Idea,http://TestSite/IdeaUrl.com\n" +
            			      "30-10-2015 8:10,Note,Add Note,http://TestSite/NoteUrl.com\n" +
            			      "30-10-2015 8:15,Question,Add Question,http://TestSite/QuestionUrl.com\n";

			var actualCSV = new ExportSessionCSV(session).getCSVData();

			expect(expectedCSV).toEqual(actualCSV);

//			var pom = document.createElement('a');
//            var csvContent=actualCSV; //here we load our csv data
//            var blob = new Blob([csvContent],{type: 'text/csv;charset=utf-8;'});
//            var url = URL.createObjectURL(blob);
//            pom.href = url;
//            pom.setAttribute('download', 'foo.csv');
//            pom.click();
		});


	});
});