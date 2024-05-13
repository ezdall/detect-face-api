require('dotenv').config();
const request = require('supertest');
const jwt = require('jsonwebtoken');

// const mongoose = require('mongoose');

const User = require('./models/user.model');
const { connectMDB, mongoDisconnect } = require('./db');
const expressApp = require('./app');

const validLogin = {
  email: 'guest@gmail.com',
  password: 'guest'
};

const casedLogin = {
  email: 'GuEsT@gmail.com',
  password: 'guest'
};

const spacePass = {
  email: 'guest@gmail.com',
  password: '        '
};

const invalidPass = {
  email: 'guest@gmail.com',
  password: 'guest2'
};

const invalidEmail = {
  email: 'guest22@gmail.com',
  password: 'guest'
};

const invalidLogin = {
  email: 'hacker@gmail.com',
  password: 'hacker'
};

const spacePassRegister = {
  email: 'janedoe@gmail.com',
  password: '       '
};

const validRegister = {
  email: 'johndoe@gmail.com',
  password: 'johndoe'
};

const invalidRegister = {};

const lackPassRegister = {};

beforeAll(async () => {
  await connectMDB();
});

// beforeEach(async () => {});

// afterEach(async () => {});

afterAll(async () => {
  const user = await User.findOne({ email: validRegister.email }).exec();

  // delete reg-user after test
  if (user) {
    await user.deleteOne();
  }

  await mongoDisconnect();
});

// [] TODO, dealing w/ isLogin()
// Error must be jwt-express

// console.log({
//   body: resp.body,
//   head: resp.headers
// });

describe('POST /register', () => {
  it('register success (201)', async () => {
    // supertest has convenient way http
    const { body } = await request(expressApp)
      .post('/register')
      .send(validRegister)
      .expect('Content-Type', /json/) // regex json
      .expect(201);

    expect(body).toHaveProperty('user');

    expect(body.user).toMatchObject({
      email: validRegister.email
    });

    // no password related
    expect(body.user).not.toHaveProperty('password');
    expect(body.user).not.toHaveProperty('salt');
    expect(body.user).not.toHaveProperty('hashed_password');
  });

  it('register duplicate (409) error', async () => {
    const { body } = await request(expressApp)
      .post('/register')
      .send(validLogin)
      .expect('Content-Type', /json/)
      .expect(409); // express-jwt duplicate error

    expect(body.error).toMatch(/already exist/);
  });

  it('register duplicate (409) in upper-case', async () => {
    // email has lowercase: true

    const { body } = await request(expressApp)
      .post('/register')
      .send(casedLogin)
      .expect('Content-Type', /json/)
      .expect(409); //

    expect(body.error).toMatch(/already exist/);
  });

  it('register w/ space-password, (400) error', async () => {
    const { body } = await request(expressApp)
      .post('/register')
      .send(spacePassRegister)
      .expect('Content-Type', /json/)
      .expect(400); //

    expect(body.error).toMatch(/validation error/);
    // expect(body.error).toMatch(/all fields required/);
  });
});

describe('POST /signin', () => {
  it('valid signin (200) resp w/ cookie', async () => {
    // destructure
    const { headers, body } = await request(expressApp)
      .post('/signin')
      .send(validLogin)
      .expect('Content-Type', /json/) // regex json
      .expect(200);

    // cookie
    // .expect('set-cookie', /jwt=.* .../);
    expect(headers['set-cookie'][0]).toMatch(
      /jwt=.*; Max-Age=\d+; Path=\/; Expires=.*/
      // or /jwt=.*; Max-Age=\d+; Path=\/; Expires=.*; HttpOnly/
    );

    // has token, user
    expect(body).toHaveProperty('token');
    expect(body).toHaveProperty('user');

    // has refresh-token?

    // email is same w/ response
    expect(body.user).toMatchObject({ email: validLogin.email });

    // no password related
    expect(body.user).not.toHaveProperty('password');
    expect(body.user).not.toHaveProperty('salt');
    expect(body.user).not.toHaveProperty('hashed_password');
  });

  it('auto-login using cookies.jwt', async () => {
    const token = jwt.sign({ email: validLogin.email }, process.env.JWT_SECRET);

    const { body } = await request(expressApp)
      .post('/signin')
      .set('Authorization', `Bearer ${token}`)
      .expect('Content-Type', /json/) // regex json
      .expect(200);

    expect(body).toHaveProperty('user');

    expect(body.user).toMatchObject({ email: validLogin.email });

    // no password related
    expect(body.user).not.toHaveProperty('password');
    expect(body.user).not.toHaveProperty('salt');
    expect(body.user).not.toHaveProperty('hashed_password');
  });

  it('auto-login invalid token (401)', async () => {
    const invalidToken = 'the.invalid.token';

    const { body } = await request(expressApp)
      .post('/signin')
      .set('Authorization', `Bearer ${invalidToken}`)
      .expect('Content-Type', /json/) // regex json
      .expect(401);

    expect(body).toHaveProperty('error');

    expect(body.error).toMatch(/(jwt|token|signature)/);
  });

  it('spaced password, (401) error', async () => {
    const { body } = await request(expressApp)
      .post('/signin')
      .send(spacePass)
      .expect('Content-Type', /json/) // regex json
      .expect(401);

    expect(body.error).toMatch(/wrong pass/);
    // expect(resp.body.error).toMatch(/all fields required/);
  });

  it('wrong password, (401) error', async () => {
    const { body } = await request(expressApp)
      .post('/signin')
      .send(invalidPass)
      .expect('Content-Type', /json/) // regex json
      .expect(401);

    expect(body.error).toMatch(/wrong pass/);
  });

  it('invalid or not-found user/email', async () => {
    const { body } = await request(expressApp)
      .post('/signin')
      .send(invalidEmail)
      .expect('Content-Type', /json/) // regex json
      .expect(401);

    expect(body.error).toMatch(/No user/);
  });
});

describe('GET /logout', () => {
  it('logout 204 (no-content), clear cookie', async () => {
    // supertest has convenient way http
    const { headers } = await request(expressApp).get('/logout').expect(204);

    // no content, empty body coz 204
    expect(headers).not.toHaveProperty('Content-Type');

    // clear/reset
    expect(headers['set-cookie'][0]).toMatch(
      'jwt=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT'
    );
  });
});

// describe('get users', () => {
//   it('GET /users show all users', async () => {
//     // supertest has convenient way http
//     await request(expressApp)
//       .get('/users')
//       .expect('Content-Type', /json/) // regex json
//       .expect(200);
//   });

//   console.log({ agent });
// })
