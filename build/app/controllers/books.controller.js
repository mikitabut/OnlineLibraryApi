"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = require("../db");
const router = express_1.Router();
router.get('/', (req, res) => {
    return db_1.SourceDB.getAllBooks()
        .then(entities => {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.status(200).send({ data: entities });
    })
        .catch(error => res.status(500).send({ error }));
});
router.post('/add', (req, res) => {
    const book = req.body;
    db_1.SourceDB.insertNewBook(book)
        .then(() => db_1.SourceDB.getAllBooks()
        .then(entities => {
        res.append('Access-Control-Allow-Origin', '*');
        res.append('Access-Control-Allow-Headers', 'Content-Type');
        res.status(200).send({ data: entities });
    })
        .catch(error => res.status(500).send({ error })))
        .catch(error => res.status(500).send({ error }));
});
router.options('/*', (req, res) => {
    db_1.SourceDB.getAllBooks().then(entities => {
        res.append('Access-Control-Allow-Origin', '*');
        res.append('Access-Control-Allow-Headers', 'Content-Type');
        res.status(200).send();
    });
});
exports.BooksController = router;
//# sourceMappingURL=books.controller.js.map