import { Bug, Note, Idea, Question } from './Annotation.js';
import { Session } from './Session.js';

export class JSonSessionService {
    getJSon(session) {
        return JSON.stringify(session);
    }

    getSession(jsonString) {
        const object = JSON.parse(jsonString);
        // Delegate the actual object construction to the static method in Session
        return Session.fromPlainObject(object);
    }

    // getAnnotaionFromType method is no longer needed as its logic
    // is now centralized in Session.fromPlainObject.
}