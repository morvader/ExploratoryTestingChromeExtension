// Clase base para anotaciones
export class Annotation {
    constructor(name, url, timestamp, imageURL) {
        this.type = "";
        this.name = name;
        this.URL = url;
        this.timeStamp = timestamp;
        this.imageURL = imageURL;
    }

    getName() {
        return this.name;
    }

    setName(newName) {
        this.name = newName;
    }

    getURL() {
        return this.URL;
    }

    getTimeStamp() {
        return new Date(this.timeStamp);
    }

    setImageURL(imageURL) {
        this.imageURL = imageURL;
    }

    getImageURL() {
        return this.imageURL;
    }
}

// Clase Bug
export class Bug extends Annotation {
    constructor(name, url, timestamp, imageURL) {
        super(name, url, timestamp, imageURL);
        this.type = this.getType();
    }

    getType() {
        return "Bug";
    }
}

// Clase Idea
export class Idea extends Annotation {
    constructor(name, url, timestamp, imageURL) {
        super(name, url, timestamp, imageURL);
        this.type = this.getType();
    }

    getType() {
        return "Idea";
    }
}

// Clase Note
export class Note extends Annotation {
    constructor(name, url, timestamp, imageURL) {
        super(name, url, timestamp, imageURL);
        this.type = this.getType();
    }

    getType() {
        return "Note";
    }
}

// Clase Question
export class Question extends Annotation {
    constructor(name, url, timestamp, imageURL) {
        super(name, url, timestamp, imageURL);
        this.type = this.getType();
    }

    getType() {
        return "Question";
    }
}

