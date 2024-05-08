const _extend = require('lodash/extend');

const User = require('../models/user.model');

// GET A
const getUser = async (req, res, next) => {
  try {
    // remove password-related
    req.user.hashed_password = undefined;
    req.user.salt = undefined;

    // transfor to plain-js
    const user = req.user.toObject();
    // user.id = user._id;
    // user.entries = user.history.length;

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

    if (!users) {
      return next(Error('no user lists @userLists'));
    }

    return res.json(users);
  } catch (error) {
    return next(error);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const formInput = req.body;
    const updatedUser = _extend(req.user, formInput);

    const user = await updatedUser.save();

    user.hashed_password = undefined;
    user.salt = undefined;

    return res.json(user);
  } catch (error) {
    return next(error);
  }
};

// cosnt deleteUser = async (req, res, next) =>{}

module.exports = {
  getUser,
  updateUser,
  userLists
};
