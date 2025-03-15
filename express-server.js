const express = require('express');
const path = require('path');
const fs = require('fs');

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;
const DEV_MODE = process.env.NODE_ENV === 'development';

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

// Middleware for security headers
app.use((req, res, next) => {
  // Add CSP and other security headers
  res.setHeader('Content-Security-Policy', cspDirectives);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Middleware for logging
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.url}`);
  next();
});

// Serve static files
app.use(express.static(__dirname));

// SPA fallback - serve index.html for all routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start the server
app.listen(PORT, () => {
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