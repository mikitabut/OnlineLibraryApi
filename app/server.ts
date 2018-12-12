import { BooksController, LoginController, PdfController } from './controllers';
import * as express from 'express';
import * as dotenv from 'dotenv';
import * as cors from 'cors';

// Create a new express application instance
const app: express.Application = express();
dotenv.load();

// The port the express app will listen on
const port: string = process.env.PORT || '3000';
app.use(cors())
app.use('/api/auth', LoginController);

app.use('/api/books', BooksController);
app.use('/api/pdf', PdfController);

app.listen(port, () => {
    // Success callback
    // console.log(`Listening at http://localhost:${port}/`);
});
