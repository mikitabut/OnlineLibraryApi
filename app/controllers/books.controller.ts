// Import only what we need from express
import { Router, Request, Response } from 'express';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';
import * as bodyParser from 'body-parser';
import * as moment from 'moment';
import * as busboy from 'connect-busboy';

import { SourceDB } from '../db';
import { setXhrHeader } from '../common';
import { Jwt } from '../common/jwtGenerator';
import { Book } from '../dto/Book';

// Assign router to the express.Router() instance
const router: Router = Router();

// The / here corresponds to the route that the WelcomeController
// is mounted on in the server.ts file.
// In this case it's /welcome
router.post('/recommended', bodyParser.json(), (req: Request, res: Response) => {
    let params = req.body;
    SourceDB.findUserByName(params.username)
        .then(users => {
            if (users.length === 0) {
                return Promise.reject({ status: 500, statusText: 'This user is not exist' });
            }
            return Promise.resolve(users.pop());
        })
        .then(async user => {
            const {best20VkWords} = user;
            const resultRecommendedBooks = [] as any[];

            while(best20VkWords.length) {
                const recommendedBooks = await SourceDB.searchStartBook(best20VkWords.pop());
                if(recommendedBooks.length) {
                    resultRecommendedBooks.push(...recommendedBooks);
                }
            }
            return res.status(200).send({ books: resultRecommendedBooks})
        })
        .catch(error => {
            res.status(500).send({ data: error });
        });
});
router.use(busboy({ immediate: true }));
//all books
router.get('/', (req: Request, res: Response) => {
    setXhrHeader(req, res);

    return SourceDB.getAllBooks()
        .then(entities => {
            res.status(200).send({ data: entities });
        })
        .catch(error => res.status(error.status).send({ data: error.statusText }));
});
router.post('/add', (req: Request, res: Response) => {
    setXhrHeader(req, res);
    const jwt = {} as Jwt;
    updateJwtToken(req).catch(error => {
        return res.status(error.status).send({ data: error.statusText });
    });
    const book: any = {};
    req['busboy'].on('file', function(fieldname, file, filename: string, encoding, mimetype) {
        var saveTo = path.join(
            os.homedir(),
            path.basename(new Date().getTime().toString()) + filename.slice(filename.lastIndexOf('.')),
        );
        file.pipe(fs.createWriteStream(saveTo));
        book.filepath = saveTo;
        if (book.filepath && book.name && book.authorName && book.description) {
            updateJwtToken(req, jwt as Jwt)
                .then((jwtToken: any) =>
                    SourceDB.insertNewBook(book, jwt.name!).then(() =>
                        SourceDB.getAllBooks().then(entities => {
                            return res.status(200).send({ data: entities });
                        }),
                    ),
                )
                .catch(error => {
                    return res.status(error.status).send({ data: error.statusText });
                });
        }
    });
    req['busboy'].on('field', function(key, value, keyTruncated, valueTruncated) {
        book[key] = value;
        if (book.filepath && book.name && book.authorName && book.description) {
            updateJwtToken(req, jwt)
                .then(jwtToken =>
                    SourceDB.insertNewBook(book, jwt.name!).then(() =>
                        SourceDB.getAllBooks().then(entities => {
                            return res.status(200).send({ data: entities });
                        }),
                    ),
                )
                .catch(error => {
                    return res.status(error.status).send({ data: error.statusText });
                });
        }
    });
});
//get book by name
router.get('/:name', (req: Request, res: Response) => {
    setXhrHeader(req, res);

    return SourceDB.getBookByName(req.params.name)
        .then(entities => {
            res.status(200).send({ data: entities });
        })
        .catch(error => res.status(error.status).send({ data: error.statusText }));
});
//update book by name
router.post('/:name', (req: Request, res: Response) => {
    setXhrHeader(req, res);
    const jwt = {} as Jwt;
    updateJwtToken(req).catch(error => {
        return res.status(error.status).send({ data: error.statusText });
    });
    const book: any = {};
    req['busboy'].on('field', function(key, value, keyTruncated, valueTruncated) {
        book[key] = value;
        if (book.name && book.authorName && book.description) {
            updateJwtToken(req, jwt)
                .then(jwtToken =>
                    SourceDB.updateBook(
                        book.id,
                        new Book({ name: book.name, authorName: book.authorName, description: book.description }),
                    ).then(() =>
                        SourceDB.getBookById(book.id).then(entities => {
                            return res.status(200).send({ data: entities });
                        }),
                    ),
                )
                .catch(error => {
                    return res.status(error.status).send({ data: error.statusText });
                });
        }
    });
});
router.get('/searchFullWord/:searchphrase', (req: Request, res: Response) => {
    setXhrHeader(req, res);

    return SourceDB.searchFullBook(req.params.searchphrase)
        .then(entities => {
            res.status(200).send({ data: entities });
        })
        .catch(error => res.status(error.status).send({ data: error.statusText }));
});
router.get('/searchStartWord/:searchphrase', (req: Request, res: Response) => {
    setXhrHeader(req, res);

    return SourceDB.searchStartBook(req.params.searchphrase)
        .then(entities => {
            res.status(200).send({ data: entities });
        })
        .catch(error => res.status(error.status).send({ data: error.statusText }));
});
router.get('/searchFullWord/', (req: Request, res: Response) => {
    setXhrHeader(req, res);

    return SourceDB.getAllBooks()
        .then(entities => {
            res.status(200).send({ data: entities });
        })
        .catch(error => res.status(error.status).send({ data: error.statusText }));
});
router.get('/searchStartWord/', (req: Request, res: Response) => {
    setXhrHeader(req, res);

    return SourceDB.getAllBooks()
        .then(entities => {
            res.status(200).send({ data: entities });
        })
        .catch(error => res.status(error.status).send({ data: error.statusText }));
});

