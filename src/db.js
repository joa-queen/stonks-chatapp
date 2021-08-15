import { MongoClient } from 'mongodb';
import { MongoMemoryServer } from 'mongodb-memory-server';

class Db {
  constructor() {
    if (!Db.instance) {
      Db.instance = this;
    }

    return Db.instance;
  }

  async start() {
    let url = 'mongodb://localmongo0,localmongo1,localmongo2:27017/chat?replicaSet=rs0';

    if (process.env.NODE_ENV === 'test') {
      this.mongod = await MongoMemoryServer.create();
      url = await this.mongod.getUri();
    }

    this.client = new MongoClient(url);
    await this.client.connect();

    this.db = this.client.db('chat');

    // Generate indexes
    this.db.createIndex('chat_from_to_createdAt', { from: -1, to: -1, createdAt: -1 });
  }

  async stop() {
    await this.client.close();
    if (this.mongod) {
      await this.mongod.stop();
    }
  }
}

export default new Db();
