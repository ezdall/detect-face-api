const router = require('express').Router();

const {
  register,
  signin,
  // logout,
  userLists
} = require('../controllers/user.cont');

router.get('/users', userLists);

router.post('/signin', signin);

router.post('/register', register);

module.exports = { userRouter: router };
