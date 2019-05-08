// Import only what we need from express
import { Router, Request, Response } from 'express';
import * as bcrypt from 'bcrypt';
import * as bodyParser from 'body-parser';
import * as jwt from 'jsonwebtoken';

const Queue = require('bee-queue');
const axios = require('axios');
var nlp = require('compromise');

import { SourceDB } from '../db';
import {
    vkApiStartString,
    vkApiServiceKey,
    vkApiVersion,
    key,
    protectRoute,
    appSite,
} from '../common';

// Assign router to the express.Router() instance
const router: Router = Router();
router.use(bodyParser.json());

function processVkWordsData(userVkWords) {
    let result = {};

    Object.keys(userVkWords)
        .filter(key => {
            if (key === 'postsCount') {
                return false;
            }
            const resCount = userVkWords[key].reduce((prevVal, curVal) => prevVal + curVal.count, 0);
            return resCount > 2;
        })
        .map(key => {
            const concArr = userVkWords[key];
            const idf = Math.log10(userVkWords.postsCount / concArr.length);
            const tfidfFullWeight = concArr.reduce((prevValue, currentValue) => {
                return prevValue + (currentValue.count / currentValue.postWordsCount) * idf;
            }, 0);
            result = {
                ...result,
                [key]: tfidfFullWeight,
            };
        });
    const sortedWeights = Object.keys(result).sort((a, b) => {
        return result[b] - result[a];
    });

    return sortedWeights.slice(0, 20);
}

const AnalyzeTextQueue = new Queue('analyzeTextQueue');

// Process jobs from as many servers or processes as you like
AnalyzeTextQueue.process(async job => {
    const users = await SourceDB.findUserByName(job.data.username);
    if (users.length === 0) {
        const errorMessage = 'User is not exist for this username: ' + job.data.username;
        console.log(errorMessage);
        throw new Error(errorMessage);
    }

    const user = users.pop();

    const wallData = await axios.get(
        vkApiStartString +
            'wall.get' +
            '?owner_id=' +
            user.userVkId +
            '&count=100' +
            '&access_token=' +
            vkApiServiceKey +
            '&v=' +
            vkApiVersion,
        {
            headers: { 'Access-Control-Allow-Origin': '*' },
        },
    );
    const wallItems = wallData.data.response.items as any[];

    let vkWordsObject = user.userVkWords || { postsCount: 0 };

    wallItems
        .filter(el => el.text.length > 0)
        .map(item => {
            const text = item.text as string;
            if (text) {
                const wordsNounsLength = nlp(text)
                    .nouns()
                    .data().length;
                const wordsVerbsLength = nlp(text)
                    .verbs()
                    .data().length;
                const words = nlp(text)
                    .nouns()
                    .toSingular()
                    .data()
                    .map(value => value.main);

                const postWordMap = {};
                words.map(word => {
                    const lowercaseWord = word.toLowerCase();
                    postWordMap[lowercaseWord] = postWordMap[lowercaseWord] ? postWordMap[lowercaseWord] + 1 : 1;
                });

                Object.keys(postWordMap).map(wordKey => {
                    let wordArr = (vkWordsObject[wordKey] as any[]) || [];
                    if (!wordArr.find(el => el.id === item.id)) {
                        wordArr.push({
                            count: postWordMap[wordKey],
                            postId: item.id,
                            postWordsCount: wordsNounsLength + wordsVerbsLength,
                        });
                        vkWordsObject.postsCount = vkWordsObject.postsCount + 1;
                    }

                    vkWordsObject = { ...vkWordsObject, [wordKey]: [...wordArr] };
                });
            }
        });
    const dataSaveToDB = { userVkWords: vkWordsObject, best20VkWords: processVkWordsData(vkWordsObject) };
    return SourceDB.saveUserVkWords(job.data.username, dataSaveToDB.userVkWords, dataSaveToDB.best20VkWords);
});

// Get profile
router.get('/', async (req: Request, res: Response) => {
    try {
        const user = req['user'];
        if (user) {
            res.status(200).send(user);
        } else {
            await Promise.reject({ status: 401, statusText: 'This user is not exist' });
        }
    } catch (error) {
        res.status(error.status||500).send({ data: error.statusText });
    }
});
// Logout
router.get('/logout', async (req: Request, res: Response) => {
    try {
        res.setHeader('x-jwt', '');
        res.status(200).redirect(appSite);
    } catch (error) {
        res.status(error.status||500).send({ data: error.statusText });
    }
});
// Login
router.post('/', async (req: Request, res: Response) => {
    // get parameters from post request
    try {
        let user = req['user'];
        if (!user) {
            let params = req.body;
            const users = await SourceDB.findUserByName(params.username);
            if (users.length === 0) {
                await Promise.reject({ status: 403, statusText: 'This user is not exist' });
            }

            user = users.pop();
            const isPasswordCorrect = await bcrypt.compare(params.password, user.password);
            if (!isPasswordCorrect) {
                await Promise.reject({ status: 403, statusText: 'Invalid password' });
            }
            var token = jwt.sign({ username: user.username }, key);
            res.setHeader('x-jwt', token);
        } else {
            await Promise.reject({ status: 500, statusText: `You are already logined` });
        }
        res.status(200).send(user);
    } catch (error) {
        res.status(error.status||500).send({ data: error.statusText });
    }
});

// Registration
router.post('/reg', async (req: Request, res: Response) => {
    // get parameters from post request
    try {
        let user = req['user'];
        if (!user) {
            const params = req.body;
            const users = await SourceDB.findUserByName(params.username);
            if (users.length !== 0) {
                await Promise.reject({ status: 500, statusText: 'This user already exist!' });
            }
            await SourceDB.insertNewUser({ username: params.username, password: params.password, booksIds: [] });
            user = (await SourceDB.findUserByName(params.username)).pop();
            var token = jwt.sign({ username: user.username }, key);
            res.setHeader('x-jwt', token);
        } else {
            await Promise.reject({ status: 500, statusText: `You are already logged` });
        }
        res.status(200).send(user);
    } catch (error) {
        res.status(error.status||500).send({ data: error.statusText });
    }
});

router.post('/update-vk-id', protectRoute, async (req, res) => {
    let params = req.body;
    try {
        const user = req['user'];
        await SourceDB.updateUserVkId(user.username, params.userVkId);
        const job = AnalyzeTextQueue.createJob({ username: user.username });
        job.save();
        user.userVkId = params.userVkId;
        return res.status(200).send(user);
    } catch (error) {
        res.status(error.status||500).send({ data: error.statusText });
    }
});

// Export the express.Router() instance to be used by server.ts
export const LoginController: Router = router;
