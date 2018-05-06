import { MongoClient } from 'mongodb';

class MongoConnector {
    private db?: MongoClient;
    constructor() {
        this.connect();
    }

    public async connect(): Promise<MongoClient> {
        this.db = await MongoClient.connect(
            process.env.MONGO_CONNECTION || 'mongodb://user:user@ds213759.mlab.com:13759/books',
        );
        return this.db;
    }

    public getBooksCollection() {
        return this.db!.db('books');
    }
}

export const MongoDB = new MongoConnector();
