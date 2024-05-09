require('express-async-errors');
require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const morgan = require('morgan');
// const helmet = require('helmet');
const cookieParser = require('cookie-parser');

const { connectMDB } = require('./db');
const { corsOptions } = require('./helpers/cors-opts');
const { errorHandler } = require('./helpers/error-handler');
//
const { userRouter } = require('./routes/user.route');

// connect
connectMDB().catch(err => console.error('connect-mongodb Error', err.stack));

const app = express();

const PORT = process.env.PORT || 3000;

app.use(cors(corsOptions));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // false
app.use(cookieParser());
// app.use(helmet());

app.use('/', express.static(path.join(__dirname, 'public')));

app.use('/', [userRouter]);

// catch all
app.all('*', (req, res, next) => {
  const error = new Error(`${req.ip} tried to access ${req.originalUrl}`);

  return next(error);
});

// error handle
app.use(errorHandler);

//
mongoose.connection.once('open', () => {
  const isProd = process.env.NODE_ENV === 'production';

  const nodeEnv = isProd ? 'PROD' : 'DEV';
  const hostNamePort = isProd
    ? 'detect-face-srv.onrender.com'
    : `localhost:${PORT}`;

  app.listen(PORT, err => {
    if (err) throw err;
    console.log(`DetectFace-Srv -${nodeEnv}- running at ${hostNamePort}`);
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
