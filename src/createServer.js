'use strict';

const http = require('http');
const path = require('path');
const fs = require('fs');

function createServer() {
  const server = http.createServer((req, res) => {
    try {
      // Handle cases where Host header might be missing
      if (!req.headers.host) {
        res.statusCode = 400;
        res.end('Host header is required');
        return;
      }

      // Use URL constructor with proper base URL
      const baseUrl = `http://${req.headers.host}`;
      const givenUrl = new URL(req.url, baseUrl);
      const givenPath = givenUrl.pathname;

      if (!givenPath.startsWith('/file/')) {
        res.setHeader('Content-Type', 'text/plain');
        res.end('Start your path with /file');
        return;
      }

      const rightPath = givenPath.slice(6) || 'index.html';

      if (givenPath.includes('//')) {
        res.statusCode = 404;
        res.setHeader('Content-Type', 'text/plain');
        res.end('Avoid duplicated slashes');
        return;
      }

      const publicDir = path.join(__dirname, '..', 'public');
      const requestedPath = path.join(publicDir, rightPath);
      const normalizedPath = path.normalize(requestedPath);

      if (!normalizedPath.startsWith(publicDir + path.sep)) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'text/plain');
        res.end('You cannot read files outside public folder!');
        return;
      }

      try {
        const fileContent = fs.readFileSync(normalizedPath, 'utf-8');
        const ext = path.extname(normalizedPath).toLowerCase();

        const mimeTypes = {
          '.html': 'text/html',
          '.css': 'text/css',
          '.js': 'text/javascript',
          '.json': 'application/json',
          '.txt': 'text/plain'
        };

        res.setHeader('Content-Type', mimeTypes[ext] || 'text/plain');
        res.end(fileContent);
      } catch (error) {
        if (error.code === 'ENOENT') {
          res.statusCode = 404;
          res.setHeader('Content-Type', 'text/plain');
          res.end('Not Found');
        } else {
          throw error;
        }
      }
    } catch (error) {
      console.error('Server error:', error);
      res.statusCode = 500;
      res.end('Internal Server Error');
    }
  });

  return server;
}

module.exports = {
  createServer,
};
