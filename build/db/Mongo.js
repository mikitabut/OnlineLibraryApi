"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongodb_1 = require("mongodb");
class MongoConnector {
    constructor() {
        this.connect();
    }
    connect() {
        return __awaiter(this, void 0, void 0, function* () {
            this.db = yield mongodb_1.MongoClient.connect(process.env.MONGO_CONNECTION || 'mongodb://user:user@ds213759.mlab.com:13759/books');
            return this.db;
        });
    }
    getBooksCollection() {
        return this.db.db('books');
    }
}
exports.MongoDB = new MongoConnector();
//# sourceMappingURL=Mongo.js.map