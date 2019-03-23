// Import only what we need from express
import { Router, Request, Response } from 'express';
import * as bcrypt from 'bcrypt';
import * as bodyParser from 'body-parser';
const Queue = require('bee-queue');
const axios = require('axios');
var nlp = require('compromise')

import { SourceDB } from '../db';
import { setXhrHeader, JwtGenerator, vkApiStartString, vkApiServiceKey, vkApiVersion } from '../common';

function processVkWordsData(userVkWords) {
  let result = {};

  Object.keys(userVkWords).filter(key => {
      if(key === 'postsCount') {
          return false;
      }
      const resCount =  userVkWords[key].reduce((prevVal, curVal) => prevVal + curVal.count, 0);
      return resCount > 2;
    }).map(key => {
      const concArr = userVkWords[key];
      const idf = Math.log10(userVkWords.postsCount/concArr.length);
      const tfidfFullWeight = concArr.reduce((prevValue, currentValue) => {

          return prevValue + (currentValue.count/ currentValue.postWordsCount) * idf;
      }, 0)
      result = {
        ...result,
        [key]: tfidfFullWeight,
      };
  });
  const sortedWeights =  Object.keys(result).sort((a,b) => {
    return result[b] - result[a];
  });

  return sortedWeights.slice(0, 20);
}

// Assign router to the express.Router() instance
const router: Router = Router();

const AnalyzeTextQueue = new Queue('analyzeTextQueue');

// Process jobs from as many servers or processes as you like
AnalyzeTextQueue.process(async job => {
  const users = await SourceDB.findUserByName(job.data.username);
  if(users.length === 0) {
      const errorMessage = 'User is not exist for this username: ' + job.data.username;
      console.log(errorMessage);
      throw new Error(errorMessage);
  }

  const user = users.pop();

  const wallData = await axios.get(vkApiStartString + 'wall.get' + '?owner_id=' + user.userVkId + '&count=100' + '&access_token=' + vkApiServiceKey + '&v=' + vkApiVersion,
      {
          headers: {'Access-Control-Allow-Origin': '*'}
      }
  );
  const wallItems = wallData.data.response.items as any[];

  let vkWordsObject = user.userVkWords || {postsCount: 0};

  wallItems.filter(el => el.text.length > 0).map(item => {
      const text = item.text as string;
      if(text) {
        const wordsNounsLength = nlp(text).nouns().data().length;
        const wordsVerbsLength = nlp(text).verbs().data().length;
        const words = nlp(text).nouns().toSingular().data().map(value => value.main);

        const postWordMap = {};
        words.map(word => {
            const lowercaseWord = word.toLowerCase();
            postWordMap[lowercaseWord] = postWordMap[lowercaseWord] ? postWordMap[lowercaseWord] + 1: 1;
        });

        Object.keys(postWordMap).map(wordKey => {
            let wordArr = vkWordsObject[wordKey] as any[] || [];
            if(!wordArr.find(el => el.id === item.id)) {
                wordArr.push({
                    count:postWordMap[wordKey],
                    postId: item.id,
                    postWordsCount: wordsNounsLength + wordsVerbsLength,
                });
                vkWordsObject.postsCount = vkWordsObject.postsCount + 1;
            }

            vkWordsObject = {...vkWordsObject, [wordKey]: [...wordArr]};
        })

      }

  })
  const dataSaveToDB = { userVkWords: vkWordsObject, best20VkWords: processVkWordsData(vkWordsObject) };
  return SourceDB.saveUserVkWords(job.data.username, dataSaveToDB.userVkWords, dataSaveToDB.best20VkWords);
});

router.use(bodyParser.json());

router.post('/', (req: Request, res: Response) => {
    setXhrHeader(req,res);
    // get parameters from post request
    let params = req.body;
    let resultData = {} as any;
    SourceDB.findUserByName(params.username)
        .then(users => {
            if (users.length === 0) {
                return Promise.reject({ status: 500, statusText: 'This user is not exist' });
            }
            return Promise.resolve(users.pop());
        })
        .then(user => {
            resultData = {...resultData, userVkId: user.userVkId};
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
        .then(([jwt]) => res.status(200).send({ data: { jwtToken: jwt.token, userVkId: resultData.userVkId } }))
        .catch(error => {
            res.status(500).send({ data: error });
        });
});
router.post('/reg', (req: Request, res: Response) => {
    setXhrHeader(req, res);
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

router.post('/update-vk-id',
    (req, res) => {
        let params = req.body;
        SourceDB.findUserByName(params.username)
            .then(users => {
                if (users.length === 0) {
                    return Promise.reject({ status: 500, statusText: 'This user is not exist' });
                }
                return Promise.resolve(users.pop());
            })
            .then(() => {
                return SourceDB.updateUserVkId(params.username, params.userVkId);
            })
            .then(()=> {
                const job = AnalyzeTextQueue.createJob({username: params.username})
                job.save();
                return res.status(200).send({ data: 'success'});
            })
            .catch(error => {
                res.status(500).send({ data: error });
            });
    }
);

router.options('/*', (req: Request, res: Response) => {
    setXhrHeader(req, res);
    res.status(200).send();
});

// Export the express.Router() instance to be used by server.ts
export const LoginController: Router = router;
