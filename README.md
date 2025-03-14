# Classified AI - Terminal-Style Chat Application 🖥️🤖

A desktop terminal-style AI chat application built with **Next.js 14**, **TypeScript**, **Firebase**, **Tailwind CSS**, and **Electron**. The app features a modern dark theme with the **JetBrains Mono** font for a coder aesthetic. 🌙💻

---

## Screenshots 📸

### Main Interface
![Main Interface](docs/images/Interface.png)
*The main interface combines a command-line aesthetic with modern AI capabilities.*

### Model Selection
![Models](docs/images/Models.png)
*Easily switch between different AI models including Llama3, Mistral, and CodeLlama.*

### Settings & Configuration
![Settings ](docs/images/Settings.png)
*Configure your experience with adjustable parameters and user roles.*

---

## Features ⚙️

- **Terminal-Style UI**: A clean, minimalistic terminal-inspired interface. ⌨️
- **Multiple AI Providers**: Supports OpenAI, Ollama (local models), and Deepseek. 🌐
- **Theme Options**: Dark, Green (Hacker), and Amber (Retro) themes. 🌚💾
- **Chat Memory**: AI remembers past messages within a session. 🧠💬
- **Response Streaming**: AI messages appear in real-time with a smooth typing effect. ⏳💻
- **Code Syntax Highlighting**: Beautifully formatted code blocks with syntax highlighting. 🖥️📜
- **Token & Cost Tracking**: Track token usage and estimated API costs per request. 💰🔢
- **Firebase Integration**: Includes authentication, Firestore database, and storage. 🔥🔐
- **Custom System Prompts**: Dynamically modify the AI’s system prompt. ⚡
- **User Role Personalization**: Choose roles like Developer Mode, Casual Chat, or Code Helper. 🎮🛠️
- **Keyboard Shortcuts**:
  - `Enter`: Send message 📤
  - `Shift+Enter`: New line ✏️
  - `Arrow Up`: Edit last message 🔄
  - `Ctrl+L` or `/clear`: Clear chat 🧹
  - `Ctrl+S`: Save conversation 💾
  - `Esc`: Close modals ❌

---

## Installation ⚒️

### Prerequisites 📦

- Node.js 18+ and npm
- Firebase account (for authentication and database features)

### Setup 🏁

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

---

## Development 🛠️

### Run the Next.js development server:
```bash
npm run dev
```

### Run the Electron app in development mode:
```bash
npm run electron-dev
```

---

## Building for Production 🚀

### Build the Next.js application and Electron app:
```bash
npm run electron-build
```
This will create distributable packages in the `dist` directory.

---

## Tech Stack 🔧

- **Frontend**: Next.js 14 + TypeScript + Electron
- **Backend**: Firebase (Auth, Firestore, Storage)
- **Styling**: Tailwind CSS
- **State Management**: React Context
- **AI Backend**: OpenAI API, Ollama, Deepseek
- **Notifications**: Sonner for alerts
- **Storage**: Electron Store for local settings

---

## License 📜

MIT

---

## Acknowledgements 🙏

- JetBrains Mono font
- React Syntax Highlighter
- Heroicons
- Headless UI

---

### Project Overview 🔍

Classified-AI offers a secure, terminal-style interface for AI interactions, combining a command-line aesthetic with cutting-edge AI capabilities. It supports multiple models (OpenAI, Ollama, Deepseek), operates offline, handles classified document processing, and manages conversations—all with a clean, focused UI inspired by intelligence agencies. 🕵️‍♂️💡