//getting user by username
router.get('/user/:username', (req: Request, res: Response) => {
    setXhrHeader(req, res);

    if (req.headers.authorization) {
    }
    updateJwtToken(req, {} as Jwt, req.params.username)
        .then(username => SourceDB.findUserByName(req.params.username))
        .then(entities => {
            const user = entities.pop();
            if (!user) {
                return Promise.reject({ status: 404, statusText: 'This user is not found' });
            }
            return Promise.resolve(user);
        })
        .then(user => {
            return SourceDB.getBooksByNames(user.booksIds);
        })
        .then(userBooks => {
            res.status(200).send({ data: { userBooks } });
        })
        .catch(error => res.status(error.status).send({ data: error.statusText }));
});

export function updateJwtToken(req: Request, jwtExch?: Jwt, username?: string) {
    let token;
    if (req.headers['authorization']) {
        token = req.headers['authorization'];
    }
    if (!token) {
        return Promise.reject({ status: 401, statusText: 'Not authorized' });
    } else {
        return SourceDB.getSessionJwtByToken(token)
            .then(jwt => {
                if (jwt && jwt.length > 0) {
                    const jwtToken = jwt.pop()!;
                    const currMils = moment().valueOf();
                    if (
                        currMils - parseInt(jwtToken.time!, 10) <= 600000 &&
                        (username === undefined || username === jwtToken.name)
                    ) {
                        return SourceDB.updateSessionJwt({
                            token: jwtToken.token,
                            name: jwtToken.name,
                            time: currMils.toString(),
                        })
                            .then(() => {
                                if (jwtExch) {
                                    jwtExch.name = jwtToken.name;
                                    jwtExch.token = jwtToken.token;
                                }
                                return Promise.resolve();
                            })
                            .catch(error => {
                                return Promise.reject({ status: 401, statusText: 'Not authorized' });
                            });
                    } else {
                        return Promise.reject({ status: 401, statusText: 'Not authorized' });
                    }
                } else {
                    return Promise.reject({ status: 401, statusText: 'Not authorized' });
                }
            })
            .catch(() => Promise.reject({ status: 401, statusText: 'Not authorized' }));
    }
}
router.options('/*', (req: Request, res: Response) => {
    setXhrHeader(req, res);

    res.append('Access-Control-Allow-Headers', 'enctype');
    res.status(200).send({});
});

// Export the express.Router() instance to be used by server.ts
export const BooksController: Router = router;
