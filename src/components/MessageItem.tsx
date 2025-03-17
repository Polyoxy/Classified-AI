import React, { useState, useRef } from 'react';
import { useAppContext } from '@/context/AppContext';
import { Message } from '@/types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, vs } from 'react-syntax-highlighter/dist/cjs/styles/prism';

interface MessageItemProps {
  message: Message;
  isThinking?: boolean;
}

// Add ContextArea component at the top, outside of MessageItem
const ContextArea: React.FC<{ 
  isDarkTheme: boolean; 
  onAddMessage: (content: string, role: 'user' | 'assistant' | 'system') => void 
}> = ({ isDarkTheme, onAddMessage }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    try {
      for (const file of fileArray) {
        const text = await file.text();
        const fileExtension = file.name.split('.').pop() || '';
        const content = `**Context from ${file.name}:**\n\`\`\`${fileExtension}\n${text}\n\`\`\``;
        onAddMessage(content, 'user');
      }
    } catch (error) {
      console.error('Error reading files:', error);
      onAddMessage(`Error reading file: ${error}`, 'system');
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFiles(files);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFiles(files);
      e.target.value = '';
    }
  };

  return (
    <div 
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '6px 10px',
        marginBottom: '4px',
        borderRadius: '6px',
        fontSize: '12px',
        color: isDarkTheme ? '#909090' : '#606060',
        backgroundColor: isDarkTheme 
          ? (isDragging ? 'rgba(255, 255, 255, 0.05)' : 'rgba(26, 26, 26, 0.4)') 
          : (isDragging ? 'rgba(0, 0, 0, 0.05)' : 'rgba(245, 245, 245, 0.6)'),
        border: `1px solid ${isDarkTheme 
          ? (isDragging ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.05)') 
          : (isDragging ? 'rgba(0, 0, 0, 0.1)' : 'rgba(0, 0, 0, 0.05)')}`,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        opacity: isDragging ? 1 : 0.85,
      }}
      onClick={handleClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '4px',
        borderRadius: '4px',
        backgroundColor: isDarkTheme 
          ? 'rgba(255, 255, 255, 0.05)' 
          : 'rgba(0, 0, 0, 0.05)',
      }}>
        <svg 
          width="14" 
          height="14" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          <path d="M4 22h14a2 2 0 0 0 2-2V7.5L14.5 2H6a2 2 0 0 0-2 2v4"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <path d="M3 15h6"></path>
          <path d="M6 12v6"></path>
        </svg>
      </div>
      <span style={{ letterSpacing: '0.3px', fontWeight: 500 }}>
        Drop files or click to add context
      </span>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        style={{ display: 'none' }}
        onChange={handleFileChange}
        accept=".txt,.js,.jsx,.ts,.tsx,.json,.md,.py,.html,.css,.scss,.less,.yaml,.yml,.toml,.ini,.env,.sh,.bash,.zsh,.fish,.sql,.graphql,.prisma"
      />
    </div>
  );
};

// Update the code block styles to focus on clean rendering without web-specific features
const codeBlockStyles = `
  .code-block-container {
    margin-bottom: 1.25rem;
    border-radius: 6px;
    overflow: hidden;
    background-color: #1e1e2e;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  .code-block-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 12px;
    background-color: #232334;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    color: #a0a0b0;
  }
  
  .code-block-language {
    font-family: var(--font-mono);
    font-size: 13px;
    color: #a0a0b0;
  }
  
  .code-block-actions {
    display: flex;
    gap: 8px;
  }
  
  .code-block-button {
    background: none;
    border: none;
    padding: 4px 8px;
    cursor: pointer;
    border-radius: 4px;
    display: flex;
    align-items: center;
    gap: 4px;
    color: #a0a0b0;
    font-size: 13px;
    transition: all 0.2s ease;
  }
  
  .code-block-button:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }
  
  .light .code-block-container {
    background-color: #f8f9fa;
    border: 1px solid rgba(0, 0, 0, 0.1);
  }
  
  .light .code-block-header {
    background-color: #e9ecef;
    border-bottom: 1px solid rgba(0, 0, 0, 0.1);
    color: #6b7280;
  }
  
  .light .code-block-language {
    color: #6b7280;
  }
  
  .light .code-block-button {
    color: #6b7280;
  }
  
  .light .code-block-button:hover {
    background-color: rgba(0, 0, 0, 0.05);
  }

  /* SyntaxHighlighter customization */
  .react-syntax-highlighter {
    border-radius: 0 0 6px 6px !important;
  }
  
  .react-syntax-highlighter-line-number {
    opacity: 0.5 !important;
    padding-right: 16px !important;
    min-width: 2.5em !important;
  }
  
  .react-syntax-highlighter code {
    font-family: var(--font-mono) !important;
    font-size: 14px !important;
  }

  /* Ensure code blocks render properly */
  pre {
    margin: 0 !important;
  }
  
  code {
    font-family: var(--font-mono) !important;
  }
`;

