require('express-async-errors');
require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const morgan = require('morgan');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');

const { connectMDB } = require('./db');
const { corsOptions } = require('./helpers/cors-opts');

// connect
connectMDB().catch(error =>
  console.error('connect-mongodb Error', error.stack)
);

const app = express();

const PORT = Number(process.env.PORT) || 3000;

// import routes
const { userRouter } = require('./routes/user.route');

const { errorHandler } = require('./helpers/error-handler');

app.use(cors(corsOptions));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
// app.use(helmet());

app.use('/dist', express.static(path.join(__dirname, 'public')));

app.use('/', [userRouter]);

// catch all
app.all('*', (req, res, next) => {
  return next();
});

// error handling
app.use(errorHandler);

//
mongoose.connection.once('open', () => {
  app.listen(PORT, err => {
    if (err) throw err;
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
