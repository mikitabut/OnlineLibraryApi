import { MongoDB } from './Mongo';
import { Book } from '../dto/Book';
import { User } from '../dto/User';
import { Jwt } from '../common/jwtGenerator';
import { ObjectID } from 'bson';

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
    public getBookById(id: string) {
        return MongoDB.getBooksDb()
            .collection('books')
            .find({ _id: ObjectID.createFromHexString(id) })
            .toArray();
    }
    public getBooksByNames(names: string[]) {
        return MongoDB.getBooksDb()
            .collection('books')
            .find({ 'book.name': { $in: names } })
            .toArray();
    }
    public searchFullBook(phrase: string) {
        return MongoDB.getBooksDb()
            .collection('books')
            .find({ $text: { $search: phrase } }, { projection: { score: { $meta: 'textScore' } } })
            .toArray();
    }
    public searchStartBook(phrase: string) {
        return MongoDB.getBooksDb()
            .collection('books')
            .find({
                $or: [
                    { 'book.name': { $regex: phrase, $options: 'i' } },
                    { 'book.authorName': { $regex: phrase, $options: 'i' } },
                    { 'book.description': { $regex: phrase, $options: 'i' } },
                ],
            })
            .toArray();
    }

    public insertNewBook(insertedBook: Book, username: string) {
        return this.getBookByName(insertedBook.name)
            .then(book => {
                if (book.length > 0) {
                    return Promise.reject({ status: 500, statusText: 'Inserting book exist' });
                }
            })
            .then(() => {
                if (!insertedBook) {
                    return Promise.reject({ status: 500, statusText: 'Inserting book is not valid' });
                }
            })
            .then(() => {
                return MongoDB.getBooksDb()
                    .collection('books')
                    .insertOne({ book: insertedBook })
                    .then(() => this.updateUser(username, insertedBook));
            });
    }
    public updateBook(id: string, insertedBook: Book) {
        return this.getBookById(id)
            .then(book => {
                if (book.length === 0) {
                    return Promise.reject({ status: 500, statusText: 'Updating book not exist' });
                }
            })
            .then(() => {
                return this.getBookByName(insertedBook.name);
            })
            .then(values => {
                if (values.length !== 0) {
                    const currentId = values.pop()._id;
                    if (currentId.toString() !== id)
                        return Promise.reject({ status: 500, statusText: 'New name should be unique' });
                }
            })
            .then(() => {
                return MongoDB.getBooksDb()
                    .collection('books')
                    .updateOne(
                        { _id: ObjectID.createFromHexString(id) },
                        {
                            $set: {
                                'book.name': insertedBook.name,
                                'book.authorName': insertedBook.authorName,
                                'book.description': insertedBook.simplePart,
                            },
                        },
                    );
            });
    }
    public insertNewUser(user: User) {
        return this.findUserByName(user.username)
            .then(user => {
                if (user.length > 0) {
                    return Promise.reject({ status: 500, statusText: 'Inserting user exist' });
                }
            })
            .then(() => {
                return MongoDB.getBooksDb()
                    .collection('users')
                    .insertOne({ ...user });
            });
    }
    public updateUser(username, book) {
        return this.findUserByName(username)
            .then(user => {
                if (user.length === 0) {
                    return Promise.reject({
                        status: 500,
                        statusText: 'Something wrong. Your authorized account is not exist',
                    });
                }
                return Promise.resolve(user.pop());
            })
            .then(user => {
                const booksIds = user.booksIds as string[];
                booksIds.push(book.name);
                return MongoDB.getBooksDb()
                    .collection('users')
                    .updateOne({ username }, { $set: { booksIds } });
            });
    }

    public getUserByNameAndPassword(name: string, password: string) {
        return MongoDB.getBooksDb()
            .collection('users')
            .find({ username: name, password: password })
            .toArray();
    }
    public findUserByName(name: string) {
        return MongoDB.getBooksDb()
            .collection('users')
            .find({ username: name })
            .toArray();
    }

    public insertSessionJwt(jwt: Jwt) {
        return MongoDB.getBooksDb()
            .collection('jwt')
            .insertOne({ ...jwt });
    }
    public updateSessionJwt(jwt: Jwt) {
        return MongoDB.getBooksDb()
            .collection('jwt')
            .updateOne({ token: jwt.token }, { $set: jwt }, { upsert: true })
            .then(() => Promise.resolve({} as Jwt[]));
    }

    public getSessionJwtByToken(jwtToken: string): Promise<Jwt[] | void> {
        return MongoDB.getBooksDb()
            .collection('jwt')
            .find({ token: jwtToken })
            .toArray();
    }

    public updateUserVkId(username:string, userId: string) {
        return this.findUserByName(username)
            .then(user => {
                if (user.length === 0) {
                    return Promise.reject({
                        status: 500,
                        statusText: 'Something wrong. Your authorized account is not exist',
                    });
                }
                return Promise.resolve(user.pop());
            })
            .then(() => {
                return MongoDB.getBooksDb()
                    .collection('users')
                    .updateOne({ username }, { $set: { userVkId: userId } });
            });
    }
}

export const SourceDB = new SourceDatabase();
