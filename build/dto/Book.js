"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const constants_1 = require("./constants");
class Book {
    constructor({ id, name, author, description }) {
        this.id = id;
        this.name = name;
        this.author = author || new Author(constants_1.EMPTY);
        this.simplePart = description || constants_1.EMPTY;
    }
}
exports.Book = Book;
class Author {
    constructor(name) {
        this.name = name;
    }
}
exports.Author = Author;
//# sourceMappingURL=Book.js.map