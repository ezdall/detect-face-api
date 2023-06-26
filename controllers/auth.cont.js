const mongoose = require('mongoose');
const expressJwt = require('express-jwt');
const jwt = require('jsonwebtoken');

const User = require('../models/user.model');

const signin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(Error('all field required'));
    }

    const user = await User.findOne({ email }).exec();

    if (!user) {
      return next(Error('unauthorized'));
    }

    if (!user.validatePassword(password)) {
      return next(Error('wrong password'));
    }

    const token = jwt.sign({ email: user.email }, process.env.JWT_SECRET, {
      expiresIn: '1hr'
    });

    // access by express-jwt through cookie
    // using it secret, to decode
    res.cookie('t', token);

    // remove password-related
    user.hashed_password = undefined;
    user.salt = undefined;

    return res.json({ token, user: user.toObject() });
  } catch (error) {
    return next(error);
  }
};

const register = async (req, res, next) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return next(Error('all fields required'));
    }

    const user = await User.create({ email, password, name });

    if (!user) {
      return next(Error('invalid user'));
    }

    // strip
    user.hashed_password = undefined;
    user.salt = undefined;

    return res.status(201).json({ user });
  } catch (error) {
    return next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    await res.clearCookie('t');

    return res.json('clear cookie');
  } catch (error) {
    return next(error);
  }
};

const userById = async (req, res, next) => {
  try {
    const { userId } = req.params;

    if (!mongoose.isValidObjectId(userId)) {
      return next(Error('wrong id number'));
    }

    const user = await User.findById(userId)
      .select('-hashed_password -salt')
      .exec();

    if (!user) {
      return next(Error('user not found'));
    }

    // mount
    req.user = user;

    // !important
    return next();
  } catch (error) {
    return next(error);
  }
};

// checks and decoder of "Bearer xxx" req.headers.authorization
const isLogin = expressJwt({
  secret: process.env.JWT_SECRET,
  algorithms: ['HS256'],
  requestProperty: 'auth'
});

// isAuth or hasAuth
// place at route with /:userId
const isAuth = (req, res, next) => {
  try {
    const authorized = req.user && req.auth && req.user.email == req.auth.email;

    if (!authorized) {
      return next(Error('User not Authorized!'));
    }

    return next();
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  signin,
  register,
  logout,
  isLogin,
  isAuth,
  userById
};
