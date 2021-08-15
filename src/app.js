import express from 'express';
import os from 'os';
import jwt from 'jsonwebtoken';
import bodyParser from 'body-parser';

import { JWT_SECRET } from './constants';

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.send(`hostname ${os.hostname()}`);
});

app.get('/login', (req, res) => {
  const token = jwt.sign({ id: req.body.username }, JWT_SECRET);
  return res.json({ token });
});

export default app;
