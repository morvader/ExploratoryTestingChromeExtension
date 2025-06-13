import { Bug, Note, Idea, Question } from './Annotation.js';
import { getSystemInfo } from './browserInfo.js';

export class Session {
  constructor(dateTime, browserInfo) {
    // Check if provided browserInfo is sufficiently complete
    if (browserInfo && typeof browserInfo.browser === 'string' && browserInfo.browser !== '' &&
        typeof browserInfo.browserVersion === 'string' && browserInfo.browserVersion !== '' &&
        typeof browserInfo.os === 'string' && browserInfo.os !== '') {
        this.BrowserInfo = browserInfo;
    } else {
        // If browserInfo is missing, null, undefined, or incomplete, get current system info
        this.BrowserInfo = getSystemInfo();
    }
    this.StartDateTime = dateTime || Date.now(); // Provide a fallback for dateTime
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