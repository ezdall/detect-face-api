require('dotenv').config();
const request = require('supertest');

const expressApp = require('./app');
const { connectMDB, mongoDisconnect } = require('./db');

beforeEach(async () => {
  await connectMDB();
});

afterEach(async () => {
  await mongoDisconnect();
});

// describe('get users', () => {
//   it('GET /users show all users', async () => {
//     const resp = await request(expressApp).get('/users');

//     // console.log(resp.status);

//     expect(resp.statusCode).toBe(200);
//   });
// });

describe('get users', () => {
  it('GET /users show all users', async () => {
    // supertest has convenient way http
    const resp = await request(expressApp)
      .get('/users')
      .expect('Content-Type', /json/) // regex json
      .expect(200);
  });
});

describe('login, logout', () => {
  it('POST /login guest', async () => {
    // supertest has convenient way http
    const resp = await request(expressApp)
      .post('/signin')
      .send({
        email: 'guest@gmail.com',
        password: 'guest'
      })
      .expect('Content-Type', /json/) // regex json
      .expect(200);

    // console.log(resp.body);

    expect(resp.body.user.email).toBe('guest@gmail.com');
  });

  it('POST /login wrong', async () => {
    // supertest has convenient way http
    const resp = await request(expressApp)
      .post('/signin')
      .send({
        email: 'guest1@gmail.com',
        password: 'guest1'
      })
      .expect('Content-Type', /json/) // regex json
      .expect(401);
  });

  it('GET /logout', async () => {
    // supertest has convenient way http
    await request(expressApp).get('/logout').expect(204);
  });
});
