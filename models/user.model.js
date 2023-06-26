const mongoose = require('mongoose');
const { genSaltSync, hashSync, compareSync } = require('bcrypt');

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
      trim: true,
      match: [/.+@.+\..+/, 'Email must contain @'],
      minlength: 4,
      maxlength: 32
    },
    role: {
      type: Number,
      default: 0
    },
    history: {
      type: Array,
      default: []
    },
    hashed_password: {
      type: String,
      required: true
    },
    salt: {
      type: String
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

/**
 *  pre save
 */
// cannot be use 'if required"
// userSchema.pre('save', function(next) {
//  // eslint-disable-next-line
//   this.name = this.email.split('@')[0];
//   next();
// });

/**
 *  Statics
 */

/**
 * Virtuals
 */

userSchema
  .virtual('password')
  .set(function passVirtSet(password) {
    this._password = password;
    this.salt = genSaltSync();

    this.hashed_password = hashSync(password, this.salt);
  })
  .get(function passVirtGet() {
    return this._password;
  });

/**
 * Paths
 */

// validate this._password (virtual)
userSchema.path('hashed_password').validate(function hashPassPathValidate(val) {
  // min of 5 char
  if (this._password && this._password.length < 5) {
    // invalidates the incoming 'password'
    // Document#invalidate(<path>, <errorMsg>)
    this.invalidate('password', 'Password must be at least 6 chars');
  }

  // Document#isNew (return boolean)
  // dealing w/ new register/signup w/ empty password
  if (this.isNew && !this._password) {
    // invalidates the incoming 'password'
    this.invalidate('password', 'Password is required!');
  }
}, null);

/**
 * Paths
 */

userSchema.methods = {
  validatePassword(passwordGiven) {
    // encrypting password is one-way
    // we only compare the hash_password and the encrypted password-given
    return compareSync(passwordGiven, this.hashed_password);
  }
};

module.exports = model('user', userSchema);
