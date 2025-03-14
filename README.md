# Classified AI - Terminal-Style Chat Application

A desktop terminal-style AI chat application built with Next.js 14, TypeScript, Firebase, Tailwind CSS, and Electron. The application features a modern dark theme with JetBrains Mono font for a coder aesthetic.

## Features

- **Terminal-Style UI**: Clean, minimalistic interface with a terminal-like appearance
- **Multiple AI Providers**: Support for OpenAI, Ollama (local models), and Deepseek
- **Theme Options**: Choose between dark, green (hacker), and amber (retro) themes
- **Chat Memory**: AI remembers past messages within a session
- **Response Streaming**: AI messages appear in real-time with a smooth typing effect
- **Code Syntax Highlighting**: Beautiful code blocks with syntax highlighting
- **Token & Cost Tracking**: Shows token usage and estimated API cost per request
- **Firebase Integration**: Authentication, Firestore database, and Storage
- **Custom System Prompts**: Modify the AI's system prompt dynamically
- **User Role Personalization**: Select roles like Developer Mode, Casual Chat, or Code Helper
- **Keyboard Shortcuts**:
  - Enter to send
  - Shift+Enter for new line
  - Arrow Up to edit last message
  - Ctrl+L or /clear to clear chat
  - Ctrl+S to save conversation
  - Esc to close modals

## Installation

### Prerequisites

- Node.js 18+ and npm
- Firebase account (for authentication and database features)

### Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/classified-ai.git
   cd classified-ai
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env.local` file in the root directory with your Firebase and API keys:
   ```
   NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id
   ```

## Development

### Run the Next.js development server:

```bash
npm run dev
```

### Run the Electron app in development mode:

```bash
npm run electron-dev
```

## Building for Production

### Build the Next.js application and Electron app:

```bash
npm run electron-build
```

This will create distributable packages in the `dist` directory.

## Tech Stack

- **Frontend**: Next.js 14 + TypeScript + Electron
- **Backend**: Firebase (Auth, Firestore, Storage)
- **Styling**: Tailwind CSS
- **State Management**: React Context
- **AI Backend**: OpenAI API, Ollama, Deepseek
- **Notifications**: Sonner for alerts
- **Storage**: Electron Store for local settings

## License

MIT

## Acknowledgements

- JetBrains Mono font
- React Syntax Highlighter
- Heroicons
- Headless UI
