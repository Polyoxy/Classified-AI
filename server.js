const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const DEV_MODE = process.env.NODE_ENV !== 'production';

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
            res.writeHead(200, { 'Content-Type': 'text/html' });
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
    
    // Success
    res.writeHead(200, { 'Content-Type': contentType });
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