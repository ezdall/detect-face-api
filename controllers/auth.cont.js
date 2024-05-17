const mongoose = require('mongoose');
const { genSalt, hash, compare } = require('bcrypt');
const expressJwt = require('express-jwt');
const jwt = require('jsonwebtoken');

const User = require('../models/user.model');
//
const { BadRequest400 } = require('../helpers/bad-request.error');
const { Unauthorized401 } = require('../helpers/unauthorized.error');
const { NotFound404 } = require('../helpers/not-found.error');
const { Forbidden403 } = require('../helpers/forbidden.error');
// const { isTokenExpired } = require('../helpers/is-token-expired');

const signin = async (req, res, next) => {
  try {
    // use token(bearer) if there is
    const authorization =
      req.headers.authorization || req.headers.Authorization;

    const currToken = authorization?.replace('Bearer ', '');

    // if (currToken && !isTokenExpired(currToken)) {
    if (currToken) {
      const decoded = jwt.verify(currToken, process.env.JWT_SECRET);

      const user = await User.findOne({ email: decoded.email }).lean().exec();

      // console.log('user using old-token:', user.email);

      user.hashed_password = undefined;
      user.salt = undefined;

      return res.json({ user });
    }

    // login normally
    const { email, password } = req.body;

    if (!email || !password) {
      return next(new BadRequest400('all fields required /signin'));
    }

    const user = await User.findOne({ email }).exec();

    // console.log(user)

    if (!user) {
      // 401?
      return next(new Unauthorized401('No user /signin'));
    }

    // need to await, must be boolean
    const pwdMatch = await compare(password, user.hashed_password);

    if (!pwdMatch) {
      return next(new Unauthorized401('wrong pass /signin'));
    }

    const token = jwt.sign(
      { email: user.email, role: user.role },
      process.env.JWT_SECRET,
      {
        expiresIn: '1hr'
      }
    );

    const refreshToken = jwt.sign(
      { email: user.email },
      process.env.REFRESH_SECRET,
      {
        expiresIn: '7d' // same to res.cookie
      }
    );

    user.refresh_token = refreshToken;
    const result = await user.save();

    console.log('user at token');

    if (!result) {
      return next(new BadRequest400('error at saving token'));
    }

    // access by express-jwt through cookie
    // using it secret, to decode
    // frontend must have 'credentials'
    res.cookie('jwt', refreshToken, {
      maxAge: 7 * 24 * 60 * 60 * 1000 // same to refreshToken
    });

    // remove password-related
    user.hashed_password = undefined;
    user.salt = undefined;

    // user.toObject() ?
    return res.json({ token, user });
  } catch (error) {
    return next(error);
  }
};

const register = async (req, res, next) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password) {
      return next(new BadRequest400('all fields required'));
    }

    // password encrypt
    const salt = await genSalt();
    const hashedPassword = await hash(password, salt);

    const user = await User.create({
      email,
      password,
      name,
      salt,
      hashed_password: hashedPassword
    });

    if (!user) {
      return next(new Unauthorized401('invalid user'));
    }

    // strip
    user.hashed_password = undefined;
    user.salt = undefined;

    return res.status(201).json({ user });
  } catch (error) {
    return next(error);
  }
};

const refresh = async (req, res, next) => {
  try {
    // required cookieParser
    const { cookies } = req;

    console.log('cookies:', cookies);

    if (!cookies.jwt) return res.sendStatus(401);
    const refreshToken = cookies.jwt;

    // console.log(token)
    const user = await User.findOne({ refresh_token: refreshToken })
      .lean()
      .exec();

    console.log('user', user);

    if (!user) {
      return next(new Forbidden403('forbidden'));
      // return res.sendStatus(403); // Forbidden
    }

    return jwt.verify(
      refreshToken,
      process.env.REFRESH_SECRET,
      (err, decoded) => {
        console.log('inside');
        if (err || user.email !== decoded.email) {
          console.log(err);
          console.log('user', user.email);
          console.log('decod', decoded);
          return next(new Forbidden403('forbidden'));
        } // forbidden

        const token = jwt.sign(
          { email: user.email, role: user.role },
          process.env.JWT_SECRET,
          {
            expiresIn: '1hr'
          }
        );

        // strip
        user.hashed_password = undefined;
        user.salt = undefined;

        return res.json({ token, user });
      }
    );

    // return res.json('refresh')
  } catch (error) {
    return next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    await res.clearCookie('jwt');

    return res.sendStatus(204);
  } catch (error) {
    return next(error);
  }
};

const userById = async (req, res, next) => {
  try {
    const { userId } = req.params;

    if (!userId || !mongoose.isValidObjectId(userId)) {
      return next(new Unauthorized401('wrong id number'));
    }

    const user = await User.findById(userId)
      .select('-hashed_password -salt')
      .exec();

    if (!user) {
      return next(new Unauthorized401('user not found'));
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
// then mount data to req.auth
const isLogin = expressJwt({
  secret: process.env.JWT_SECRET,
  // audience:'http://',
  // issuer: 'http://',
  algorithms: ['HS256'],
  requestProperty: 'auth'
});

// isAuth or hasAuth
// place at route with /:userId
const isAuth = (req, res, next) => {
  try {
    // console.log({reqUser: req.user, reqAuth: req.auth })
    const authorized =
      req.user && req.auth && String(req.user.email) === String(req.auth.email);

    if (!authorized) {
      return next(new Unauthorized401('User not Authorized!'));
    }

    return next();
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  signin,
  register,
  refresh,
  logout,
  isLogin,
  isAuth,
  userById
};
