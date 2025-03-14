const express = require('express');
const path = require('path');
const fs = require('fs');

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;
const DEV_MODE = process.env.NODE_ENV === 'development';

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