// Import only what we need from express
import { Router, Request, Response } from 'express';
import { SourceDB } from '../db';
import { setXhrHeader, JwtGenerator } from '../common';
import * as bcrypt from 'bcrypt';
import * as bodyParser from 'body-parser';

// Assign router to the express.Router() instance
const router: Router = Router();

router.use(bodyParser.json());
router.post('/', (req: Request, res: Response) => {
    setXhrHeader(res);
    // get parameters from post request
    let params = req.body;
    SourceDB.findUserByName(params.username)
        .then(users => {
            if (users.length === 0) {
                return Promise.reject({ status: 500, statusText: 'This user is not exist' });
            }
            return Promise.resolve(users.pop());
        })
        .then(user => {
            return bcrypt.compare(params.password, user.password);
        })
        .then(result => {
            if (!result) {
                return Promise.reject({ status: 500, statusText: 'Invalid password' });
            }
            return JwtGenerator.getRandomToken(params.username) as any;
        })
        .then(jwt => {
            return Promise.all([jwt, SourceDB.insertSessionJwt(jwt)]);
        })
        .then(([jwt]) => res.status(200).send({ data: { jwtToken: jwt.token } }))
        .catch(error => {
            res.status(500).send({ data: error });
        });
});
router.post('/reg', (req: Request, res: Response) => {
    setXhrHeader(res);
    // get parameters from post request
    let params = req.body;
    SourceDB.findUserByName(params.username)
        .then(users => {
            if (users.length !== 0) {
                return Promise.reject({ status: 500, statusText: 'This user exist!' });
            }
            return Promise.resolve(users.pop());
        })
        .then(user => {
            return bcrypt.hash(params.password, 4);
        })
        .then(password => {
            return SourceDB.insertNewUser({ username: params.username, password, booksIds: [] });
        })
        .then(() => {
            return JwtGenerator.getRandomToken(params.username);
        })
        .then(jwt => {
            return Promise.all([jwt, SourceDB.insertSessionJwt(jwt)]);
        })
        .then(([jwt]) => res.status(200).send({ data: { jwtToken: jwt.token } }))
        .catch(error => {
            return res.status(error.status).send({ data: error.statusText });
        });
});

router.options('/*', (req: Request, res: Response) => {
    setXhrHeader(res);
    res.status(200).send();
});

// Export the express.Router() instance to be used by server.ts
export const LoginController: Router = router;
