'use strict';

const http = require('http');
const path = require('path');
const fs = require('fs');
const url = require('url');

const PUBLIC_FOLDER = path.join(__dirname, 'public');

function createServer() {
  return http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url);
    const pathname = decodeURIComponent(parsedUrl.pathname);

    // Block path traversal attempts
    if (pathname.includes('../') || pathname.includes('..\\')) {
      res.writeHead(400, { 'Content-Type': 'text/plain' });
      res.end('Path traversal detected');
      return;
    }

    // Handle /file/ routes
    if (pathname.startsWith('/file/')) {
      const filePath = pathname.slice(6); // Remove '/file/'
      const fullPath = path.join(PUBLIC_FOLDER, filePath);

      // Normalize path and check it's still within public folder
      const normalizedPath = path.normalize(fullPath);
      if (!normalizedPath.startsWith(PUBLIC_FOLDER)) {
        res.writeHead(400, { 'Content-Type': 'text/plain' });
        res.end('Invalid path');
        return;
      }

      fs.readFile(normalizedPath, (err, data) => {
        if (err) {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('File not found');
          return;
        }

        let contentType = 'text/plain';
        if (path.extname(normalizedPath) === '.html') contentType = 'text/html';
        if (path.extname(normalizedPath) === '.css') contentType = 'text/css';

        res.writeHead(200, { 'Content-Type': contentType });
        res.end(data);
      });
    } else {
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('Access files via /file/ route');
    }
  });
}

module.exports = { createServer };
