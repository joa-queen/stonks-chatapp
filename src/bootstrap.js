import '@babel/polyfill';

import express from 'express';
import http from 'http';

import { PORT, REDIS_HOST, REDIS_PORT } from './constants';
import Db from './db';
import SocketIo from './io';
import app from './app';

let server;

export const start = async (redisClient = { host: REDIS_HOST, port: REDIS_PORT }) => {
  try {
    await Db.start();

    const service = express();
    server = http.Server(service);
    await SocketIo.start(server, redisClient);

    service.use('/', app);
    server.listen(PORT, () => {
      if (process.env.NODE_ENV !== 'test') console.log('Express server started');
    });
  } catch (err) {
    console.error(`Could not connect: ${err}`);
  }
};

export const stop = async () => {
  await server.close();
  await Db.stop();
  SocketIo.stop();
};
