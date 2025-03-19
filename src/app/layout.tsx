import type { Metadata } from "next";
import { Providers } from "@/components/Providers";
import "./globals.css";

// Define custom font variables
const sohne = {
  variable: "--font-inter", // Keep the variable name for compatibility
  display: "swap",
};

const sohneMono = {
  variable: "--font-mono", // Keep the variable name for compatibility
  display: "swap",
};

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
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${sohne.variable} ${sohneMono.variable}`}>
      <head>
        <meta name="theme-color" content="#121212" />
        <script dangerouslySetInnerHTML={{
          __html: `
            // Monitor for code panel opening/closing
            (function() {
              const observer = new MutationObserver(mutations => {
                mutations.forEach(mutation => {
                  if (mutation.attributeName === 'class') {
                    const hasOpenPanel = document.body.classList.contains('has-open-panel');
                    const container = document.getElementById('app-container');
                    if (container) {
                      container.style.transition = 'margin-right 0.3s ease-in-out, width 0.3s ease-in-out';
                      container.style.width = hasOpenPanel ? '50%' : '100%';
                      container.style.marginRight = hasOpenPanel ? '50%' : '0';
                    }
                  }
                });
              });
              // Start observing the body element
              observer.observe(document.body, { attributes: true });
            })();
          `
        }} />
      </head>
      <body className="antialiased theme-dark">
        <Providers>
          <div className="app-container" id="app-container">
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}
