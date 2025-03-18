import React, { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, vs } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import { useAppContext } from '@/context/AppContext';
import CodePreview from './CodePreview';
import HtmlPreview from './HtmlPreview';
import ThinkingIndicator from './ThinkingIndicator';

interface MessageItemProps {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: number;
  isThinking?: boolean;
  thinkingContent?: string;
}

// Utility functions to detect HTML and extract code blocks
const containsHtml = (content: string): boolean => {
  // More precise HTML detection - check for complete HTML elements, not just any tag
  const htmlRegex = /<\/?(?:html|head|body|div|span|h[1-6]|p|a|img|ul|ol|li|table|tr|td|th|form|input|button|section|nav|header|footer)(?:\s[^>]*)?>/i;
  // Also check for common HTML entities
  const htmlEntityRegex = /&[a-z]+;|&#\d+;/i;
  
  return htmlRegex.test(content) || htmlEntityRegex.test(content);
};

const extractCodeBlocks = (content: string): Array<{code: string, language: string}> => {
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
  const blocks: Array<{code: string, language: string}> = [];
  
  let match;
  while ((match = codeBlockRegex.exec(content)) !== null) {
    blocks.push({
      language: match[1] || 'text',
      code: match[2]
    });
  }
  
  return blocks;
};

// Tab interface component for code and previews
const TabInterface: React.FC<{
  codeBlocks: Array<{code: string, language: string}>,
  htmlContent: string,
  isDarkTheme: boolean
}> = ({ codeBlocks, htmlContent, isDarkTheme }) => {
  const [activeTab, setActiveTab] = useState<string>(codeBlocks.length > 0 ? 'code-0' : 'html-code');
  
  const hasHtml = containsHtml(htmlContent);
  
  // Generate tabs data
  const tabs = [
    ...(codeBlocks.map((block, index) => ({
      id: `code-${index}`,
      label: `${block.language.toUpperCase()}`,
      content: (
        <CodePreview 
          key={index} 
          code={block.code} 
          language={block.language} 
          isDarkTheme={isDarkTheme}
          fullWidth={true}
        />
      )
    }))),
    ...(hasHtml ? [
      {
        id: 'html-code',
        label: 'HTML',
        content: (
          <div style={{
            maxHeight: '500px',
            overflowY: 'auto',
            padding: '12px',
            backgroundColor: isDarkTheme ? '#1e1e1e' : '#f5f5f5',
            borderRadius: '4px',
            fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)',
          }}>
            <SyntaxHighlighter
              language="html"
              style={isDarkTheme ? vscDarkPlus : vs}
              customStyle={{
                margin: 0,
                padding: 0,
                backgroundColor: 'transparent',
              }}
            >
              {htmlContent}
            </SyntaxHighlighter>
          </div>
        )
      },
      {
        id: 'html-preview',
        label: 'PREVIEW',
        content: <HtmlPreview html={htmlContent} isDarkTheme={isDarkTheme} fullWidth={true} />
      }
    ] : [])
  ];
  
  if (tabs.length === 0) return null;
  
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      width: '100%',
      borderRadius: '4px',
      overflow: 'hidden',
      border: `1px solid ${isDarkTheme ? '#2a2a2a' : '#e0e0e0'}`,
      backgroundColor: isDarkTheme ? '#161616' : '#f8f8f8',
    }}>
      {/* Tab buttons */}
      <div style={{
        display: 'flex',
        borderBottom: `1px solid ${isDarkTheme ? '#2a2a2a' : '#e0e0e0'}`,
        backgroundColor: isDarkTheme ? '#1a1a1a' : '#f0f0f0',
      }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '8px 16px',
              border: 'none',
              borderBottom: activeTab === tab.id 
                ? `2px solid ${isDarkTheme ? '#3a86ff' : '#3a86ff'}` 
                : '2px solid transparent',
              backgroundColor: 'transparent',
              color: activeTab === tab.id
                ? (isDarkTheme ? '#ffffff' : '#000000')
                : (isDarkTheme ? '#aaaaaa' : '#666666'),
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: activeTab === tab.id ? 'bold' : 'normal',
              transition: 'all 0.2s ease',
              fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>
      
      {/* Tab content */}
      <div style={{
        minHeight: '300px',
        backgroundColor: isDarkTheme ? '#1e1e1e' : '#ffffff',
      }}>
        {tabs.find(tab => tab.id === activeTab)?.content}
      </div>
    </div>
  );
};

