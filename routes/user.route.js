const router = require('express').Router();

const {
  register,
  signin,
  // logout,
  userLists,
  getUser,
  updateUser,
  userById
} = require('../controllers/user.cont');

router.get('/users', userLists);

router.post('/signin', signin);

router.post('/register', register);

router.get('/profile/:userId', getUser);
router.patch('/profile/:userId', updateUser);

router.param('userId', userById);

module.exports = { userRouter: router };
