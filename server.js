// const http = require('http');
const mongoose = require('mongoose');

const app = require('./app');
const { connectMDB } = require('./db');

connectMDB().catch(err => console.error('connect-mongodb Error', err.stack));

const PORT = process.env.PORT || 3000;

// const server = http.createServer(app);

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
