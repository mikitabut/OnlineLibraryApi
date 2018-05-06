import { MongoDB } from './Mongo';
import { Book } from '../dto/Book';

class SourceDatabase {
    public getAllBooks() {
        return MongoDB.getBooksCollection()
            .collection('books')
            .find()
            .toArray();
    }
    public insertNewBook(book: Book) {
        return MongoDB.getBooksCollection()
            .collection('books')
            .insertOne({ book });
    }
}

export const SourceDB = new SourceDatabase();
