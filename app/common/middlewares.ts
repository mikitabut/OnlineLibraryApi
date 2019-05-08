import * as jwt from 'jsonwebtoken';
import { key } from '../common';
import { SourceDB } from '../db';
import { Response, Request } from 'express';

export function protectRoute(req, res, next) {
    // if user exists the token was sent with the request
    if (req['user']) {
        //if user exists then go to next middleware
        next();
    }
    // token was not sent with request send error to user
    else {
        res.status(403).json({ error: 'Login is required' });
    }
}

export function checkJwt(req: Request, res: Response, next) {
    try {
        const token = req.headers['x-jwt'];
        jwt.verify(token, key, function(err, payload) {
            if (payload && token) {
                SourceDB.findUserByName(payload.username).then(docs => {
                    if (docs.length !== 0) {
                        req['user'] = docs.pop();
                        req['user'].password = undefined;
                        res.setHeader('x-jwt', token);
                    } else {
                        res.setHeader('x-jwt', '');
                    }
                    next();
                });
            } else {
                res.setHeader('x-jwt', '');
                next();
            }
        });
    } catch (e) {
        next();
    }
}
