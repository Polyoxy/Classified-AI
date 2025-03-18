import React, { useRef, useEffect, useState } from 'react';

interface HtmlPreviewProps {
  html: string;
  isDarkTheme: boolean;
  fullWidth?: boolean;
}

const HtmlPreview: React.FC<HtmlPreviewProps> = ({ html, isDarkTheme, fullWidth = false }) => {
  const [iframeContent, setIframeContent] = useState('');
  const [isExpanded, setIsExpanded] = useState(true);

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

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };
  
  return (
    <div className="html-preview-container" style={{
      marginBottom: fullWidth ? 0 : '1rem',
      borderRadius: fullWidth ? 0 : '6px',
      overflow: 'hidden',
      border: 'none',
      height: fullWidth ? '500px' : '400px',
      boxShadow: fullWidth ? 'none' : `0 1px 3px ${isDarkTheme ? 'rgba(0, 0, 0, 0.4)' : 'rgba(0, 0, 0, 0.1)'}`,
      transition: 'transform 0.3s ease-in-out',
      transform: !fullWidth && isExpanded ? 'translateX(0)' : (fullWidth ? 'translateX(0)' : 'translateX(calc(100% - 40px))'),
      position: 'relative',
    }}>
      {!fullWidth && (
        <div 
          className="collapse-toggle"
          onClick={toggleExpanded}
          style={{
            position: 'absolute',
            left: 0,
            top: '40%',
            backgroundColor: isDarkTheme ? '#2a2a2a' : '#e6e6e6',
            color: isDarkTheme ? '#b0b0b0' : '#505060',
            width: '24px',
            height: '60px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            borderRadius: '0 4px 4px 0',
            zIndex: 10,
            boxShadow: `2px 0 4px ${isDarkTheme ? 'rgba(0, 0, 0, 0.4)' : 'rgba(0, 0, 0, 0.1)'}`,
            border: `1px solid ${isDarkTheme ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}`,
            borderLeft: 'none',
          }}
        >
          {isExpanded ? '›' : '‹'}
        </div>
      )}
      {!fullWidth && (
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
          <button
            onClick={toggleExpanded}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: isDarkTheme ? '#b0b0b0' : '#505060',
              display: 'flex',
              alignItems: 'center',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '12px',
            }}
          >
            {isExpanded ? 'Hide' : 'Show'}
          </button>
        </div>
      )}
      <div style={{
        backgroundColor: isDarkTheme ? '#0f0f0f' : '#ffffff',
        height: fullWidth ? '100%' : 'calc(100% - 36px)',
        overflow: 'hidden',
      }}>
        {(iframeContent && (isExpanded || fullWidth)) && (
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