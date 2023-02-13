const express = require('express');
const app = express();
const {
  models: { User, Note },
} = require('./db');
const path = require('path');
const dotenv = require('dotenv').config();

const SECRET = process.env.JWT;

// middleware
app.use(express.json());

async function requireToken(req, res, next) {
  try {
    const token = req.headers.authorization;
    const user = await User.byToken(token);
    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

// routes
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

app.post('/api/auth', async (req, res, next) => {
  try {
    res.send({ token: await User.authenticate(req.body) });
  } catch (ex) {
    next(ex);
  }
});

app.get('/api/auth', requireToken, async (req, res, next) => {
  try {
    res.send(req.user);
  } catch (ex) {
    next(ex);
  }
});

app.get('/api/users/:userId/notes', requireToken, async (req, res, next) => {
  try {
    const { userId } = req.params;

    const { user } = req;

    if (+userId === user.id) {
      const notes = await Note.findAll({
        where: {
          userId: user.id,
        },
      });
      res.status(200).json(notes);
    } else res.sendStatus(400);
  } catch (err) {
    next(err);
  }
});

// error handling
app.use((err, req, res, next) => {
  console.log(err);
  res.status(err.status || 500).send({ error: err.message });
});

module.exports = app;
