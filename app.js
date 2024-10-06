require('express-async-errors');
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const morgan = require('morgan');
// const helmet = require('helmet');
const cookieParser = require('cookie-parser');

const { corsOptions } = require('./helpers/cors-opts');
const { errorHandler } = require('./helpers/error-handler');
const { UrlError } = require('./helpers/url.error');
//
const { userRouter } = require('./routes/user.route');

const app = express();

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
  const error = new UrlError(`${req.ip} tried to access ${req.originalUrl}`);

  return next(error);
});

// error handle
app.use(errorHandler);

module.exports = app;

/**
 * /signin --> POST = success/fail
 * /register --> POST = user
 * /profile/:userId --> GET = user
 * /image --> PUT --> user
 */
