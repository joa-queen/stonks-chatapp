import io from 'socket.io-client';
import jwt from 'jsonwebtoken';

import { JWT_SECRET } from './src/constants';

const PORT = 3000;

// This block is editable as needed
const MESSAGES = 100000;
const SECONDS = 60;
const CLIENTS = 10;

const test = async () => {
  console.log('Starting stress test');

  const sockets = [];
  const connectionPromises = [];
  const messagePromises = [];

  // This variable is used to check if all messages had been delivered correctly
  let partial = 0;

  // We create sockets for each client needed and store them for later use
  for (let id = 1; id <= CLIENTS; id += 1) {
    const token = jwt.sign({ id }, JWT_SECRET);
    const socket = io(`ws://localhost:${PORT}/chat`, {
      query: `token=${token}`,
      transports: ['websocket'],
      withCredentials: true,
    });
    sockets.push(socket);
    connectionPromises.push(new Promise((resolve) => socket.on('connect', resolve)));
    messagePromises.push(new Promise((resolve) => {
      socket.on('message:new', () => {
        partial += 1;
        if (partial === MESSAGES) resolve();
      });
    }));
    socket.on('hostname', ({ hostname }) => {
      console.log(`User id ${id} connected to ${hostname}`);
    });
    socket.on('connect_error', (err) => {
      console.log(err);
    });
  }

  // Act
  await Promise.all(connectionPromises);

  console.log('All sockets connected');

  // Messages are sent by a random socket, to the next socket in the list
  const sendBulk = (no) => {
    const index = Math.floor(Math.random() * sockets.length);
    const socket = sockets[index];
    const to = ((index + 1) % sockets.length) + 1;

    socket.emit('message', { to, content: `message no ${no}` });

    if (no < MESSAGES) {
      const wait = (SECONDS * 1000) / MESSAGES;
      setTimeout(() => {
        sendBulk(no + 1);
      }, wait);
    }
  };

  sendBulk(1);

  // Assert
  await Promise.any(messagePromises);

  // Cleanup
  sockets.forEach((socket) => {
    socket.close();
  });

  console.log(`Test ended successfuly for ${MESSAGES} messages in ${SECONDS} seconds, with ${CLIENTS} clients`);
};

test();
