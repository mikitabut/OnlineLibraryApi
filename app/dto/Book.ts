import { EMPTY } from './constants';

export class Book {
    public id: number;
    public name: string;
    public author: Author;
    public simplePart: string;

    constructor({ id, name, author, description }) {
        this.id = id;
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
