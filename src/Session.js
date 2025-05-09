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
}