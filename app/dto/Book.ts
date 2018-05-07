import { EMPTY } from './constants';

export class Book {
    public name: string;
    public author: Author;
    public simplePart: string;

    constructor({ name, author, description }) {
        this.name = name;
        this.author = author || new Author(EMPTY);
        this.simplePart = description || EMPTY;
    }
}

export class Author {
    public name: string;
    constructor(name: string) {
        this.name = name;
    }
}
