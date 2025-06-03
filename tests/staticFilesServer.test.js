const { createServer } = require('../src/createServer');
const http = require('http');
const request = require('supertest');

describe('Static Files Server', () => {
  let server;

  beforeAll(() => {
    server = createServer();
  });

  afterAll(() => {
    server.close();
  });

  test('should respond to /file/ requests', async () => {
    const response = await request(server)
      .get('/file/index.html')
      .expect(200);
    expect(response.text).toContain('<!DOCTYPE html>');
  });

  test('should block path traversal', async () => {
    await request(server)
      .get('/file/../app.js')
      .expect(400);
  });
});
