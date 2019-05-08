// Import only what we need from express
import { Router, Request, Response } from 'express';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';
import * as bodyParser from 'body-parser';
import * as busboy from 'connect-busboy';

import { SourceDB } from '../db';
import { protectRoute } from '../common';

// Assign router to the express.Router() instance
const router: Router = Router();

// Need to implement not logged recommended books
router.get('/recommended', bodyParser.json(), async (req: Request, res: Response) => {
    try {
        const user = req['user'];
        const { best20VkWords } = user;
        const resultRecommendedBooks = [] as any[];

        while (best20VkWords.length) {
            const recommendedBooks = await SourceDB.searchStartBook(best20VkWords.pop());
            if (recommendedBooks.length) {
                resultRecommendedBooks.push(...recommendedBooks);
            }
        }
        return res.status(200).send(resultRecommendedBooks.slice(0, 20));
    } catch (error) {
        res.status(error.status || 500).send({ data: error.statusText });
    }
});
//all books
router.get('/', async (req: Request, res: Response) => {
    try {
        const books = await SourceDB.getAllBooks();
        res.status(200).send(books);
    } catch (error) {
        res.status(error.status || 500).send({ data: error.statusText });
    }
});
router.post('/add', protectRoute, busboy({ immediate: true }), (req: Request, res: Response) => {
    const book: any = {};
    const user = req['user'];
    req['busboy'].on('file', async function(fieldname, file, filename: string) {
        try {
            var saveTo = path.join(
                os.homedir(),
                path.basename(new Date().getTime().toString()) + filename.slice(filename.lastIndexOf('.')),
            );
            file.pipe(fs.createWriteStream(saveTo));
            book.filepath = saveTo;

            if (book.filepath && book.name && book.authorName && book.description) {
                await SourceDB.insertNewBook(book, user.username);
                const books = await SourceDB.getAllBooks();
                res.status(200).send(books);
            }
        } catch (error) {
            return res.status(error.status || 500).send({ data: error.statusText });
        }
    });
    req['busboy'].on('field', async function(key, value) {
        try {
            book[key] = value;
            if (book.filepath && book.name && book.authorName && book.description) {
                await SourceDB.insertNewBook(book, user.username);
                const books = await SourceDB.getAllBooks();
                res.status(200).send(books);
            }
        } catch (error) {
            return res.status(error.status || 500).send({ data: error.statusText });
        }
    });
});
//getting user managed books
router.get('/user', protectRoute, async(req: Request, res: Response) => {
    try {
        const user = req['user'];

        const managedBooks = await SourceDB.getBooksByNames(user.booksIds);
        res.status(200).send(managedBooks);
    } catch (error) {
        res.status(error.status || 500).send({ data: error.statusText });
    }
});
//get book by name
router.get('/:name', async (req: Request, res: Response) => {
    try {
        const books = await SourceDB.getBookByName(req.params.name);
        res.status(200).send(books);
    } catch (error) {
        res.status(error.status || 500).send({ data: error.statusText });
    }
});
//update book by name
router.post('/:name', protectRoute, busboy({ immediate: true }), (req: Request, res: Response) => {
    const user = req['user'];
    const book: any = {};
    req['busboy'].on('field', async function(key, value) {
        try {
            book[key] = value;
            if (book.id && book.name && book.authorName && book.description) {
                await SourceDB.updateBook(book.id, book);
                res.status(200).send(book);
            }
        } catch (error) {
            return res.status(error.status || 500).send({ data: error.statusText });
        }
    });
});
router.get('/searchFullWord/:searchphrase', async (req: Request, res: Response) => {
    try {
        const books = await SourceDB.searchFullBook(req.params.searchphrase);
        res.status(200).send(books);
    } catch (error) {
        res.status(error.status || 500).send({ data: error.statusText });
    }
});
router.get('/searchStartWord/:searchphrase', async (req: Request, res: Response) => {
    try {
        const books = await SourceDB.searchStartBook(req.params.searchphrase);
        res.status(200).send(books);
    } catch (error) {
        res.status(error.status || 500).send({ data: error.statusText });
    }
});

export const BooksController: Router = router;
