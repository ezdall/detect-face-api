const clarifai = require('clarifai');
// const mongoose = require('mongoose');

const User = require('../models/user.model');

const clarifaiApp = new clarifai.App({
  apiKey: process.env.CLARIFAI_API_KEY
});

const requestApi = async (req, res, next) => {
  try {
    const { body } = req;
    const data = await clarifaiApp.models.predict(
      // clarifai.FACE_DETECT_MODEL,
      // clarifai.DEMOGRAPHICS_MODEL,
      // 'aaa03c23b3724a16a56b629203edc62c',
      {id: 'aa7f35c01e0642fda5cf400f543e7c40'},
      req.body.input
    );

    if (!data) {
      return next(Error('no clarifai data'));
    }

    const user = await User.findOne({ email: 'joejoe@gmail.com' })
      .select('history')
      .exec();

    if (!user) {
      return next(Error('no user'));
    }

    user.history.push(body.input);
    await user.save();

    return res.json(data);
  } catch (error) {
    console.log(error.toString());
    return next(error);
  }
};

const handleImage = async (req, res, next) => {
  try {
    const { body, auth } = req;

    // if (auth.email !== body.email) {
    //   throw Error('email not match, unauthorized');
    // }

    const user = await User.findOne({ email: body.email })
      .select('history')
      .exec();

    user.history.push(body.input);
    await user.save();

    return res.json({ entries: user.history.length });
  } catch (error) {
    return next(error);
  }
};

module.exports = { handleImage, requestApi};
