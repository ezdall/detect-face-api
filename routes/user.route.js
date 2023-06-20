const router = require('express').Router();

const {
  // register,
  // signin,
  // logout,
  userLists
} = require('../controllers/user.cont');

router.get('/users', userLists);

module.exports = { userRouter: router };
