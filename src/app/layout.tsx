import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  weight: ["400", "700"],
  display: "swap",
});

// Determine if we're in development mode
const isDevelopment = process.env.NODE_ENV === 'development';

export const metadata: Metadata = {
  title: "Classified AI - Terminal-Style Chat",
  description: "A terminal-style AI chat application with multiple AI providers",
  authors: [{ name: "Classified AI" }],
  keywords: ["AI", "Chat", "Terminal", "OpenAI", "Ollama", "Deepseek"],
  // Add CSP meta tag with different policies for development and production
  other: {
    "Content-Security-Policy": isDevelopment
      ? "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data:; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self' http://localhost:* ws://localhost:* https://*.openai.com https://*.deepseek.com"
      : "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data:; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self' https://*.openai.com https://*.deepseek.com"
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${jetbrainsMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
