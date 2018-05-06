"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Mongo_1 = require("./Mongo");
class SourceDatabase {
    getAllBooks() {
        return Mongo_1.MongoDB.getBooksCollection()
            .collection('books')
            .find()
            .toArray();
    }
    insertNewBook(book) {
        return Mongo_1.MongoDB.getBooksCollection()
            .collection('books')
            .insertOne({ book });
    }
}
exports.SourceDB = new SourceDatabase();
//# sourceMappingURL=SourceDatabase.js.map