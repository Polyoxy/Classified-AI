import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "700"],
  display: "swap",
});

// Determine if we're in development mode
const isDevelopment = process.env.NODE_ENV === 'development';

// Define a more permissive CSP for development
const developmentCSP = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval';
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  img-src 'self' data: blob:;
  font-src 'self' data: https://fonts.gstatic.com;
  connect-src 'self' http://localhost:* http://localhost:11434 https://*.openai.com ws://localhost:* 
              https://*.google-analytics.com https://*.googleapis.com 
              https://*.firebaseio.com https://*.firebase.com wss://*.firebaseio.com
              https://*.firebaseapp.com ws://*.firebaseio.com;
  worker-src 'self' blob:;
  frame-src 'self' https://*.firebaseapp.com https://*.firebase.com https://*.firebaseio.com;
`;

// More restrictive CSP for production
const productionCSP = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval';
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  img-src 'self' data: blob:;
  font-src 'self' data: https://fonts.gstatic.com;
  connect-src 'self' http://localhost:11434 https://*.openai.com
              https://*.google-analytics.com https://*.googleapis.com 
              https://*.firebaseio.com https://*.firebase.com wss://*.firebaseio.com
              https://*.firebaseapp.com ws://*.firebaseio.com;
  worker-src 'self' blob:;
  frame-src 'self' https://*.firebaseapp.com https://*.firebase.com https://*.firebaseio.com;
`;

export const metadata: Metadata = {
  title: "Classified AI - Terminal-Style Chat",
  description: "A terminal-style AI chat application with multiple AI providers",
  authors: [{ name: "Classified AI" }],
  keywords: ["AI", "Chat", "Terminal", "OpenAI", "Ollama", "Llama"],
  // Use appropriate CSP based on environment
  other: {
    "Content-Security-Policy": isDevelopment 
      ? developmentCSP.replace(/\n/g, '') 
      : productionCSP.replace(/\n/g, '')
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#121212" />
      </head>
      <body className={`${inter.variable} ${jetbrainsMono.variable} antialiased theme-dark`}>
        {children}
      </body>
    </html>
  );
}