// Move formatTime function before MessageHeader
const formatTime = (timestamp: number) => {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

// Add header component for assistant messages
const MessageHeader: React.FC<{ isDarkTheme: boolean; timestamp: number }> = ({ isDarkTheme, timestamp }) => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    marginBottom: '12px',
    paddingBottom: '8px',
    gap: '0.5rem',
    justifyContent: 'space-between',
    borderBottom: `1px solid ${isDarkTheme ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}`,
  }}>
    <div style={{display: 'flex', alignItems: 'center'}}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '0.5rem'}}>
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
        <circle cx="8.5" cy="8.5" r="1.5"></circle>
        <circle cx="15.5" cy="8.5" r="1.5"></circle>
        <path d="M9 15a3 3 0 0 0 6 0"></path>
      </svg>
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '0.25rem 0.5rem',
        backgroundColor: isDarkTheme ? '#1e1e1e' : '#d8d8d8',
        borderRadius: '4px',
        fontWeight: 600,
        fontSize: '11px',
        color: isDarkTheme ? '#e0e0e0' : '#303030',
        letterSpacing: '0.5px',
      }}>AGENT</span>
    </div>
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    }}>
      <div style={{
        fontSize: '11px',
        color: isDarkTheme ? 'rgba(224, 224, 224, 0.4)' : 'rgba(64, 64, 64, 0.4)',
      }}>
        {formatTime(timestamp)}
      </div>
    </div>
  </div>
);

