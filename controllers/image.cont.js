// const clarifai = require('clarifai');
// const mongoose = require('mongoose');
const { ClarifaiStub, grpc } = require('clarifai-nodejs-grpc');

const User = require('../models/user.model');

// const clarifaiApp = new clarifai.App({
//   apiKey: process.env.CLARIFAI_API_KEY
// });

// https://img.freepik.com/premium-photo/closeup-woman-face-contour-highlight-makeup-sample-professional-contouring-face-white-background_431835-2836.jpg
// https://i.pinimg.com/originals/ac/e5/b6/ace5b63937f20c73ef9cf163568c82bc.jpg
// https://i2-prod.mirror.co.uk/incoming/article5428573.ece/ALTERNATES/s615b/archetypal-female-_3249633c.jpg

// new
const requestApi2 = async (req, res, next) => {
  const { body } = req;

  console.log({ body });

  const stub = ClarifaiStub.grpc();

  // This will be used by every Clarifai endpoint call
  const metadata = new grpc.Metadata();
  metadata.set('authorization', `Key ${process.env.CLARIFAI_API_KEY}`);

  stub.PostModelOutputs(
    {
      model_id: 'face-detection',
      inputs: [
        { data: { image: { url: req.body.input, allow_duplicate_url: true } } }
      ]
    },
    metadata,
    (err, response) => {
      if (err) {
        return next(err);
      }

      if (response.status.code !== 10000) {
        // console.log(IMAGE_URL)
        console.log(response.status.description);
        return Error(`status: ${response.status.description}`);
      }

      // Since we have one input, one output will exist here
      const output = response.outputs[0];

      // console.log("Predicted concepts:");
      // for (const concept of output.data.concepts) {
      //     console.log(concept.name + " " + concept.value);
      // }
      // console.log(output)
      return res.json(output);
    }
  );
};

// old
const requestApi = async (req, res, next) => {
  try {
    const { body } = req;

    // const data = await clarifaiApp.models.predict(
    // clarifai.FACE_DETECT_MODEL,
    // clarifai.DEMOGRAPHICS_MODEL,
    // id: 'aa7f35c01e0642fda5cf400f543e7c40'
    // 'aaa03c23b3724a16a56b629203edc62c',
    // a403429f2ddf4b49b307e318f00e528b

    //   {
    //     id: 'a403429f2ddf4b49b307e318f00e528b',
    //     version: '34ce21a40cc24b6b96ffee54aabff139'
    //   },
    //   req.body.input
    // );

    // if (!data) {
    //   return next(Error('no clarifai data'));
    // }

    // const user = await User.findOne({ email: 'joejoe@gmail.com' })
    //   .select('history')
    //   .exec();

    // if (!user) {
    //   return next(Error('no user'));
    // }

    // user.history.push(body.input);
    // await user.save();

    // return res.json(data);
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

module.exports = { handleImage, requestApi2 };
