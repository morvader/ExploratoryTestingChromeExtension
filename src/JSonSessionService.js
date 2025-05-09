import { Bug, Note, Idea, Question } from './Annotation.js';
import { Session } from './Session.js';

export class JSonSessionService {
    getJSon(session) {
        return JSON.stringify(session);
    }

    getSession(jsonString) {
        const object = JSON.parse(jsonString);
        const annotations = [];

        const tempAnnotations = object.annotations;
        if (tempAnnotations.length != 0) {
            for (let i = 0; i < tempAnnotations.length; i++) {
                const ann = tempAnnotations[i];
                annotations.push(this.getAnnotaionFromType(ann));
            }
        }
        const sessionDate = new Date(object.StartDateTime);
        const session = new Session(sessionDate, object.BrowserInfo);
        session.setAnnotations(annotations);
        return session;
    }

    getAnnotaionFromType(annotation) {
        const name = annotation.name;
        const url = annotation.url;
        const timestamp = new Date(annotation.timestamp);
        const image = annotation.imageURL;

        if (annotation.type == "Bug") return new Bug(name, url, timestamp, image);
        if (annotation.type == "Note") return new Note(name, url, timestamp, image);
        if (annotation.type == "Idea") return new Idea(name, url, timestamp, image);
        if (annotation.type == "Question") return new Question(name, url, timestamp, image);
    }
}