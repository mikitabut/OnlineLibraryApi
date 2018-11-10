// Import only what we need from express
import { Router, Request, Response } from 'express';
import { setXhrHeader } from '../common';
import * as bodyParser from 'body-parser';
import * as serpentService from '../common/SerpentService';
import { BitNumber } from '../common/BitNumber';

// Assign router to the express.Router() instance
const router: Router = Router();

// The / here corresponds to the route that the WelcomeController
// is mounted on in the server.ts file.
// In this case it's /welcome

router.use(bodyParser.json());

router.get('/public-key', (req: Request, res: Response) => {
    setXhrHeader(res);

    const tests = BitNumber.tests();

    const someKey = '0101010010101010110100101010010101001010101001010101001010101001010101011010010101001010100101010100101010100101010100101010101101001010100101010010101010010101010010101010010101010110100101010010101001010101001010101001001010100101010100101010100100100101'
        .split('')
        .map(value => parseInt(value, 10));
    const someText = '10100100001001010100001001010100110100101101111100101010000101011010010000100101010000100101010011010010110111110010101000010101'
        .split('')
        .map(value => (parseInt(value, 10) as any));
    const text = new BitNumber(128);
    const key = new BitNumber(256);
    text.setBitPart(0, someText as (0 | 1)[]);
    key.setBitPart(0, someKey as (0 | 1)[]);

    const serpServ = new serpentService.SerpentService();

    const startText = someText;
    const chifratedText = serpServ.chipherText(text, key);
    const deshifratedText = serpServ.chipherTextInv(chifratedText, key);

    const linear = serpServ.effectiveSerpent(text);


    res.status(200).send({ text, chifratedText, deshifratedText, linear });
});

router.options('/*', (req: Request, res: Response) => {
    setXhrHeader(res);

    res.append('Access-Control-Allow-Headers', 'enctype');
    res.status(200).send({});
});

// Export the express.Router() instance to be used by server.ts
export const CipherController: Router = router;
