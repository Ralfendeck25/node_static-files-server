'use strict';

const http = require('http');
const path = require('path');
const fs = require('fs');

function createServer() {
  return http.createServer((req, res) => {
    if (!req.url) {
      res.statusCode = 400;
      return res.end('Invalid URL');
    }

    const requestedPath = decodeURIComponent(req.url);
    const baseRoute = '/file/';

    if (!requestedPath.startsWith(baseRoute)) {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'text/plain');
      return res.end('Access files via /file/ route');
    }

    const relativePath = requestedPath.slice(baseRoute.length);
    const normalizedRelative = path.normalize(relativePath).replace(/\\/g, '/');

    // Block path traversal
    if (relativePath.includes('../') ||
        relativePath.includes('..\\') ||
        normalizedRelative.includes('../') ||
        path.isAbsolute(relativePath)) {
      res.statusCode = 400;
      return res.end('Path traversal detected');
    }

    const publicDir = path.join(__dirname, '..', 'public');
    const fullPath = path.join(publicDir, relativePath);
    const normalizedPath = path.normalize(fullPath);

    // Verify the path is inside public directory
    if (!normalizedPath.startsWith(path.normalize(publicDir))) {
      res.statusCode = 400;
      return res.end('Invalid path');
    }

    fs.stat(normalizedPath, (err, stats) => {
      if (err || !stats.isFile()) {
        res.statusCode = 404;
        return res.end('File not found');
      }

      const stream = fs.createReadStream(normalizedPath);

      stream.on('error', () => {
        res.statusCode = 500;
        res.end('Internal Server Error');
      });

      const ext = path.extname(normalizedPath).toLowerCase();
      const contentType = {
        '.html': 'text/html',
        '.css': 'text/css',
        '.js': 'text/javascript',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.txt': 'text/plain'
      }[ext] || 'application/octet-stream';

      res.statusCode = 200;
      res.setHeader('Content-Type', contentType);
      stream.pipe(res);
    });
  });
}

module.exports = { createServer };
