require('dotenv').config();
const request = require('supertest');
const jwt = require('jsonwebtoken');

// const mongoose = require('mongoose');

// const server = require('./server2');
const expressApp = require('./app');
const { connectMDB, mongoDisconnect } = require('./db');

const validLogin = {
  email: 'guest@gmail.com',
  password: 'guest'
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

beforeEach(async () => {
  await connectMDB();
});

afterEach(async () => {
  await mongoDisconnect();
});

// [] TODO, dealing w/ isLogin()
// Error must be jwt-express

describe('/register', () => {
  it('register valid', async () => {
    // supertest has convenient way http
    const resp = await request(expressApp)
      .post('/users')
      .expect('Content-Type', /json/) // regex json
      .expect(201);
  });

  it('duplicate', async () => {
    const resp = await request(expressApp)
      .post('/users')
      .expect('Content-Type', /json/) // regex json
      .expect(201);
  });
});

describe('/signin', () => {
  it('POST /signin guest', async () => {
    // supertest has convenient way http
    const resp = await request(expressApp)
      .post('/signin')
      .send(validLogin)
      .expect('Content-Type', /json/) // regex json
      .expect(200);

    // cookie
    // .expect('set-cookie', /jwt=.* .../);
    expect(resp.headers['set-cookie'][0]).toMatch(
      /jwt=.*; Max-Age=.*; Path=\/; Expires=.*/
    );

    // has token, user
    expect(resp.body).toHaveProperty('token');
    expect(resp.body).toHaveProperty('user');

    expect(resp.body.user).toMatchObject({ email: validLogin.email });

    // no password related
    expect(resp.body.user.salt).toBeUndefined();
    expect(resp.body.user.hashed_password).toBeUndefined();
  });

  it('invalid password', async () => {
    const resp = await request(expressApp)
      .post('/signin')
      .send(invalidPass)
      .expect('Content-Type', /json/) // regex json
      .expect(401);

    expect(resp.body.error).toMatch(/Unauthorized401/);
  });

  it('invalid/not-found user/email', async () => {
    const resp = await request(expressApp)
      .post('/signin')
      .send(invalidEmail)
      .expect('Content-Type', /json/) // regex json
      .expect(401);

    expect(resp.body.error).toMatch(/Unauthorized401/);
  });
});

describe('/logout', () => {
  it('logout', async () => {
    // supertest has convenient way http
    const resp = await request(expressApp).get('/logout').expect(204);

    // no content coz 204
    expect(resp.headers['Content-Type']).toBeUndefined();

    // clear/reset
    expect(resp.headers['set-cookie'][0]).toMatch(
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
