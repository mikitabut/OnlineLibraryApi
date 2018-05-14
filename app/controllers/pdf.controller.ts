// Import only what we need from express
import { Router, Request, Response } from 'express';
import { SourceDB } from '../db';
import * as fs from 'fs';
import * as bodyParser from 'body-parser';
import { setXhrHeader } from '../common';

// Assign router to the express.Router() instance
const router: Router = Router();

// The / here corresponds to the route that the WelcomeController
// is mounted on in the server.ts file.
// In this case it's /welcome

router.use(bodyParser.json());

//all books

router.get('/:id', (req: Request, res: Response) => {
    setXhrHeader(res);
    let params = req.params;
    SourceDB.getBookById(params.id)
        .then(values => {
            if (values.length === 0) {
                return Promise.reject({ status: 500, statusText: 'This book not exist' });
            }
            return values.pop();
        })
        .then(value => {
            var readStream = fs.createReadStream(value.book.filepath);
            // We replaced all the event handlers with a simple call to readStream.pipe()
            readStream.pipe(res);
        })
        .catch(error => {
            return res.status(error.status).send({ data: error.statusText });
        });
    // req['busboy'].on('field', function(key, value, keyTruncated, valueTruncated) {
    //     book[key] = value;
    //     if (book.name && book.authorName && book.description) {
    //         updateJwtToken(req, jwt)
    //             .then(jwtToken =>
    //                 SourceDB.updateBook(
    //                     book.id,
    //                     new Book({ name: book.name, authorName: book.authorName, description: book.description }),
    //                 ).then(() =>
    //                     SourceDB.getBookById(book.id).then(entities => {
    //                         return res.status(200).send({ data: entities });
    //                     }),
    //                 ),
    //             )
    //             .catch(error => {
    //                 return res.status(error.status).send({ data: error.statusText });
    //             });
    //     }
    // });
});

router.options('/*', (req: Request, res: Response) => {
    setXhrHeader(res);

    res.append('Access-Control-Allow-Headers', 'enctype');
    res.status(200).send({});
});

// Export the express.Router() instance to be used by server.ts
export const PdfController: Router = router;
