const mongoose = require('mongoose');
const { genSalt, hash, compare } = require('bcrypt')
const expressJwt = require('express-jwt');
const jwt = require('jsonwebtoken');

const User = require('../models/user.model');
const { NotFoundError } = require('../helpers/error-status')

const signin = async (req, res, next) => {
  try {

  const authorization = req.headers['authorization'] ||  req.headers['Authorization']

  console.log('auth:', authorization)

    if(authorization){

    const decoded = jwt.verify(
      authorization.replace('Bearer ', ''),
      process.env.JWT_SECRET
      )

    // toObject vs lean()
    const user = await User.findOne({ email: decoded.email }).lean().exec()

    console.log('user using auth', user)

    user.hashed_password = undefined;
    user.salt = undefined;
  
    return res.json({ user });
    }  
    
    const { email, password } = req.body;

    if (!email || !password) {
      const err = Error('all field required /signin');

      err.statusCode = 400
      return next(err);
    }

    const user = await User.findOne({ email }).exec();

     // console.log(user)

    if (!user) {
      const err = Error('No such user /signin');
      err.statusCode = 401;

      return next(err);
    }

    // need to await, must be boolean
    // const pwdMatch = await user.validatePassword(password)
    const pwdMatch = await compare(password, user.hashed_password)

    if (typeof pwdMatch !== 'boolean' || !pwdMatch) {
      const err = Error('wrong password /signin');
      err.statusCode = 401;

      return next(err);
    }

    const token = jwt.sign({ email: user.email, role:user.role }, process.env.JWT_SECRET, {
      expiresIn: '1hr'
    });

    const refreshToken = jwt.sign({ email: user.email }, process.env.REFRESH_SECRET, {
      expiresIn: '1d'
    })

    user.refresh_token = refreshToken;
    const result = await user.save();

    console.log('user at token')

    if(!result){
      return next(Error('error saving token'))
    }

    // access by express-jwt through cookie
    // using it secret, to decode
    res.cookie('jwt', refreshToken);


    // remove password-related
    user.hashed_password = undefined;
    user.salt = undefined;

    return res.json({ token, user: user.toObject() });
  } catch (error) {
    error.statusCode(401);
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

const refresh = async (req, res, next) => {
  try{
    // required cookieParser
    const { cookies } = req

    console.log('cookies:', cookies)

    if(!cookies.jwt) return res.sendStatus(401);
    const refreshToken = cookies.jwt

    // console.log(token)
    const user = await User.findOne({ refresh_token: refreshToken }).lean().exec()

    console.log('user',user)

    if(!user){
      return res.sendStatus(403); // Forbidden
    }

    jwt.verify(
      refreshToken,
      process.env.REFRESH_SECRET,
      (err, decoded) => {
        console.log('inside')
        if(err || user.email !== decoded.email) {
          console.log(err)
          console.log('user', user.email)
          console.log('decod', decoded)
          return res.sendStatus(403);
        } // forbidden

        const token = jwt.sign({ email: user.email, role:user.role }, process.env.JWT_SECRET, {
          expiresIn: '1hr'
         });

         // strip
        user.hashed_password = undefined;
        user.salt = undefined;

        return res.json({ token, user });
      }
      )

    // return res.json('refresh')
  } catch(error){
    return next(error)
  }
}

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
  refresh,
  logout,
  isLogin,
  isAuth,
  userById
};
