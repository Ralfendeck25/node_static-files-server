'use strict';

const http = require('http');
const path = require('path');
const fs = require('fs');

// Logger simples (adicione este código ou crie em um arquivo separado logger.js)
const logger = {
  error: (message, error) => {
    // Em produção, você poderia enviar para um serviço de log
    // Aqui estamos apenas usando console, mas de forma controlada
    if (process.env.NODE_ENV !== 'production') {
      console.error(`[${new Date().toISOString()}] ERROR:`, message, error);
    }
  },
};

function createServer() {
  return http.createServer((req, res) => {
    if (!req.url) {
      res.statusCode = 400;
      res.end('Invalid URL');
      return;
    }

    // Decode and normalize the URL
    const requestedPath = decodeURIComponent(req.url);
    const baseRoute = '/file/';

    // Handle non-file routes
    if (!requestedPath.startsWith(baseRoute)) {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'text/plain');
      res.end('Access files via /file/ route');
      return;
    }

    // Extract the file path after /file/
    const filePath = requestedPath.slice(baseRoute.length - 1); // Keep leading slash

    // Block path traversal attempts (more comprehensive check)
    if (
      filePath.includes('../') ||
      filePath.includes('..\\') ||
      path.normalize(filePath) !== filePath.replace(/\\/g, '/')
    ) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'text/plain');
      res.end('Path traversal detected');
      return;
    }

    // Resolve full file path with security checks
    const publicDir = path.normalize(path.join(__dirname, '..', 'public'));
    const fullPath = path.join(publicDir, filePath);
    const normalizedPath = path.normalize(fullPath);

    // Verify path is within public directory (more secure check)
    if (
      !normalizedPath.startsWith(publicDir + path.sep) &&
      normalizedPath !== publicDir
    ) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'text/plain');
      res.end('Invalid path');
      return;
    }

    // Check if path exists and is a file
    fs.stat(normalizedPath, (err, stats) => {
      if (err) {
        res.statusCode = 404;
        res.setHeader('Content-Type', 'text/plain');
        res.end('File not found');
        return;
      }

      if (stats.isDirectory()) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'text/plain');
        res.end('Directory listing not allowed');
        return;
      }

      // Stream the file instead of reading it all into memory
      const stream = fs.createReadStream(normalizedPath);

      // Handle stream errors
      stream.on('error', (err) => {
        logger.error('Erro ao ler arquivo:', err);
        res.statusCode = 500;
        res.end('Internal Server Error');
      });

      // Set Content-Type based on file extension
      const ext = path.extname(normalizedPath).toLowerCase();
      const contentType =
        {
          '.html': 'text/html',
          '.css': 'text/css',
          '.js': 'text/javascript',
          '.json': 'application/json',
          '.png': 'image/png',
          '.jpg': 'image/jpeg',
          '.jpeg': 'image/jpeg',
          '.gif': 'image/gif',
          '.svg': 'image/svg+xml',
          '.txt': 'text/plain',
        }[ext] || 'application/octet-stream';

      res.statusCode = 200;
      res.setHeader('Content-Type', contentType);

      // Add security headers
      res.setHeader('X-Content-Type-Options', 'nosniff');

      // Pipe the file to the response
      stream.pipe(res);
    });
  });
}

module.exports = { createServer };
