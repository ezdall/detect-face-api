const mongoose = require('mongoose');
// const { genSaltSync, hashSync, compareSync, genSalt, hash, compare } = require('bcrypt');

const { Schema, model } = mongoose;

const userSchema = new Schema(
  {
    name: {
      type: String,
      trim: true,
      minlength: 1,
      maxlength: 32
    },
    email: {
      type: String,
      required: 'email is required',
      unique: 'email already exists',
      match: [/.+@.+\..+/, 'Email must contain @'],
      trim: true,
      minlength: 4,
      maxlength: 32
    },
    role: {
      type: Array
      // default: ['user']
    },
    history: {
      // this must be entries
      type: Array,
      default: []
    },
    hashed_password: {
      type: String,
      required: true
    },
    salt: {
      type: String
    },
    refresh_token: String
  },
  {
    timestamps: true,
    versionKey: false
  }
);

/**
 *  pre save
 */

// hard to detect error for async
// need to transfer, password-handling at auth.cont.js
// for good error handling
// userSchema.pre('save', async function(next) {
//   try{
//     this.salt = await genSalt();
//     this.hashed_password = await hash(this._password, this.salt)

//     return next();
//   } catch (error){
//     return next(error)
//   }

// });

/**
 *  Statics
 */

/**
 * Virtuals
 */

// "require" will trigger here

userSchema
  .virtual('password')
  .set(function passVirtSet(password) {
    this._password = password;
  })
  .get(function passVirtGet() {
    return this._password;
  });

/**
 * Paths
 */

// validate this._password (virtual)
// 'hashed_password'
userSchema.path('salt').validate(function hashPassPathValidate(val) {
  // min of 5 char
  if (this._password && this._password.length < 5) {
    // invalidates the incoming 'password'
    // Document#invalidate(<path>, <errorMsg>)
    this.invalidate('password', 'Password must be at least 5 chars');
  }

  // Document#isNew (return boolean)
  // dealing w/ new register/signup w/ empty password
  if (this.isNew && !this._password) {
    // invalidates the incoming 'password'
    this.invalidate('password', 'ppPassword is required!');
  }
}, null);

/**
 * Paths
 */

// userSchema.methods = {
//   validatePassword(passwordGiven) {
//     // encrypting password is one-way
//     // we only compare the hash_password and the encrypted password-given

//     // compare is async
//     return compare(passwordGiven, this.hashed_password);
//   }
// };

module.exports = model('user', userSchema);
