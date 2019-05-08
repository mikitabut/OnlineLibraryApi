import * as express from 'express';
import * as dotenv from 'dotenv';
import * as cors from 'cors';

import { BooksController, LoginController, PdfController } from './controllers';
import { checkJwt } from './common/middlewares';
import { appSite } from './common';

// Create a new express application instance
const app: express.Application = express();
dotenv.load();

// The port the express app will listen on
const port: string = process.env.PORT || '3000';

// Common middlewares
app.use(cors({
    credentials: true,
    allowedHeaders: ['Content-Type', 'x-jwt', 'enctype'],
    exposedHeaders: ['x-jwt'],
    origin: appSite,
}));
app.use(checkJwt);

// Default controllers
app.use('/api/auth', LoginController);
app.use('/api/books', BooksController);
app.use('/api/pdf', PdfController);

app.listen(port, () => {
    // Success callback
    // console.log(`Listening at http://localhost:${port}/`);
});
