const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

const { connectMDB } = require('./db');

// env, configs
dotenv.config({
  path: './config/config.env'
});

// connect
connectMDB().catch(error =>
  console.error('connect-mongodb Error', error.stack)
);

const app = express();

const PORT = Number(process.env.PORT) || 3000;

// import routes
const { userRouter } = require('./routes/user.route');

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use('/dist', express.static(path.join(__dirname, 'public')));

app.use('/', [userRouter]);

app.post('/signin', (req, res) => {
  const { email, password } = req.body;

  res.json('signin');
});

app.post('/register', (req, res) => {
  res.json('register');
});

app.get('/profile/:userId', (req, res) => {
  const { userId } = req.params;

  res.json(userId);
});

app.post('/profile', (req, res) => {
  const user = {
    name: 'Sally',
    hobby: 'soccer'
  };

  res.json(user);
});

//
mongoose.connection.once('open', () => {
  app.listen(PORT, err => {
    console.log(`Face-Detect Server is running on http://localhost:${PORT}`);
  });
});

// listen to mongoose error
mongoose.connection.on('error', err => {
  console.error('error @mongoose-conn-error ---', err);
});

/**
 * /signin --> POST = success/fail
 * /register --> POST = user
 * /profile/:userId --> GET = user
 * /image --> PUT --> user
 */
