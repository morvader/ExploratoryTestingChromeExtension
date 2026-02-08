import { Session } from '../../src/Session.js';
import { Bug, Note, Idea, Question } from '../../src/Annotation.js';

/**
 * Loads and reconstructs the session from the Chrome extension background.
 * @returns {Promise<Session|null>} The reconstructed session or null if no data.
 */
export async function loadSessionData() {
    const response = await chrome.runtime.sendMessage({ type: "getSessionData" });
    if (!response || response.annotationsCount === 0) {
        return null;
    }

    const sessionData = await chrome.runtime.sendMessage({ type: "getFullSession" });
    if (!sessionData) {
        throw new Error('Could not get full session data');
    }

    const session = new Session(sessionData.startDateTime, sessionData.browserInfo);

    const annotationConstructors = { Bug, Note, Idea, Question };
    const addMethods = { Bug: 'addBug', Note: 'addNote', Idea: 'addIdea', Question: 'addQuestion' };

    sessionData.annotations.forEach(annotation => {
        const Constructor = annotationConstructors[annotation.type];
        if (Constructor) {
            const newAnnotation = new Constructor(
                annotation.name, annotation.url, annotation.timestamp, annotation.imageURL
            );
            session[addMethods[annotation.type]](newAnnotation);
        }
    });

    return session;
}

/**
 * Deletes an annotation via the Chrome extension background.
 * @param {number} annotationID - Index of the annotation to delete.
 * @returns {Promise<object>} The response from the background script.
 */
export function deleteAnnotation(annotationID) {
    return new Promise((resolve) => {
        chrome.runtime.sendMessage(
            { type: "deleteAnnotation", annotationID },
            resolve
        );
    });
}

/**
 * Serializes session data for embedding in the downloaded report.
 * @param {Session} session
 * @returns {object}
 */
export function serializeSession(session) {
    return {
        startDateTime: session.getStartDateTime(),
        browserInfo: session.getBrowserInfo(),
        annotations: session.getAnnotations().map(a => ({
            type: a.constructor.name,
            name: a.name,
            url: a.url,
            timestamp: a.timestamp,
            imageURL: a.imageURL
        }))
    };
}
