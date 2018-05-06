"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const controllers_1 = require("./controllers");
const express = require("express");
const dotenv = require("dotenv");
const bodyParser = require("body-parser");
const firebase = require("firebase-functions");
const app = express();
dotenv.load();
const port = process.env.PORT || '3000';
app.use(bodyParser.json());
app.use('/books', controllers_1.BooksController);
app.listen(port, () => {
});
const api1 = firebase.https.onRequest(app);
module.exports = { api1 };
//# sourceMappingURL=server.js.map