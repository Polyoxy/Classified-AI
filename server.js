const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const DEV_MODE = process.env.NODE_ENV !== 'production';

// Define CSP directives
const cspDirectives = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://*.google-analytics.com https://*.firebaseio.com https://*.firebase.com https://*.firebaseapp.com https://*.gstatic.com;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  img-src 'self' data: https://*.google-analytics.com https://*.googletagmanager.com;
  font-src 'self' https://fonts.gstatic.com;
  connect-src 'self' https://*.google-analytics.com https://*.googleapis.com https://*.firebaseio.com https://*.firebase.com https://*.firebaseapp.com;
  frame-src 'self' https://*.firebaseapp.com https://*.firebase.com;
`.replace(/\s+/g, ' ').trim();

// Simple logging middleware
const logger = (req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.url}`);
  next(req, res);
};

// MIME types for different file extensions
const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.woff': 'application/font-woff',
  '.woff2': 'application/font-woff2',
  '.ttf': 'application/font-ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.otf': 'application/font-otf'
};

// Create the server
const server = http.createServer((req, res) => {
  // Log the request
  logger(req, res, () => {});

  // Parse the URL
  let filePath;
  if (req.url === '/' || req.url === '/index.html') {
    filePath = path.join(__dirname, 'index.html');
  } else {
    filePath = path.join(__dirname, req.url);
  }

  // Get the file extension
  const extname = path.extname(filePath).toLowerCase();
  
  // Set the content type based on the file extension
  const contentType = MIME_TYPES[extname] || 'application/octet-stream';

  // Read and serve the file
  fs.readFile(filePath, (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        // File not found - try to serve index.html for SPA routing
        if (req.url !== '/favicon.ico') {
          console.log(`File not found: ${filePath}, serving index.html instead`);
          fs.readFile(path.join(__dirname, 'index.html'), (err, data) => {
            if (err) {
              res.writeHead(500);
              res.end('Error loading index.html');
              return;
            }
            // Add security headers to the response
            res.writeHead(200, { 
              'Content-Type': 'text/html',
              'Content-Security-Policy': cspDirectives,
              'X-Content-Type-Options': 'nosniff',
              'X-Frame-Options': 'DENY',
              'X-XSS-Protection': '1; mode=block',
              'Referrer-Policy': 'strict-origin-when-cross-origin'
            });
            res.end(data);
          });
        } else {
          res.writeHead(404);
          res.end();
        }
      } else {
        // Server error
        console.error(`Server error: ${err.code}`);
        res.writeHead(500);
        res.end(`Server Error: ${err.code}`);
      }
      return;
    }
    
    // Success - Add security headers to the response
    res.writeHead(200, { 
      'Content-Type': contentType,
      'Content-Security-Policy': cspDirectives,
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin'
    });
    res.end(data);
  });
});

// Start the server
server.listen(PORT, () => {
  console.log(`
  ┌───────────────────────────────────────────────┐
  │                                               │
  │   Classified AI Dev Server                    │
  │                                               │
  │   Server running at http://localhost:${PORT}/   │
  │   ${DEV_MODE ? 'Development mode' : 'Production mode'}                    │
  │                                               │
  │   Press Ctrl+C to stop the server             │
  │                                               │
  └───────────────────────────────────────────────┘
  `);
}); 