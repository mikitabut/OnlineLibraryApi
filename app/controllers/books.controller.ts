// Import only what we need from express
import { Router, Request, Response } from 'express';
import { SourceDB } from '../db';

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
    const book = req.body;

    SourceDB.insertNewBook(book)
        .then(() =>
            SourceDB.getAllBooks()
                .then(entities => {
                    res.append('Access-Control-Allow-Origin', '*');
                    res.append('Access-Control-Allow-Headers', 'Content-Type');
                    res.status(200).send({ data: entities });
                })
                .catch(error => res.status(500).send({ error })),
        )
        .catch(error => res.status(500).send({ error }));
});
router.options('/*', (req: Request, res: Response) => {
    SourceDB.getAllBooks().then(entities => {
        res.append('Access-Control-Allow-Origin', '*');
        res.append('Access-Control-Allow-Headers', 'Content-Type');
        res.status(200).send();
    });
});

// Export the express.Router() instance to be used by server.ts
export const BooksController: Router = router;
