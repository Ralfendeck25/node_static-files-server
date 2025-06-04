const { createServer } = require('../src/createServer');
const request = require('supertest');

describe('Static Files Server', () => {
  let server;

  beforeAll(() => {
    server = createServer();
  });

  afterAll((done) => {
    server.close(done);
  });

  it('should respond to valid file requests', async () => {
    const response = await request(server)
      .get('/file/index.html')
      .expect(200);
    expect(response.text).toContain('<!DOCTYPE html>');
  });

  it('should block path traversal attempts', async () => {
    const attempts = [
      '/file/../app.js',
      '/file/..\\app.js',
      '/file/./../app.js',
      '/file/.../app.js',
      '/file/%2e%2e/app.js'
    ];

    for (const path of attempts) {
      await request(server)
        .get(path)
        .expect(400);
    }
  });
});
