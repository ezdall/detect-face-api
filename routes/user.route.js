const router = require('express').Router();

const {
  register,
  signin,
  refresh,
  logout,
  userById,
  isLogin,
  isAuth
} = require('../controllers/auth.cont');

const { userLists, getUser, updateUser } = require('../controllers/user.cont');

const { handleImage, requestApi2 } = require('../controllers/image.cont');

// testing
router.get('/hi/:userId', isLogin, isAuth, (req, res) => {
  console.log(req.auth.email);
  console.log(req.user.email);

  return res.json('hi');
});

//
router.get('/users', userLists);

// auth
router.post('/signin', signin);
router.post('/register', register);

router.get('/refresh', refresh);
router.get('/logout', logout);

// img, clarifai
router.post('/image-url', isLogin, requestApi2);
router.patch('/image', handleImage);

// profile
router.get('/profile/:userId', isLogin, isAuth, getUser);
router.put('/profile/:userId', isLogin, isAuth, updateUser);

router.param('userId', userById);

module.exports = { userRouter: router };
