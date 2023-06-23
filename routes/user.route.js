const router = require('express').Router();

const {
  register,
  signin,
  // logout,
  userLists,
  getUser,
  userById
} = require('../controllers/user.cont');

router.get('/users', userLists);

router.post('/signin', signin);

router.post('/register', register);

router.get('/profile/:userId', getUser);

router.param('userId', userById);

module.exports = { userRouter: router };
