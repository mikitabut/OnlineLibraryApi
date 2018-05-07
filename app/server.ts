import { BooksController } from './controllers';
import * as express from 'express';
import * as dotenv from 'dotenv';
import * as busboy from 'connect-busboy';
// Create a new express application instance
const app: express.Application = express();
dotenv.load();

// The port the express app will listen on
const port: string = process.env.PORT || '3000';
app.use(busboy({ immediate: true }));

app.use('/books', BooksController);
app.listen(port, () => {
    // Success callback
    // console.log(`Listening at http://localhost:${port}/`);
});