const MessageItem: React.FC<MessageItemProps> = ({ role, content, timestamp, isThinking, thinkingContent }) => {
  const { settings } = useAppContext();
  const isDarkTheme = settings?.theme === 'dark';
  const [analysisExpanded, setAnalysisExpanded] = useState(true);
  
  // Function to format the message content and handle code blocks
  const formatContent = (text: string) => {
    // Replace code blocks with placeholders since CodePreview will render them
    const sanitizedText = text.replace(/```([a-zA-Z]*)\n([\s\S]*?)```/g, '');
    
    // If this is going to be shown in an HTML preview too, we should clean it up
    const finalText = containsHtml(text) ? 
      sanitizedText.replace(/<(?:[^>"']|"[^"]*"|'[^']*')*>/g, '') : // More comprehensive HTML tag removal
      sanitizedText;
    
    // Return the content without code blocks and HTML
    return (
      <span style={{ whiteSpace: 'pre-wrap' }}>
        {finalText}
      </span>
    );
  };

  // Extract analysis section if it exists
  const extractAnalysis = (text: string) => {
    // Look for <ANALYSIS> or ANALYSIS: tag in the content
    const analysisRegex = /<ANALYSIS>([\s\S]*?)(?:<\/ANALYSIS>|$)|ANALYSIS:\s*([\s\S]*?)(?=\n\n|$)/i;
    const match = text.match(analysisRegex);
    
    if (match) {
      const analysisContent = match[1] || match[2] || '';
      const mainContent = text.replace(analysisRegex, '').trim();
      return { analysisContent, mainContent };
    }
    
    return { analysisContent: '', mainContent: text };
  };

  // Get appropriate colors based on role and theme
  const getUserColors = () => {
    if (isDarkTheme) {
      return {
        prefix: '#FFD700', // Golden color for user prefix
        bg: '#1e3a8a',    // Dark blue for better visibility
        border: '2px solid #3b82f6'  // Prominent blue border
      };
    } else {
      return {
        prefix: '#1d4ed8', // Blue for user prefix in light mode
        bg: '#dbeafe',     // Light blue background for user messages
        border: '2px solid #3b82f6'  // Blue border for visibility
      };
    }
  };
  
  const getAIColors = () => {
    if (isDarkTheme) {
      return {
        prefix: 'var(--accent-color, #E34234)', // Vermillion orange for prefix
        bg: '#121212',      // Dark background
        border: 'none'
      };
    } else {
      return {
        prefix: 'var(--accent-color, #E34234)', // Vermillion orange for prefix
        bg: '#ffffff',      // White background
        border: 'none'
      };
    }
  };

  // Get colors for current role
  const colors = role === 'user' ? getUserColors() : getAIColors();

  // Create message style based on role
  const messageStyle = {
    marginBottom: '1rem',
    padding: '0.75rem',
    backgroundColor: colors.bg,
    border: colors.border,
    color: 'var(--text-color)',
    fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)',
    fontSize: `${settings?.fontSize || 14}px`,
    lineHeight: '1.6',
    transition: 'all 0.2s ease',
    borderRadius: '4px',
    width: '100%',
    boxSizing: 'border-box' as const,
    boxShadow: isDarkTheme 
      ? '0 1px 2px rgba(0, 0, 0, 0.2)' 
      : '0 1px 2px rgba(0, 0, 0, 0.05)'
  };

  // Style for the role prefix
  const prefixStyle = {
    fontWeight: 'bold' as const,
    color: colors.prefix,
    userSelect: 'none' as const,
    display: 'inline-block',
    marginBottom: '0.5rem',
    fontSize: `${(settings?.fontSize || 14)}px`,
    fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)'
  };

  // Style for the message content
  const contentStyle = {
    whiteSpace: 'pre-wrap' as const,
    lineHeight: '1.6',
    color: 'var(--text-color)',
    fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)',
    width: '100%',
    overflowWrap: 'break-word' as const,
    wordWrap: 'break-word' as const,
    wordBreak: 'break-word' as const
  };

  // Add code block syntax highlighting
  const codeBlockStyle = {
    display: 'block',
    backgroundColor: isDarkTheme ? '#1e1e1e' : '#f5f5f5',
    padding: '0.75rem 1rem',
    borderRadius: '4px',
    margin: '0.75rem 0',
    border: `1px solid ${isDarkTheme ? '#2a2a2a' : '#e0e0e0'}`,
    whiteSpace: 'pre' as const,
    overflowX: 'auto' as const,
    overflowY: 'hidden' as const,
    boxShadow: isDarkTheme ? '0 2px 6px rgba(0, 0, 0, 0.2)' : '0 2px 6px rgba(0, 0, 0, 0.05)',
    fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)',
    maxWidth: '100%'
  };

  // Style for system messages
  const systemStyle = {
    ...messageStyle,
    fontStyle: 'italic' as const,
    opacity: 0.8,
    color: 'var(--system-color)',
    backgroundColor: isDarkTheme ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.05)',
    padding: '0.5rem 0.75rem',
  };

  // New styles for the agent UI
  const agentHeaderStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.5rem 1rem',
    backgroundColor: '#121212',
    borderBottom: '1px solid #2a2a2a',
    borderTopLeftRadius: '4px',
    borderTopRightRadius: '4px',
  };

  const agentTitleStyle = {
    color: '#fff',
    fontWeight: 'bold' as const,
    fontSize: '14px',
    fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)',
  };

  const analysisToggleStyle = {
    display: 'flex',
    alignItems: 'center',
    color: '#aaa',
    cursor: 'pointer',
    fontSize: '14px',
    userSelect: 'none' as const,
  };

  const analysisContentStyle = {
    padding: '1rem',
    borderBottom: '1px solid #2a2a2a',
    backgroundColor: '#1a1a1a',
    color: '#aaa',
    fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)',
    fontSize: '14px',
    lineHeight: '1.5',
    whiteSpace: 'pre-wrap' as const,
    overflowWrap: 'break-word' as const,
  };

  const responseContentStyle = {
    padding: '1rem',
    color: '#fff',
    fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)',
    fontSize: '14px',
    lineHeight: '1.5',
    whiteSpace: 'pre-wrap' as const,
    overflowWrap: 'break-word' as const,
  };

  const timestampStyle = {
    color: '#666',
    fontSize: '12px',
    marginLeft: 'auto',
    fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)',
  };

  // Format the timestamp display
  const formatTime = (timestamp?: number) => {
    const date = timestamp ? new Date(timestamp) : new Date();
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit', 
      hour12: false 
    });
  };

  // Add this to handle responsive layout for small screens
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  // If it's a system message, render with simple style
  if (role === 'system') {
    return (
      <div className="message system-message" style={systemStyle}>
        <span style={{ 
          whiteSpace: 'pre-wrap',
          lineHeight: '1.5',
          fontStyle: 'italic'
        }}>
          {content}
        </span>
      </div>
    );
  }

  // If it's a user message, render with enhanced style (without prefix)
  if (role === 'user') {
    return (
      <div className="message user-message" style={{
        ...messageStyle,
        padding: '1rem',
        borderLeft: 'none',
        backgroundColor: isDarkTheme ? 'rgba(58, 134, 255, 0.08)' : 'rgba(58, 134, 255, 0.03)',
        boxShadow: `0 1px 3px ${isDarkTheme ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.05)'}`,
      }}>
        <div style={{
          ...contentStyle,
        }}>
          {formatContent(content)}
        </div>
      </div>
    );
  }

  // For AI messages, check if we need to extract analysis
  const { analysisContent, mainContent } = extractAnalysis(content);
  const hasAnalysis = analysisContent.length > 0;
  
  // If the message is in "thinking" state, display the thinking indicator
  if (isThinking) {
    return (
      <ThinkingIndicator 
        isThinking={true}
        thinkingContent={thinkingContent}
        isDarkTheme={isDarkTheme}
      />
    );
  }
  
  // Extract code blocks
  const codeBlocks = extractCodeBlocks(content);
  const hasCodeOrHtml = codeBlocks.length > 0 || containsHtml(content);
  
  // If no analysis, render standard AI message with the new tabbed interface
  if (!hasAnalysis) {
    return (
      <div className="message assistant-message" style={{
        ...messageStyle,
        padding: '1rem',
        borderLeft: 'none',
        boxShadow: `0 1px 3px ${isDarkTheme ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.07)'}`,
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem',
          width: '100%',
        }}>
          {/* Main content */}
          <div style={{
            overflowY: 'hidden',
          }}>
            {formatContent(content)}
          </div>
          
          {/* Tabbed interface for code/HTML previews */}
          {hasCodeOrHtml && (
            <TabInterface 
              codeBlocks={codeBlocks} 
              htmlContent={content} 
              isDarkTheme={isDarkTheme} 
            />
          )}
        </div>
      </div>
    );
  }

  // If has analysis, render the agent UI with the new tabbed interface
  return (
    <div className="message assistant-message agent-ui" style={{
      marginBottom: '1rem',
      width: '100%',
      borderRadius: '6px',
      overflow: 'hidden',
      backgroundColor: isDarkTheme ? '#121212' : '#f8f8f8',
      boxShadow: `0 2px 8px ${isDarkTheme ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.1)'}`,
      border: 'none',
    }}>
      {/* Agent header with AGENT badge and ANALYSIS toggle */}
      <div style={{
        ...agentHeaderStyle,
        backgroundColor: isDarkTheme ? '#2a2a2a' : '#e6e6e6',
        borderBottom: `1px solid ${isDarkTheme ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}`,
      }}>
        <div style={agentTitleStyle}>AGENT</div>
        <div 
          style={analysisToggleStyle}
          onClick={() => setAnalysisExpanded(!analysisExpanded)}
        >
          <span>ANALYSIS</span>
          <span style={{ marginLeft: '4px' }}>{analysisExpanded ? '▼' : '►'}</span>
        </div>
      </div>
      
      {/* Analysis section */}
      {analysisExpanded && (
        <div style={analysisContentStyle}>
          {formatContent(analysisContent)}
        </div>
      )}
      
      {/* Main response with new tabbed interface */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        padding: '1rem',
        gap: '1.5rem',
      }}>
        {/* Main content */}
        <div style={{
          overflowY: 'hidden',
        }}>
          {formatContent(mainContent)}
          <div style={{ display: 'flex', marginTop: '1rem' }}>
            <span style={timestampStyle}>
              {formatTime(timestamp)}
            </span>
          </div>
        </div>
        
        {/* Tabbed interface for code/HTML previews */}
        {(codeBlocks.length > 0 || containsHtml(mainContent)) && (
          <TabInterface 
            codeBlocks={codeBlocks} 
            htmlContent={mainContent} 
            isDarkTheme={isDarkTheme} 
          />
        )}
      </div>
    </div>
  );
};

export default MessageItem; 