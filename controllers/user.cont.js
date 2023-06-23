const User = require('../models/user.model');

// GET ALL

const userLists = async (req, res, next) => {
  try {
    const users = await User.find()
      .select('-salt -hashed_password')
      .lean();

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

    // remove password-related
    // cant do .select(), due to validating password
    user.hashed_password = undefined;
    user.salt = undefined;

    return res.json(user);
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

    user.hashed_password = undefined;
    user.salt = undefined;

    return res.status(201).json(user);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  signin,
  register,
  // logout,
  userLists
};
