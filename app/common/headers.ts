import { Response } from 'express';
export function setXhrHeader(res: Response) {
    res.append('Access-Control-Allow-Origin', '*');
    res.append('Access-Control-Allow-Headers', '*');
}
