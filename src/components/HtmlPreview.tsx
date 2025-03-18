import React, { useRef, useEffect, useState } from 'react';

interface HtmlPreviewProps {
  html: string;
  isDarkTheme: boolean;
}

const HtmlPreview: React.FC<HtmlPreviewProps> = ({ html, isDarkTheme }) => {
  const [iframeContent, setIframeContent] = useState('');

  // Instead of directly manipulating the DOM, create the content as a data URL
  useEffect(() => {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 10px;
              background-color: ${isDarkTheme ? '#121212' : '#ffffff'};
              color: ${isDarkTheme ? '#e0e0e0' : '#303030'};
            }
          </style>
        </head>
        <body>${html}</body>
      </html>
    `;
    
    // Create a Blob containing the HTML content
    const blob = new Blob([htmlContent], { type: 'text/html' });
    
    // Create a URL for the Blob
    const url = URL.createObjectURL(blob);
    
    setIframeContent(url);
    
    // Clean up the URL when the component unmounts or when the content changes
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [html, isDarkTheme]);
  
  return (
    <div className="html-preview-container" style={{
      marginBottom: '1rem',
      borderRadius: '6px',
      overflow: 'hidden',
      border: 'none',
      height: '400px',
      boxShadow: `0 1px 3px ${isDarkTheme ? 'rgba(0, 0, 0, 0.4)' : 'rgba(0, 0, 0, 0.1)'}`,
    }}>
      <div className="html-preview-header" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '8px 12px',
        backgroundColor: isDarkTheme ? '#2a2a2a' : '#e6e6e6',
        borderBottom: `1px solid ${isDarkTheme ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}`,
      }}>
        <span style={{ 
          fontFamily: 'sans-serif', 
          fontSize: '12px',
          fontWeight: 500,
          color: isDarkTheme ? '#b0b0b0' : '#505060',
        }}>
          HTML PREVIEW
        </span>
      </div>
      <div style={{
        backgroundColor: isDarkTheme ? '#0f0f0f' : '#ffffff',
        height: 'calc(100% - 36px)',
        overflow: 'hidden',
      }}>
        {iframeContent && (
          <iframe 
            src={iframeContent}
            title="HTML Preview"
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
            }}
            sandbox="allow-scripts"
          />
        )}
      </div>
    </div>
  );
};

export default HtmlPreview; 