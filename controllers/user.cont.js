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

module.exports = {
  // signin, register, logout,
  userLists
};
