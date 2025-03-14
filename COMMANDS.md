# Classified AI - Commands

## Web Version

### Simple HTTP Server

```bash
# Run the simple HTTP server
node server.js
```

### Express Server (Recommended for Development)

```bash
# Install Express (one-time setup)
npm install express

# Run the Express server (Windows)
set NODE_ENV=development && node express-server.js

# Run the Express server (macOS/Linux)
NODE_ENV=development node express-server.js
```

## Desktop Version (Electron)

### Prerequisites

```bash
# Install all dependencies
npm install --force
```

### Development

```bash
# Run Next.js development server
npm run dev

# Run Electron app with Next.js
npm run electron-dev

# Run Electron app directly
node start-app.js
```

### Building for Production

```bash
# Build for production
npm run electron-build
```

## Troubleshooting

If you encounter issues with the Electron version, try these steps:

1. Clear node_modules and reinstall:

```bash
rm -rf node_modules
npm install --force
```

2. Check for conflicting dependencies:

```bash
npm ls react
npm ls next
```

3. Try running with the web version instead:

```bash
node server.js
``` 