const mongoose = require('mongoose');
const { genSalt, hash, compare } = require('bcrypt')
const expressJwt = require('express-jwt');
const jwt = require('jsonwebtoken');

const User = require('../models/user.model');

const signin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(Error('all field required /signin'));
    }

    const user = await User.findOne({ email }).exec();

    console.log(user)


    if (!user) {
      return next(Error('Unauthorized /signin'));
    }

    // need to await, must be boolean
    // const pwdMatch = await user.validatePassword(password)
    const pwdMatch = await compare(password, user.hashed_password)

    if (typeof pwdMatch !== 'boolean' || !pwdMatch) {
      return next(Error('wrong password /signin'));
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

    // password encrypt
    const salt = await genSalt();
    const hashed_password = await hash(password, salt)

    const user = await User.create({ email, password, name, salt, hashed_password });

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
