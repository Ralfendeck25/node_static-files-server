'use strict';

const http = require('http');
const path = require('path');
const fs = require('fs');

function createServer() {
  const server = http.createServer((req, res) => {
    if (!req.url) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'text/plain');
      res.end('Invalid URL');
      return;
    }

    // Use URL constructor instead of url.parse()
    const baseURL = `http://${req.headers.host || 'localhost'}`;
    let givenUrl;
    try {
      givenUrl = new URL(req.url, baseURL);
    } catch (err) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'text/plain');
      res.end('Invalid URL format');
      return;
    }

    const givenPath = decodeURIComponent(givenUrl.pathname);

    if (!givenPath.startsWith('/file/')) {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'text/plain');
      res.end('Access files via /file/ route');
      return;
    }

    if (givenPath.includes('../') || givenPath.includes('..\\')) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'text/plain');
      res.end('Path traversal detected');
      return;
    }

    if (givenPath.includes('//')) {
      res.statusCode = 404;
      res.setHeader('Content-Type', 'text/plain');
      res.end('Avoid duplicated slashes');
      return;
    }

    const filePath = givenPath.slice(6) || 'index.html';
    const fullPath = path.join(__dirname, '..', 'public', filePath);
    const normalizedPath = path.normalize(fullPath);
    const publicDir = path.normalize(path.join(__dirname, '..', 'public'));

    if (!normalizedPath.startsWith(publicDir)) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'text/plain');
      res.end('Invalid path');
      return;
    }

    fs.readFile(normalizedPath, (err, data) => {
      if (err) {
        res.statusCode = 404;
        res.setHeader('Content-Type', 'text/plain');
        res.end('File not found');
        return;
      }

      let contentType = 'text/plain';
      const ext = path.extname(normalizedPath).toLowerCase();
      if (ext === '.html') contentType = 'text/html';
      if (ext === '.css') contentType = 'text/css';
      if (ext === '.js') contentType = 'text/javascript';
      if (ext === '.json') contentType = 'application/json';
      if (ext === '.png') contentType = 'image/png';
      if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';

      res.statusCode = 200;
      res.setHeader('Content-Type', contentType);
      res.end(data);
    });
  });

  return server;
}

module.exports = { createServer };
