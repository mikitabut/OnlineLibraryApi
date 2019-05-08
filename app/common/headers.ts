import { Response } from 'express';
export function setXhrHeader(req, res: Response) {
    // res.append('Access-Control-Allow-Origin', '*');
    res.append('Access-Control-Allow-Headers', '*');
    return res;
}
export function setXhrHeaderMiddleWare() {
    return (req, res, next) => {
        res = setXhrHeader(req, res);
        next();
    }
}
