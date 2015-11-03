var session;

function initData(){
    var BrowserInfo = "TestBrowser 10.0.1.3";
    var currentDateTime = new Date(2015, 10, 30, 6, 51);
    session = new Session(currentDateTime, BrowserInfo);

    session.addBug(new Bug("Add Bug"));
    session.addIdea(new Idea("Aded Idea"));
    session.addNote(new Note("Add Note"));
    session.addBug(new Bug("Add Bug2"));
    session.addQuestion(new Question("Add Question"));
    session.addNote(new Note("Add Note2"));
    session.addBug(new Bug("Add Bug3"));


    loadData(session);
}

function loadData(data){
        session = data;

        loadSessionInfo();
}

function loadSessionInfo(){
    document.getElementById("sessionDate").innerHTML = session.getStartDateTime().toString('dd-MM-yyyy HH:mm');
    document.getElementById("browserInfo").innerHTML = session.getBrowserInfo();
}

document.addEventListener('DOMContentLoaded', function() {
  var addNewIdeaBtn = document.getElementById("fakeData");
  addNewIdeaBtn.addEventListener('click',initData)
}, false);