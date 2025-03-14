# Classified AI - Web Version

A terminal-style AI chat application with a modern dark theme, designed to provide a desktop-like experience in the browser.

## Features

- Terminal-style interface with a modern dark theme
- Multiple theme options (Dark, Green, Amber)
- Conversation management
- Code syntax highlighting
- Token usage tracking
- Cost estimation
- Responsive design

## Quick Start

### Using the Simple HTTP Server

1. Clone the repository
2. Navigate to the project directory
3. Run the server:

```bash
node server.js
```

4. Open your browser and navigate to http://localhost:3000

### Using the Express Server (Recommended for Development)

1. Install dependencies:

```bash
npm install express
```

2. Run the Express server:

```bash
# For Windows
set NODE_ENV=development && node express-server.js

# For macOS/Linux
NODE_ENV=development node express-server.js
```

3. Open your browser and navigate to http://localhost:3000

## Development

### Project Structure

- `index.html` - Main HTML file
- `app.js` - Client-side JavaScript
- `server.js` - Simple HTTP server
- `express-server.js` - Enhanced Express server for development

### Adding Features

To add new features to the web version:

1. Modify the `app.js` file to add new functionality
2. Update the `index.html` file if UI changes are needed
3. Restart the server to see your changes

## Deployment

To deploy the web version:

1. Choose a hosting provider (Netlify, Vercel, GitHub Pages, etc.)
2. Upload the following files:
   - `index.html`
   - `app.js`
   - Any other static assets

For a server-based deployment:
1. Install Node.js on your server
2. Upload all files to your server
3. Install dependencies: `npm install express`
4. Run the server: `node express-server.js`
5. Consider using a process manager like PM2: `pm2 start express-server.js`

## License

MIT 