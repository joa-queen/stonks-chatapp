import socketio from 'socket.io';
import socketioJwt from 'socketio-jwt';
import redisAdapter from 'socket.io-redis';
import os from 'os';

import Db from './db';
import { JWT_SECRET } from './constants';

class Io {
  constructor() {
    if (!Io.instance) {
      Io.instance = this;
    }

    return Io.instance;
  }

  async start(server, redisClient) {
    this.io = socketio(server, {
      cors: {
        origin: 'http://localhost',
        methods: ['GET', 'POST'],
        transports: ['websocket', 'polling'],
        credentials: true,
      },
      allowEIO3: true,
    });

    this.io.adapter(redisAdapter(redisClient));
    this.chatNsp = this.io.of('/chat');

    this.chatNsp.use(socketioJwt.authorize({
      secret: JWT_SECRET,
      handshake: true,
    }));

    this.chatNsp.adapter.on('error', (error) => {
      console.log('error', error);
    });

    this.chatNsp.on('connection', async (socket) => {
      const user = socket.decoded_token;

      const roomName = `user:${user.id}`;
      this.chatNsp.adapter.remoteJoin(socket.id, roomName);

      socket.emit('hostname', { hostname: os.hostname() });

      socket.on('message', async ({ to, content }) => {
        const userRoom = `user:${to}`;
        const from = user.id;

        const collection = Db.db.collection('chat');
        await collection.insertOne({
          from,
          to,
          content,
          createdAt: new Date(),
        });

        this.chatNsp.to(userRoom).emit('message:new', { from, content });
      });

      socket.on('messages:request', async ({ withUser, page = 1 }) => {
        const limit = 30;
        const skip = (page - 1) * limit;
        const collection = Db.db.collection('chat');

        const messages = await collection.find({
          $or: [
            { from: user.id, to: withUser },
            { from: withUser, to: user.id },
          ],
        })
          .sort({ createdAt: -1 })
          .limit(limit)
          .skip(skip)
          .toArray();

        socket.emit('messages:response', {
          withUser,
          page,
          messages,
        });
      });
    });
  }

  async stop() {
    const ns = this.get();
    ns.server.close();
    ns.adapter.on('error', () => {});

    await Promise.all([
      new Promise((res) => {
        ns.adapter.pubClient.quit(res);
      }),
      new Promise((res) => {
        ns.adapter.subClient.quit(res);
      }),
    ]);

    this.io.close();
  }

  get() {
    return this.chatNsp;
  }
}

export default new Io();
