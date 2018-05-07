// Import only what we need from express
import { Router, Request, Response } from 'express';
import { SourceDB } from '../db';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';

// Assign router to the express.Router() instance
const router: Router = Router();

// The / here corresponds to the route that the WelcomeController
// is mounted on in the server.ts file.
// In this case it's /welcome
router.get('/', (req: Request, res: Response) => {
    return SourceDB.getAllBooks()
        .then(entities => {
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.status(200).send({ data: entities });
        })
        .catch(error => res.status(500).send({ error }));
});

router.post('/add', (req: Request, res: Response) => {
    const book: any = {};
    //formData.append('uploadFile', book.file, book.file.name);
    // formData.append('name', book.name);
    // formData.append('authorName', book.author.name);
    // formData.append('description', book.description);
    req['busboy'].on('file', function(fieldname, file, filename, encoding, mimetype) {
        var saveTo = path.join(os.homedir(), path.basename(fieldname));
        file.pipe(fs.createWriteStream(saveTo));
        book.filepath = saveTo;
    });
    req['busboy'].on('field', function(key, value, keyTruncated, valueTruncated) {
        book[key] = value;
        if (book.filepath && book.name && book.authorName && book.description) {
            SourceDB.insertNewBook(book)
                .then(() =>
                    SourceDB.getAllBooks()
                        .then(entities => {
                            res.append('Access-Control-Allow-Origin', '*');

                            res.status(200).send({ data: entities });
                        })
                        .catch(error => {
                            res.append('Access-Control-Allow-Origin', '*');

                            return res.status(500).send(error);
                        }),
                )
                .catch(error => {
                    res.append('Access-Control-Allow-Origin', '*');

                    return res.status(500).send({ data: error });
                });
        }
    });
});
router.options('/*', (req: Request, res: Response) => {
    SourceDB.getAllBooks().then(entities => {
        res.append('Access-Control-Allow-Origin', '*');
        res.append('Access-Control-Allow-Headers', 'enctype');
        res.status(200).send();
    });
});

// Export the express.Router() instance to be used by server.ts
export const BooksController: Router = router;
