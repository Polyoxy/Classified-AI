import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Providers } from "@/components/Providers";
import "./globals.css";
import { AppProvider } from '@/context/AppContext';
import Sidebar from '@/components/Sidebar';

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

// Define base CSP that works for both development and production
const baseCSP = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.firebaseapp.com https://*.googleapis.com https://*.google-analytics.com;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  img-src 'self' data: blob: https://*.firebaseapp.com https://*.firebase.com https://*.google-analytics.com;
  font-src 'self' data: https://fonts.gstatic.com;
  connect-src 'self' 
              http://localhost:11434
              http://127.0.0.1:11434
              https://*.openai.com
              https://*.google-analytics.com 
              https://*.googleapis.com 
              https://*.firebaseio.com 
              https://*.firebase.com 
              wss://*.firebaseio.com
              https://*.firebaseapp.com 
              ws://*.firebaseio.com
              https://identitytoolkit.googleapis.com;
  worker-src 'self' blob:;
  frame-src 'self' https://*.firebaseapp.com https://*.firebase.com https://*.firebaseio.com https://identitytoolkit.googleapis.com;
  media-src 'self';
  object-src 'none';
`;

export const metadata: Metadata = {
  title: "Classified AI - Terminal-Style Chat",
  description: "A terminal-style AI chat application with multiple AI providers",
  authors: [{ name: "Classified AI" }],
  keywords: ["AI", "Chat", "Terminal", "OpenAI", "Ollama", "Llama"],
  themeColor: "#121212",
  // Use the same CSP for all environments
  other: {
    "Content-Security-Policy": baseCSP.replace(/\n/g, '')
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <head>
        <meta name="theme-color" content="#121212" />
      </head>
      <body className="antialiased theme-dark">
        <AppProvider>
          <div style={{
            display: 'flex',
            height: '100vh',
            width: '100vw',
            overflow: 'hidden',
          }}>
            <main style={{ flex: 1, height: '100%', overflow: 'auto' }}>
              {children}
            </main>
            <Sidebar />
          </div>
        </AppProvider>
      </body>
    </html>
  );
}
