import { MongoDB } from './Mongo';
import { Book } from '../dto/Book';

class SourceDatabase {
    public getAllBooks() {
        return MongoDB.getBooksDb()
            .collection('books')
            .find()
            .toArray();
    }

    public getBookByName(name: string) {
        return MongoDB.getBooksDb()
            .collection('books')
            .find({ 'book.name': name })
            .toArray();
    }

    public insertNewBook(insertedBook: Book) {
        return this.getBookByName(insertedBook.name)
            .then(book => {
                if (book.length > 0) {
                    return Promise.reject('Inserting book exist');
                }
            })
            .then(() => {
                if (!insertedBook) {
                    return Promise.reject('Inserting book is not valid');
                }
            })
            .then(() => {
                return MongoDB.getBooksDb()
                    .collection('books')
                    .insertOne({ book: insertedBook });
            });
    }
}

export const SourceDB = new SourceDatabase();
