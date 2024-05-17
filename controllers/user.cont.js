const _extend = require('lodash/extend');

const User = require('../models/user.model');
//
const { BadRequest400 } = require('../helpers/bad-request.error');
const { Unauthorized401 } = require('../helpers/unauthorized.error');

// GET A
const getUser = async (req, res, next) => {
  try {
    if (!req.user) {
      return next(new Unauthorized401('no user /getUser'));
    }

    // remove password-related
    req.user.hashed_password = undefined;
    req.user.salt = undefined;

    // .toObject trasform _id?
    // transfor to plain-js

    // user.id = user._id;
    // user.entries = user.history.length;

    return res.json(req.user);
  } catch (error) {
    return next(error);
  }
};

// GET ALL
const userLists = async (req, res, next) => {
  try {
    const users = await User.find({})
      .select('-salt -hashed_password')
      .lean()
      .exec();

    if (!users) {
      return next(new BadRequest400('no user lists @userLists'));
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

    if (!user) {
      return next(new BadRequest400('error update'));
    }

    user.hashed_password = undefined;
    user.salt = undefined;

    return res.json(user);
  } catch (error) {
    return next(error);
  }
};

// const deleteUser = async (req, res, next) =>{}

module.exports = {
  getUser,
  updateUser,
  userLists
};