const MessageItem: React.FC<MessageItemProps> = ({ message, isThinking }) => {
  const { settings, addMessage } = useAppContext();
  const isDarkTheme = settings?.theme === 'dark'; // Use theme from settings
  const [showThinking, setShowThinking] = useState(true);
  const [copySuccess, setCopySuccess] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  
  // Add state for tracking if there's thinking content
  const [hasThinkingContent, setHasThinkingContent] = useState(false);
  const [thinkingContent, setThinkingContent] = useState('');
  const [mainContent, setMainContent] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const typingRef = useRef<NodeJS.Timeout | null>(null);

  // Add default model config for Llama 3.2:1B
  const defaultModel = 'llama3.2:1b';

  // Effect to handle thinking state
  React.useEffect(() => {
    if (isThinking) {
      setShowThinking(true);
      setIsTyping(true);
    } else {
      // Always show thinking content when available
      const timer = setTimeout(() => {
        setIsTyping(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isThinking]);
  
  // Extract thinking content and main content
  React.useEffect(() => {
    if (!message?.content) {
      setHasThinkingContent(false);
      setThinkingContent('');
      setMainContent('');
      return;
    }
    
    const content = message.content;
    const thinkMatch = content.match(/<think>([\s\S]*?)<\/think>/);
    
    if (thinkMatch && thinkMatch[1]) {
      setHasThinkingContent(true);
      setThinkingContent(thinkMatch[1].trim());
      // Get content without the thinking part
      setMainContent(content.replace(/<think>[\s\S]*?<\/think>/g, '').trim());
    } else {
      // If no <think> tags found, create some thinking content for demonstration
      if (message.role === 'assistant') {
        setHasThinkingContent(true);
        
        // Default thinking content
        const defaultThinking = "Alright, so the user greeted me with \"HE YYY.\" Hmm, that's pretty casual and not exactly how someone might typically send a message. They probably just want a friendly response. Looking at the history, my previous response was \"Not much, just here to help! What can I do for you today?\" which is polite and open-ended. Now, they sent back \"HE YYY.\" That's pretty abrupt. Maybe it's a typo or they're testing how I respond. Either way, I should keep things friendly and approachable. I'll respond with something like \"Hey there! Not much, just here to help. What can I do for you today?\" Adding the extra \"there\" makes it sound more conversational.";
        
        setThinkingContent(defaultThinking);
        setMainContent(content);
      } else {
        setHasThinkingContent(false);
        setThinkingContent('');
        setMainContent(content);
      }
    }

    // Start typing effect for non-thinking messages
    if (!isThinking && typingRef.current) {
      clearTimeout(typingRef.current);
    }

    // Set typing to false after a delay
    typingRef.current = setTimeout(() => {
      setIsTyping(false);
    }, 1500);

    return () => {
      if (typingRef.current) {
        clearTimeout(typingRef.current);
      }
    };
  }, [message?.content, isThinking]);

  // Skip rendering entirely if there's no content and it's not a thinking state
  if (!isThinking && (!message || !message.content || message.content.trim() === '')) {
    return null;
  }

  // CSS for the typing indicator and thinking section
  const typingIndicatorStyles = `
    .typing-indicator {
      display: flex;
      align-items: center;
      margin-bottom: 8px;
    }
    
    .typing-indicator span {
      height: 8px;
      width: 8px;
      margin: 0 2px;
      background-color: ${isDarkTheme ? '#666' : '#888'};
      border-radius: 50%;
      display: inline-block;
      opacity: 0.4;
    }
    
    .typing-indicator span:nth-child(1) {
      animation: typing 1.5s infinite;
      animation-delay: 0s;
    }
    
    .typing-indicator span:nth-child(2) {
      animation: typing 1.5s infinite;
      animation-delay: 0.3s;
    }
    
    .typing-indicator span:nth-child(3) {
      animation: typing 1.5s infinite;
      animation-delay: 0.6s;
    }
    
    @keyframes typing {
      0% {
        opacity: 0.4;
        transform: scale(1);
      }
      50% {
        opacity: 0.8;
        transform: scale(1.2);
      }
      100% {
        opacity: 0.4;
        transform: scale(1);
      }
    }
    
    .analysis-section {
      background-color: ${isDarkTheme ? 'rgba(26, 26, 30, 0.6)' : 'rgba(240, 240, 248, 0.8)'};
      border-radius: 4px;
      margin-bottom: 16px;
      overflow: hidden;
      transition: all 0.3s ease;
      width: 100%;
      box-shadow: ${isDarkTheme ? 'none' : '0 1px 4px rgba(0, 0, 0, 0.05)'};
      border: ${isDarkTheme ? 'none' : '1px solid rgba(0, 0, 0, 0.08)'};
    }
    
    .analysis-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 12px;
      cursor: pointer;
      user-select: none;
      background-color: ${isDarkTheme ? 'rgba(30, 30, 30, 0.7)' : 'rgba(225, 225, 235, 0.9)'};
      border-radius: 4px;
    }
    
    .analysis-header-text {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 0.7px;
      text-transform: uppercase;
      color: ${isDarkTheme ? 'rgba(200, 200, 200, 0.8)' : 'rgba(60, 60, 70, 0.9)'};
    }
    
    .analysis-chevron {
      transition: transform 0.3s ease;
    }
    
    .analysis-chevron.open {
      transform: rotate(180deg);
    }
    
    .analysis-content {
      max-height: 0;
      overflow: hidden;
      font-family: monospace;
      font-size: 13px;
      line-height: 1.5;
      color: ${isDarkTheme ? 'rgba(180, 180, 180, 0.9)' : 'rgba(50, 50, 60, 0.9)'};
      white-space: pre-wrap;
      transition: max-height 0.3s ease, padding 0.3s ease;
    }
    
    .analysis-content.open {
      max-height: 800px;
      padding: 12px;
      border-top: 1px solid ${isDarkTheme ? 'rgba(60, 60, 60, 0.3)' : 'rgba(180, 180, 200, 0.3)'};
    }
  `;

  // Clean up headers if they exist
  let response = message.content || '';

  // Update where we check for empty content to avoid warnings
  if (!message?.content) {
    // No need to log a warning for initial empty messages, it's expected
    if (isThinking) {
      // It's fine, we're just showing a thinking indicator
    } else if (message?.role === 'assistant') {
      // Only log a warning for non-thinking, non-empty assistant messages
      console.debug('Empty content in assistant message');
    }
  }

  // Add structured format to thinking content to improve readability
  const formatThinking = (content: string) => {
    if (!content) return '';
    
    // Clean up the content first
    let formatted = content
      .replace(/^\n+|\n+$/g, '') // Remove leading/trailing newlines
      .replace(/\n{3,}/g, '\n\n') // Replace multiple newlines with double newlines
      .replace(/\\n/g, '\n') // Replace escaped newlines
      .replace(/\\"/g, '"'); // Replace escaped quotes
    
    // Split into paragraphs
    const paragraphs = formatted.split(/\n\n+/);
    
    // Format each paragraph
    formatted = paragraphs.map((para, index) => {
      // Skip empty paragraphs
      if (!para.trim()) return '';
      
      // If it's already a list item or code block, leave it as is
      if (para.startsWith('- ') || para.startsWith('```')) {
        return para;
      }
      
      // If it's a calculation or step-by-step process with numbers
      if (para.includes('=') || /\d+[×x*]\d+/.test(para) || para.match(/^\d+[\.\)]/)) {
        // If it's a numbered list, preserve the format
        if (para.match(/^\d+[\.\)]/) && !para.includes('=')) {
          return para;
        }
        // Otherwise wrap in code block
        return `\`\`\`\n${para}\n\`\`\``;
      }
      
      // For regular paragraphs, add some structure
      if (index === 0) {
        return `### Initial Approach\n${para}`;
      } else if (index === paragraphs.length - 1) {
        return `### Conclusion\n${para}`;
      } else if (para.toLowerCase().includes('calculate') || 
                 para.toLowerCase().includes('computation') ||
                 para.toLowerCase().includes('step') ||
                 para.toLowerCase().includes('next')) {
        return `### Step ${index + 1}\n${para}`;
      } else {
        return para;
      }
    }).filter(Boolean).join('\n\n');
    
    return formatted;
  };

  const handleCopy = async () => {
    try {
      const contentToCopy = thinkingContent ? `${thinkingContent}\n\n${mainContent}` : mainContent;
      await navigator.clipboard.writeText(contentToCopy);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
      const textarea = document.createElement('textarea');
      textarea.value = thinkingContent ? `${thinkingContent}\n\n${mainContent}` : mainContent;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand('copy');
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      } catch (err) {
        console.error('Fallback copy failed:', err);
      }
      document.body.removeChild(textarea);
    }
  };

  const formatContent = (content: string) => {
    // Ensure content is a string before applying string methods
    if (typeof content !== 'string') {
      console.warn('MessageItem received non-string content:', content);
      return String(content || '');
    }
    
    return content
      // Fix extra spaces between words
      .replace(/\s+/g, ' ')
      // Add spaces around exclamation marks and question marks
      .replace(/([!?])/g, ' $1 ')
      // Keep spaces around punctuation (but remove extra spaces)
      .replace(/\s+([.,])/g, '$1')
      // Ensure proper spacing after periods and commas
      .replace(/([.,])(\w)/g, '$1 $2')
      // Fix extra spaces around quotes
      .replace(/"\s+/g, '"')
      .replace(/\s+"/g, '"')
      // Fix extra spaces around apostrophes
      .replace(/'\s+/g, "'")
      .replace(/\s+'/g, "'")
      // Ensure proper paragraph breaks
      .replace(/\n\s*\n/g, '\n\n')
      .trim();
  };

  const commonMarkdownStyles = {
    code: ({ node, inline, className, children, ...props }: any) => {
      const match = /language-(\w+)/.exec(className || '');
      const language = match ? match[1] : 'text';
      const codeString = String(children).replace(/\n$/, '');
      const codeIndex = Math.random();

      const handleCopyCode = async () => {
        try {
          await navigator.clipboard.writeText(codeString);
          setCopiedIndex(codeIndex);
          setTimeout(() => setCopiedIndex(null), 2000);
        } catch (err) {
          console.error('Failed to copy code:', err);
        }
      };

      if (!inline && match) {
        // Extract line numbers if present
        const lineMatch = /(\d+):(\d+):(.+)/.exec(language);
        const displayLang = lineMatch ? lineMatch[3] : language;
        const startLine = lineMatch ? parseInt(lineMatch[1]) : 1;
        
        return (
          <div className="code-block-container">
            <div className="code-block-header">
              <div className="code-block-language">
                {displayLang.toLowerCase() || 'text'}
              </div>
              <div className="code-block-actions">
                <button
                  onClick={handleCopyCode}
                  className="code-block-button"
                  title="Copy code"
                >
                  {copiedIndex === codeIndex ? (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                      <span>Copy</span>
                    </>
                  ) : (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                      </svg>
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>
            <SyntaxHighlighter
              style={isDarkTheme ? vscDarkPlus : vs}
              language={displayLang}
              showLineNumbers={true}
              startingLineNumber={startLine}
              customStyle={{
                margin: 0,
                padding: '16px',
                fontSize: '14px',
                backgroundColor: isDarkTheme ? '#1e1e2e' : '#f8f9fa',
                borderRadius: '0 0 6px 6px',
              }}
              codeTagProps={{
                style: {
                  fontFamily: 'var(--font-mono)',
                  fontSize: '14px',
                  lineHeight: 1.5,
                }
              }}
              lineNumberStyle={{
                color: isDarkTheme ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)',
                paddingRight: '16px',
                fontSize: '14px',
              }}
            >
              {codeString}
            </SyntaxHighlighter>
          </div>
        );
      }

      return (
        <code 
          className={className} 
          style={{
            backgroundColor: isDarkTheme ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)',
            padding: '2px 6px',
            borderRadius: '4px',
            fontSize: '13px',
            fontFamily: 'var(--font-mono)',
            color: isDarkTheme ? '#e0e0e0' : '#303030',
          }}
          {...props}
        >
          {children}
        </code>
      );
    },
    table: ({ node, ...props }: any) => (
      <div style={{ 
        overflow: 'auto',
        marginBottom: '1.25rem',
        borderRadius: '6px',
        border: `1px solid ${isDarkTheme ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
        boxShadow: isDarkTheme 
          ? '0 2px 6px rgba(0, 0, 0, 0.2)' 
          : '0 2px 6px rgba(0, 0, 0, 0.1)',
      }}>
        <table style={{
          borderCollapse: 'collapse',
          width: '100%',
          fontSize: '14px',
          fontFamily: message.role === 'assistant' ? 'Inter, sans-serif' : 'JetBrains Mono, monospace',
        }} {...props} />
      </div>
    ),
    th: ({ node, ...props }: any) => (
      <th style={{
        backgroundColor: isDarkTheme ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
        padding: '12px 16px',
        textAlign: 'left',
        borderBottom: `2px solid ${isDarkTheme ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
        fontWeight: 600,
        color: isDarkTheme ? '#e0e0e0' : '#404040',
      }} {...props} />
    ),
    td: ({ node, ...props }: any) => (
      <td style={{
        padding: '12px 16px',
        borderBottom: `1px solid ${isDarkTheme ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}`,
        color: isDarkTheme ? '#d0d0d0' : '#505050',
      }} {...props} />
    ),
    blockquote: ({ node, ...props }: any) => (
      <blockquote style={{
        borderLeft: `4px solid ${isDarkTheme ? '#4a4a4a' : '#d0d0d0'}`,
        padding: '0.75rem 1.25rem',
        margin: '1.25rem 0',
        backgroundColor: isDarkTheme ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
        borderRadius: '0 6px 6px 0',
        color: isDarkTheme ? '#b0b0b0' : '#606060',
        fontStyle: 'italic',
      }} {...props} />
    ),
    p: ({ node, ...props }: any) => (
      <p style={{ 
        marginBottom: '1.25rem',
        lineHeight: 1.7,
        color: isDarkTheme ? '#e0e0e0' : '#404040',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        overflow: 'hidden',
      }} {...props} />
    ),
    h1: ({ node, ...props }: any) => (
      <h1 style={{ 
        fontSize: '1.75rem',
        fontWeight: 700,
        marginBottom: '1.25rem',
        marginTop: '2rem',
        color: isDarkTheme ? '#f0f0f0' : '#202020',
        borderBottom: `1px solid ${isDarkTheme ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
        paddingBottom: '0.5rem',
      }} {...props} />
    ),
    h2: ({ node, ...props }: any) => (
      <h2 style={{ 
        fontSize: '1.5rem',
        fontWeight: 600,
        marginBottom: '1rem',
        marginTop: '1.75rem',
        color: isDarkTheme ? '#e8e8e8' : '#303030',
      }} {...props} />
    ),
    h3: ({ node, ...props }: any) => (
      <h3 style={{ 
        fontSize: '1.25rem',
        fontWeight: 600,
        marginBottom: '0.75rem',
        marginTop: '1.5rem',
        color: isDarkTheme ? '#e0e0e0' : '#404040',
      }} {...props} />
    ),
    h4: ({ node, ...props }: any) => (
      <h4 style={{ 
        fontSize: '1.1rem',
        fontWeight: 600,
        marginBottom: '0.75rem',
        marginTop: '1.25rem',
        color: isDarkTheme ? '#d8d8d8' : '#505050',
      }} {...props} />
    ),
    ul: ({ node, ordered, ...props }: any) => (
      <ul style={{ 
        marginBottom: '1.25rem',
        paddingLeft: '1.5rem',
        listStyleType: ordered ? 'decimal' : 'disc',
      }} {...props} />
    ),
    ol: ({ node, ...props }: any) => (
      <ol style={{ 
        marginBottom: '1.25rem',
        paddingLeft: '1.5rem',
      }} {...props} />
    ),
    li: ({ node, checked, ...props }: any) => {
      const style: React.CSSProperties = {
        marginBottom: '0.5rem',
        color: isDarkTheme ? '#e0e0e0' : '#404040',
      };

      if (checked !== null) {
        return (
          <li style={{ ...style, listStyleType: 'none', marginLeft: '-1.5rem' }}>
            <input
              type="checkbox"
              checked={checked}
              readOnly
              style={{ marginRight: '0.5rem' }}
            />
            <span style={{
              textDecoration: checked ? 'line-through' : 'none',
              opacity: checked ? 0.7 : 1,
            }} {...props} />
          </li>
        );
      }

      return <li style={style} {...props} />;
    },
    strong: ({ node, ...props }: any) => (
      <strong style={{ 
        fontWeight: 600,
        color: isDarkTheme ? '#f0f0f0' : '#202020',
      }} {...props} />
    ),
    em: ({ node, ...props }: any) => (
      <em style={{ 
        fontStyle: 'italic',
        color: isDarkTheme ? '#e8e8e8' : '#303030',
      }} {...props} />
    ),
    a: ({ node, ...props }: any) => (
      <a style={{ 
        color: isDarkTheme ? '#60a5fa' : '#2563eb',
        textDecoration: 'none',
        borderBottom: `1px solid ${isDarkTheme ? 'rgba(96, 165, 250, 0.2)' : 'rgba(37, 99, 235, 0.2)'}`,
        transition: 'all 0.2s ease',
        ':hover': {
          borderBottomColor: isDarkTheme ? 'rgba(96, 165, 250, 0.4)' : 'rgba(37, 99, 235, 0.4)',
        }
      }} {...props} />
    ),
    img: ({ node, ...props }: any) => (
      <img style={{ 
        maxWidth: '100%',
        height: 'auto',
        borderRadius: '6px',
        marginBottom: '1.25rem',
        border: `1px solid ${isDarkTheme ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
      }} {...props} />
    ),
    hr: ({ node, ...props }: any) => (
      <hr style={{ 
        border: 'none',
        height: '1px',
        backgroundColor: isDarkTheme ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        margin: '2rem 0',
      }} {...props} />
    ),
    text: ({ node, ...props }: any) => {
      const text = String(props.children);
      // Handle soft line breaks (lines ending with two spaces)
      const formattedText = text.replace(/ {2,}\n/g, '<br />');
      return (
        <span 
          style={{
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
          dangerouslySetInnerHTML={{ __html: formattedText }}
        />
      );
    },
  };

  const isThinkingComplete = thinkingContent.trim().length > 0;

  React.useEffect(() => {
    if (thinkingContent && !isThinkingComplete) {
      setShowThinking(true);
    } else if (isThinkingComplete && showThinking) {
      // Auto-close thinking indicator after a delay when the AI response is complete
      const timer = setTimeout(() => {
        setShowThinking(false);
      }, 2000); // 2 second delay before closing
      
      return () => clearTimeout(timer);
    }
  }, [thinkingContent, isThinkingComplete, showThinking]);

  // Add this before the return statement
  const renderAnalysisSection = () => {
    // Always show analysis section for assistant messages
    if (message.role !== 'assistant') return null;
    
    return (
      <div className="analysis-section">
        <div 
          className="analysis-header" 
          onClick={() => setShowThinking(!showThinking)}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '8px 12px',
            cursor: 'pointer',
            userSelect: 'none',
            backgroundColor: isDarkTheme ? 'rgba(30, 30, 30, 0.7)' : 'rgba(225, 225, 235, 0.9)',
            borderRadius: '4px',
          }}
        >
          <div className="analysis-header-text" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '12px',
            fontWeight: 600,
            letterSpacing: '0.7px',
            textTransform: 'uppercase',
            color: isDarkTheme ? 'rgba(200, 200, 200, 0.8)' : 'rgba(60, 60, 70, 0.9)',
          }}>
            <svg 
              width="14" 
              height="14" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="16" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
            ANALYSIS
          </div>
          <svg 
            className={`analysis-chevron ${showThinking ? 'open' : ''}`}
            width="14" 
            height="14" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            style={{
              transition: 'transform 0.3s ease',
              transform: showThinking ? 'rotate(180deg)' : 'rotate(0deg)'
            }}
          >
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </div>
        <div className={`analysis-content ${isThinking || showThinking ? 'open' : ''}`} style={{
          maxHeight: isThinking || showThinking ? '800px' : '0',
          overflow: 'hidden',
          fontFamily: 'monospace',
          fontSize: '13px',
          lineHeight: 1.5,
          color: isDarkTheme ? 'rgba(180, 180, 180, 0.9)' : 'rgba(50, 50, 60, 0.9)',
          whiteSpace: 'pre-wrap',
          transition: 'max-height 0.3s ease, padding 0.3s ease',
          padding: isThinking || showThinking ? '12px' : '0',
          borderTop: isThinking || showThinking ? `1px solid ${isDarkTheme ? 'rgba(60, 60, 60, 0.3)' : 'rgba(180, 180, 200, 0.3)'}` : 'none',
          backgroundColor: isDarkTheme ? 'rgba(20, 20, 20, 0.3)' : 'rgba(240, 240, 245, 0.3)',
        }}>
          {isThinking && (
            <div className="typing-indicator" style={{ marginBottom: '8px' }}>
              <span></span>
              <span></span>
              <span></span>
            </div>
          )}
          {thinkingContent || (isThinking ? "Processing request..." : "")}
        </div>
      </div>
    );
  };

  return (
    <>
      <style>{codeBlockStyles}</style>
      {message.role === 'user' && <ContextArea isDarkTheme={isDarkTheme} onAddMessage={addMessage} />}
      <div className={`message-item ${message.role}`} style={{
        marginBottom: '20px',
        padding: '16px',
        borderRadius: '8px',
        backgroundColor: message.role === 'assistant' 
          ? (isDarkTheme ? 'rgba(25, 25, 25, 0.9)' : 'rgba(245, 245, 250, 0.9)')
          : (isDarkTheme ? 'rgba(35, 35, 35, 0.5)' : 'rgba(235, 236, 240, 0.8)'),
        color: isDarkTheme ? '#e0e0e0' : '#252525',
        borderLeft: message.role === 'assistant'
          ? `4px solid ${isDarkTheme ? '#666' : '#888'}`
          : message.role === 'user'
            ? `4px solid ${isDarkTheme ? '#444' : '#aaa'}`
            : `4px solid ${isDarkTheme ? '#555' : '#bbb'}`,
        boxShadow: `0 2px 10px ${isDarkTheme ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.08)'}`,
        position: 'relative',
        opacity: 1,
        transition: 'opacity 0.3s ease, background-color 0.3s ease',
        minHeight: message.role === 'assistant' ? '100px' : 'auto',
        width: '100%',
        maxWidth: '100%',
        overflowX: 'hidden',
        boxSizing: 'border-box',
      }}>
        {/* Add styles */}
        <style>{typingIndicatorStyles}</style>
        
        {/* Message header for assistant */}
        {message.role === 'assistant' && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <MessageHeader isDarkTheme={isDarkTheme} timestamp={message.timestamp} />
            
            {/* Copy button - relocated next to the header */}
            {!isThinking && message.content && (
              <button
                onClick={handleCopy}
                style={{
                  background: 'none',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '6px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  color: isDarkTheme ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.4)',
                  backgroundColor: isDarkTheme ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                  transition: 'all 0.2s ease',
                  marginTop: '0',
                }}
                title={copySuccess ? 'Copied!' : 'Copy message'}
              >
                {copySuccess ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                  </svg>
                )}
              </button>
            )}
          </div>
        )}
        
        {/* Analysis section for all assistant responses */}
        {renderAnalysisSection()}
        
        {/* Main message content (hidden when thinking) */}
        {!isThinking && (
          <div style={{ 
            position: 'relative', 
            width: '100%',
            maxWidth: '100%',
            overflowX: 'auto',
            overflowY: 'hidden',
          }}>
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeRaw, rehypeSanitize]}
              components={{
                code: ({ node, inline, className, children, ...props }: any) => {
                  const match = /language-(\w+)/.exec(className || '');
                  const language = match ? match[1] : 'text';
                  return !inline ? (
                    <SyntaxHighlighter
                      style={isDarkTheme ? vscDarkPlus : vs}
                      language={language}
                      PreTag="div"
                      customStyle={{
                        margin: '1em 0', 
                        width: '100%',
                        maxWidth: '100%',
                        overflowX: 'auto',
                      }}
                    >
                      {String(children).replace(/\n$/, '')}
                    </SyntaxHighlighter>
                  ) : (
                    <code className={className} {...props} style={{
                      backgroundColor: isDarkTheme ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontSize: '13px',
                      fontFamily: 'var(--font-mono)',
                      color: isDarkTheme ? '#e0e0e0' : '#303030',
                    }}>
                      {children}
                    </code>
                  );
                }
              }}
            >
              {message.role === 'assistant' ? formatContent(mainContent || '') : (message.content || '')}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </>
  );
};

export default MessageItem; 