const mongoose = require('mongoose');
const _ = require('lodash');
const expressJwt = require('express-jwt');
const jwt = require('jsonwebtoken');

const User = require('../models/user.model');
const express = require('express');

// GET A
const getUser = async (req, res, next) => {
  try {
    // transfor to plain-js
    const user = req.user.toObject();
    user.id = user._id;
    user.entries = user.history.length;

    return res.json(user);
  } catch (error) {
    return next(error);
  }
};

// GET ALL
const userLists = async (req, res, next) => {
  try {
    const users = await User.find()
      .select('-salt -hashed_password')
      .lean()
      .exec();

    return res.json(users);
  } catch (error) {
    return next(error);
  }
};

// transfer to 'auth'
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
      expiresIn: '1h'
    });

    // access by express-jwt through cookie
    // using it secret, to decode
    res.cookie('t', token);

    // remove password-related
    // cant do .select(), due to validating password
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
    console.log('logout');
    await res.clearCookie('t');

    return res.json('clear cookie');
  } catch (error) {
    return next(error);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const formInput = req.body;
    const updatedUser = _.extend(req.user, formInput);

    const user = await updatedUser.save();

    user.hashed_password = undefined;
    user.salt = undefined;

    return res.json(user);
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

    return next();
  } catch (error) {
    return next(error);
  }
};

// checks and decoder of "Bearer xxx" req.headers.authorization
// access the decoded at: "req.auth"
// has next()
const isLogin = expressJwt({
  secret: process.env.JWT_SECRET,
  algorithms: ['HS256'],
  requestProperty: 'auth'
});

module.exports = {
  signin,
  register,
  logout,
  isLogin,
  getUser,
  updateUser,
  userLists,
  userById
};
