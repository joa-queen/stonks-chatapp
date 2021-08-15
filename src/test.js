import '@babel/polyfill';

import { expect } from 'chai';
import ioClient from 'socket.io-client';
import jwt from 'jsonwebtoken';
import redis from 'redis-mock';

import { start, stop } from './bootstrap';
import { JWT_SECRET, PORT } from './constants';

export const TOKEN1 = jwt.sign({ id: 1 }, JWT_SECRET);
export const TOKEN2 = jwt.sign({ id: 2 }, JWT_SECRET);

const getRedis = () => new Promise((resolve) => {
  const client = redis.createClient();
  client.on('ready', () => { resolve(client); });
});

let redisClient;

describe('Socket Client', () => {
  describe('User Authorized', () => {
    beforeEach(async () => {
      redisClient = await getRedis();
      await start({
        pubClient: redisClient,
        subClient: redisClient,
      });
    });

    afterEach(async () => {
      await stop();
      await redisClient.end();
    });

    it('User 1 should connect', async () => {
      // Arrange
      const socket = ioClient(`http://0.0.0.0:${PORT}/chat`, {
        query: `token=${TOKEN1}`,
      });

      // Act
      const expectation = new Promise((resolve) => {
        socket.on('connect', resolve);
      });

      // Assert
      await expectation;
      expect(socket.connected).to.be.true;

      // Cleanup
      socket.close();
    });

    it('User 2 should receive message from User 1', async () => {
      // Arrange
      const socket1 = ioClient(`http://0.0.0.0:${PORT}/chat`, {
        query: `token=${TOKEN1}`,
      });
      const socket2 = ioClient(`http://0.0.0.0:${PORT}/chat`, {
        query: `token=${TOKEN2}`,
      });
      const content = 'This is a message from me to you';

      // Act
      const connection1 = new Promise((resolve) => {
        socket1.on('connect', resolve);
      });
      const connection2 = new Promise((resolve) => {
        socket1.on('connect', resolve);
      });
      await Promise.all([connection1, connection2]);

      const expectation = new Promise((resolve) => {
        socket2.on('message:new', resolve);
      });
      socket1.emit('message', { to: 2, content });

      // Assert
      const data = await expectation;
      expect(data.from).to.equals(1);
      expect(data.content).to.equals(content);

      // Cleanup
      socket1.close();
      socket2.close();
    });
  });
});
