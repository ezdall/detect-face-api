const express = require('express');
const path = require('path');

const app = express();

const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use('/dist', express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.json('root');
});

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

app.listen(PORT, () => {
  console.log(`http://localhost:${PORT}/`);
});

/**
 * /signin --> POST = success/fail
 * /register --> POST = user
 * /profile/:userId --> GET = user
 * /image --> PUT --> user
 */
