require('dotenv').config();
const request = require('supertest');
const mongoose = require('mongoose');

const { connectMDB, mongoDisconnect } = require('./db');
const app = require('./app');

const input = {
  email: 'janedoe@gmail.com',
  password: 'janedoe'
};

let validUser;
let token;

beforeAll(async () => {
  await connectMDB();

  await request(app).post('/register').send(input);

  const { body } = await request(app).post('/signin').send(input);

  validUser = body.user;

  token = body.token;
});

// beforeEach(async () => {});

// afterEach(async () => {
//   // await mongoose.connection.dropCollection('users');
// });

afterAll(async () => {
  await mongoose.connection.dropCollection('users');

  await mongoDisconnect();
});

describe('GET /users', () => {
  it('show users ', async () => {
    const { body } = await request(app)
      .get('/users')
      .expect('Content-Type', /json/) // regex json
      .expect(200);

    expect(Array.isArray(body)).toBeTruthy();
  });
});

describe('GET /profile/:userId', () => {
  it('return user (200)', async () => {
    const { body } = await request(app)
      .get(`/profile/${validUser._id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect('Content-Type', /json/)
      .expect(200);

    expect(body).toMatchObject({
      email: validUser.email,
      _id: validUser._id.toString()
    });
  });

  it('no bearer token', async () => {
    const { body } = await request(app)
      .get(`/profile/${validUser._id}`)
      .set('Authorization', 'Bearer in.valid.token')
      .expect('Content-Type', /json/)
      .expect(401);

    expect(body.error).toMatch(/invalid token/);
  });
});

describe('PUT /profile/:userId', () => {
  it('update user', async () => {
    const updateData = {
      name: 'visitor'
    };

    const { body } = await request(app)
      .put(`/profile/${validUser._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send(updateData)
      .expect('Content-Type', /json/)
      .expect(200);

    expect(body).toMatchObject({
      email: validUser.email,
      _id: validUser._id.toString(),
      ...updateData
    });
  });

  it('empty edit, 400 error', async () => {
    const updateData = {
      name: ''
    };

    const { body } = await request(app)
      .put(`/profile/${validUser._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send(updateData)
      .expect('Content-Type', /json/)
      .expect(400);

    expect(body).toHaveProperty('error');

    expect(body.error).toMatch(/validation error/);
  });
});

describe('POST /image-url', () => {
  it('clarifai data success 200', async () => {
    const { body } = await request(app)
      .post('/image-url')
      .set('Authorization', `Bearer ${token}`)
      .send({
        input:
          'https://img.freepik.com/free-photo/beautiful-caucasian-female-face-with-bright-fashion-makeup_186202-2064.jpg'
      })
      .expect('Content-Type', /json/)
      .expect(200);

    expect(body).toHaveProperty('data.regions[0].region_info.bounding_box');

    const boundingBox = body.data.regions[0].region_info.bounding_box;

    expect(boundingBox).toMatchObject({
      top_row: expect.any(Number),
      bottom_row: expect.any(Number),
      left_col: expect.any(Number),
      right_col: expect.any(Number)
    });
  });

  it('invalid input clarifai', async () => {
    const { body } = await request(app)
      .post('/image-url')
      .set('Authorization', `Bearer ${token}`)
      .send({ input: 'example.com' })
      .expect('Content-Type', /json/)
      .expect(400);

    expect(body.error).toMatch(/invalid/);
  });
});

//
describe('PATCH /image', () => {
  it('valid entries', async () => {
    const { body } = await request(app)
      .patch('/image')
      .set('Authorization', `Bearer ${token}`)
      .send({
        email: validUser.email,
        input:
          'https://img.freepik.com/premium-photo/closeup-woman-face-contour-highlight-makeup-sample-professional-contouring-face-white-background_431835-2836.jpg'
      })
      .expect('Content-Type', /json/)
      .expect(200);

    expect(body).toMatchObject({
      entries: expect.any(Number)
    });
  });
});
