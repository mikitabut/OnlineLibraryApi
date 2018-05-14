import { EMPTY } from './constants';

export class Book {
    public name: string;
    public authorName: string;
    public simplePart: string;

    constructor({ name, authorName, description }) {
        this.name = name;
        this.authorName = authorName;
        this.simplePart = description || EMPTY;
    }
}
