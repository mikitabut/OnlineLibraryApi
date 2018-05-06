"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const controllers_1 = require("./controllers");
const express = require("express");
const dotenv = require("dotenv");
const bodyParser = require("body-parser");
const app = express();
dotenv.load();
const port = process.env.PORT || '3000';
app.use(bodyParser.json());
app.use('/books', controllers_1.BooksController);
app.listen(port, () => {
});
//# sourceMappingURL=server.js.map