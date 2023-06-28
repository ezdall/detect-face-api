const router = require('express').Router();

const {
  register,
  signin,
  isLogin,
  logout,
  userById,
  isAuth
} = require('../controllers/auth.cont');

const { userLists, getUser, updateUser } = require('../controllers/user.cont');

const { handleImage } = require('../controllers/image.cont');

// testing
router.get('/hi/:userId', isLogin, isAuth, (req, res) => {
  console.log(req.auth.email);
  console.log(req.user.email);

  return res.json('hi');
});

// auth
router.post('/signin', signin);
router.post('/register', register);
router.get('/logout', logout);
// img, clarifai
// router.post('/image-url', isLogin, requestApi);
router.patch('/image', handleImage);
// profile
router.get('/profile/:userId', isLogin, isAuth, getUser);
router.put('/profile/:userId', isLogin, isAuth, updateUser);
// test
router.get('/users', isLogin, userLists);

router.param('userId', userById);

module.exports = { userRouter: router };
