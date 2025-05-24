import { Bug, Note, Idea, Question } from './Annotation.js';

export class Session {
  constructor(dateTime, BrowserInfo) {
    this.BrowserInfo = BrowserInfo;
    this.StartDateTime = dateTime;
    this.annotations = [];
  }

  getBrowserInfo() {
    return this.BrowserInfo;
  }

  getStartDateTime() {
    return new Date(this.StartDateTime);
  }

  clearAnnotations() {
    this.annotations = [];
  }

  setAnnotations(newAnnotations) {
    this.annotations = newAnnotations;
  }

  deleteAnnotation(annotationID) {
    if (annotationID > -1) {
      this.annotations.splice(annotationID, 1);
    }
  }

  getAnnotations() {
    return this.annotations;
  }

  getBugs() {
    return this.annotations.filter(item => item instanceof Bug);
  }

  getNotes() {
    return this.annotations.filter(item => item instanceof Note);
  }

  getIdeas() {
    return this.annotations.filter(item => item instanceof Idea);
  }

  getQuestions() {
    return this.annotations.filter(item => item instanceof Question);
  }

  addBug(newBug) {
    this.annotations.push(newBug);
  }

  addIdea(newIdea) {
    this.annotations.push(newIdea);
  }

  addNote(newNote) {
    this.annotations.push(newNote);
  }

  addQuestion(newQuestion) {
    this.annotations.push(newQuestion);
  }

  static fromPlainObject(plainSessionObject) {
    if (!plainSessionObject) {
      return null;
    }

    // Ensure StartDateTime is a Date object
    const startDateTime = plainSessionObject.StartDateTime ? new Date(plainSessionObject.StartDateTime) : new Date();
    const session = new Session(startDateTime, plainSessionObject.BrowserInfo);

    if (plainSessionObject.annotations && Array.isArray(plainSessionObject.annotations)) {
      plainSessionObject.annotations.forEach(ann => {
        if (!ann || !ann.type) {
          console.warn("Skipping invalid annotation object:", ann);
          return;
        }
        // Ensure timestamp is a Date object for the constructor
        const annotationTimestamp = ann.timestamp ? new Date(ann.timestamp) : new Date();
        let annotationInstance;

        switch (ann.type) {
          case "Bug":
            annotationInstance = new Bug(ann.name, ann.url, annotationTimestamp, ann.imageURL);
            break;
          case "Idea":
            annotationInstance = new Idea(ann.name, ann.url, annotationTimestamp, ann.imageURL);
            break;
          case "Note":
            annotationInstance = new Note(ann.name, ann.url, annotationTimestamp, ann.imageURL);
            break;
          case "Question":
            annotationInstance = new Question(ann.name, ann.url, annotationTimestamp, ann.imageURL);
            break;
          default:
            console.warn(`Unknown annotation type: ${ann.type}`, ann);
            // Optionally, create a generic Annotation or skip
            return; // Skip unknown types
        }
        session.annotations.push(annotationInstance);
      });
    }
    return session;
  }
}