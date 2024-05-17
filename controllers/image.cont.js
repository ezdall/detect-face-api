// const clarifai = require('clarifai');
// const mongoose = require('mongoose');
const { ClarifaiStub, grpc } = require('clarifai-nodejs-grpc');

const User = require('../models/user.model');

const { BadRequest400 } = require('../helpers/bad-request.error');
const { Unauthorized401 } = require('../helpers/unauthorized.error');

// const clarifaiApp = new clarifai.App({
//   apiKey: process.env.CLARIFAI_API_KEY
// });

// https://img.freepik.com/premium-photo/closeup-woman-face-contour-highlight-makeup-sample-professional-contouring-face-white-background_431835-2836.jpg
// https://i.pinimg.com/originals/ac/e5/b6/ace5b63937f20c73ef9cf163568c82bc.jpg
// https://i2-prod.mirror.co.uk/incoming/article5428573.ece/ALTERNATES/s615b/archetypal-female-_3249633c.jpg

// new
const requestApi2 = async (req, res, next) => {
  const stub = ClarifaiStub.grpc();

  // This will be used by every Clarifai endpoint call
  const metadata = new grpc.Metadata();
  metadata.set('authorization', `Key ${process.env.CLARIFAI_API_KEY}`);

  stub.PostModelOutputs(
    {
      model_id: 'face-detection',
      inputs: [
        {
          data: {
            image: {
              url: req.body.input
              // allow_duplicate_url: true
            }
          }
        }
      ]
    },
    metadata,
    (err, response) => {
      if (err) {
        console.log({ ...err });
        return next(err);
      }

      // if not success (10,000)
      if (response.status.code !== 10000) {
        // console.log({ ...response });

        return next(new BadRequest400(response.status.description));
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

const handleImage = async (req, res, next) => {
  try {
    const { body } = req;

    // if (auth.email !== body.email) {
    //   throw Error('email not match, unauthorized');
    // }

    const user = await User.findOne({ email: body.email })
      .select('history')
      .exec();

    if (!user) {
      return next(new Unauthorized401('invalid user /handleImage'));
    }

    user.history.push(body.input);
    await user.save();

    return res.json({ entries: user.history.length });
  } catch (error) {
    return next(error);
  }
};

module.exports = { handleImage, requestApi2 };
