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
        backgroundColor: isDarkTheme ? '#1e1e1e' : '#d0d0d0',
        borderRadius: '4px',
        fontWeight: 500,
        fontSize: '11px',
        color: isDarkTheme ? '#e0e0e0' : '#404040',
        letterSpacing: '0.5px',
      }}>AGENT</span>
    </div>
    <div style={{
      fontSize: '11px',
      color: isDarkTheme ? 'rgba(224, 224, 224, 0.4)' : 'rgba(64, 64, 64, 0.4)',
    }}>
      {formatTime(timestamp)}
    </div>
  </div>
);

const MessageItem: React.FC<MessageItemProps> = ({ message, isThinking }) => {
  const { settings, addMessage } = useAppContext();
  const isDarkTheme = settings?.theme === 'dark';
  const [showThinking, setShowThinking] = useState(true);
  const [copySuccess, setCopySuccess] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Skip rendering entirely if there's no content and it's not a thinking state
  if (!isThinking && (!message || !message.content || message.content.trim() === '')) {
    return null;
  }

  // CSS for the typing indicator
  const typingIndicatorStyles = `
    .typing-indicator {
      display: flex;
      align-items: center;
    }
    
    .typing-indicator span {
      height: 8px;
      width: 8px;
      margin: 0 2px;
      background-color: ${isDarkTheme ? '#666' : '#999'};
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
        opacity: 1;
        transform: scale(1.2);
      }
      100% {
        opacity: 0.4;
        transform: scale(1);
      }
    }
  `;

  // Clean up headers if they exist
  let response = message.content;
  
  // Extract thinking content if it exists
  let thinkingContent = '';
  let mainContent = response;
  
  // First try to parse as JSON if it looks like a JSON string
  try {
    if (typeof response === 'string' && (response.trim().startsWith('{') || response.trim().startsWith('['))) {
      const parsed = JSON.parse(response);
      // Handle different response formats
      if (parsed.content) {
        mainContent = parsed.content;
      } else if (parsed.message?.content) {
        mainContent = parsed.message.content;
      } else if (parsed.error) {
        mainContent = `Error: ${parsed.error}`;
      } else if (!mainContent || mainContent.trim() === '') {
        mainContent = "I apologize, but I encountered an issue generating a response. Please try your question again.";
      }
    }
  } catch (e) {
    // If JSON parsing fails, continue with normal content extraction
    console.debug('Response is not JSON format:', e);
    
    // If the response is empty or invalid, provide a helpful message
    if (!mainContent || mainContent.trim() === '') {
      mainContent = "I apologize, but I encountered an issue generating a response. Please try your question again.";
    }
  }

  // Extract thinking content from <think> tags if present
  const thinkMatch = mainContent.match(/<think>([\s\S]*?)<\/think>/);
  if (thinkMatch) {
    thinkingContent = thinkMatch[1].trim();
    mainContent = mainContent.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
  }

  // Clean up any remaining JSON artifacts and ensure we have content
  mainContent = mainContent
    .replace(/^"/, '')
    .replace(/"$/, '')
    .replace(/\\n/g, '\n')
    .replace(/\\"/g, '"')
    .trim();

  // If after all processing we still have no content, provide a helpful message
  if (!mainContent || mainContent.trim() === '') {
    mainContent = "I apologize, but I encountered an issue generating a response. Please try your question again.";
  }

  // If we're explicitly in thinking state, show the thinking indicator
  if (isThinking) {
    return (
      <div
        className="message"
        style={{
          backgroundColor: isDarkTheme ? 'rgba(26, 26, 26, 0.4)' : 'rgba(240, 240, 240, 0.95)',
          padding: '16px 20px', 
          borderRadius: '8px',
          position: 'relative',
          opacity: 0.9,
          marginBottom: '24px',
          marginTop: '24px',
          border: `1px solid ${isDarkTheme ? 'rgba(255, 255, 255, 0.05)' : 'rgba(200, 200, 200, 0.8)'}`,
          boxShadow: !isDarkTheme ? '0 3px 10px rgba(0, 0, 0, 0.08)' : 'none',
          width: '100%',
          transition: 'opacity 0.3s ease-in-out',
        }}
      >
        <MessageHeader isDarkTheme={isDarkTheme} timestamp={Date.now()} />
        <div style={{
          display: 'flex',
          alignItems: 'center',
          padding: '0.5rem 0.75rem',
          whiteSpace: 'pre-line',
          wordBreak: 'break-word',
          lineHeight: 1.6,
          fontFamily: 'Inter, sans-serif',
        }}>
          <div className="typing-indicator">
            <span></span>
            <span></span>
            <span></span>
          </div>
          <div style={{marginLeft: '12px', fontSize: '14px', color: isDarkTheme ? '#e0e0e0' : '#404040'}}>
            Processing your request...
          </div>
        </div>
      </div>
    );
  }

  // Add a fallback for empty assistant messages - don't render empty messages from the assistant
  // This prevents briefly showing empty messages that might cause flickering
  if (message.role === 'assistant' && (!message.content || message.content.trim() === '')) {
    if (isThinking) {
      // Show simple thinking indicator to ensure it's lightweight and reliable
      return (
        <div className="message assistant-message thinking-message" style={{
          backgroundColor: isDarkTheme ? 'rgba(26, 26, 26, 0.4)' : 'rgba(240, 240, 240, 0.95)',
          padding: '16px 20px',
          borderRadius: '8px',
          position: 'relative',
          marginBottom: '24px',
          marginTop: '24px',
          border: `1px solid ${isDarkTheme ? 'rgba(255, 255, 255, 0.05)' : 'rgba(200, 200, 200, 0.8)'}`,
          boxShadow: !isDarkTheme ? '0 3px 10px rgba(0, 0, 0, 0.08)' : 'none',
          width: '100%',
        }}>
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
                backgroundColor: isDarkTheme ? '#1e1e1e' : '#d0d0d0',
                borderRadius: '4px',
                fontWeight: 500,
                fontSize: '11px',
                color: isDarkTheme ? '#e0e0e0' : '#404040',
                letterSpacing: '0.5px',
              }}>AGENT</span>
            </div>
            <div style={{
              fontSize: '11px',
              color: isDarkTheme ? 'rgba(224, 224, 224, 0.4)' : 'rgba(64, 64, 64, 0.4)',
            }}>
              {formatTime(message.timestamp || Date.now())}
            </div>
          </div>
            
          <div style={{ 
            display: 'flex', 
            alignItems: 'center',
            padding: '0.5rem 0.75rem',
            whiteSpace: 'pre-line',
            wordBreak: 'break-word',
            lineHeight: 1.6,
            fontFamily: 'Inter, sans-serif',
          }}>
            <div className="thinking-indicator" style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ fontSize: '14px', marginRight: '12px', color: isDarkTheme ? '#e0e0e0' : '#404040' }}>Processing</span>
              <div className="dots" style={{ display: 'flex' }}>
                <span style={{ 
                  height: '6px', 
                  width: '6px', 
                  borderRadius: '50%', 
                  margin: '0 2px',
                  backgroundColor: isDarkTheme ? '#aaa' : '#666',
                  animation: 'dotPulse 1s infinite',
                  animationDelay: '0s'
                }}></span>
                <span style={{ 
                  height: '6px', 
                  width: '6px', 
                  borderRadius: '50%', 
                  margin: '0 2px',
                  backgroundColor: isDarkTheme ? '#aaa' : '#666',
                  animation: 'dotPulse 1s infinite',
                  animationDelay: '0.2s'
                }}></span>
                <span style={{ 
                  height: '6px', 
                  width: '6px', 
                  borderRadius: '50%', 
                  margin: '0 2px',
                  backgroundColor: isDarkTheme ? '#aaa' : '#666',
                  animation: 'dotPulse 1s infinite',
                  animationDelay: '0.4s'
                }}></span>
              </div>
            </div>
          </div>
          
          <style jsx>{`
            @keyframes dotPulse {
              0%, 100% { opacity: 0.4; transform: scale(0.8); }
              50% { opacity: 1; transform: scale(1); }
            }
          `}</style>
        </div>
      );
    }
    return null;
  }

  // Add error message handling
  if (message.role === 'assistant' && mainContent.toLowerCase().includes("i'm sorry") && mainContent.toLowerCase().includes("couldn't process")) {
    return (
      <div style={{
        backgroundColor: isDarkTheme ? 'rgba(26, 26, 26, 0.4)' : 'rgba(240, 240, 240, 0.95)',
        padding: '16px 20px',
        borderRadius: '8px',
        marginBottom: '24px',
        marginTop: '24px',
        border: `1px solid ${isDarkTheme ? 'rgba(255, 255, 255, 0.05)' : 'rgba(200, 200, 200, 0.8)'}`,
        boxShadow: !isDarkTheme ? '0 3px 10px rgba(0, 0, 0, 0.08)' : 'none',
      }}>
        <MessageHeader isDarkTheme={isDarkTheme} timestamp={message.timestamp || Date.now()} />
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px',
          padding: '12px',
          backgroundColor: isDarkTheme ? 'rgba(255, 59, 48, 0.1)' : 'rgba(255, 59, 48, 0.05)',
          borderRadius: '6px',
          border: `1px solid ${isDarkTheme ? 'rgba(255, 59, 48, 0.2)' : 'rgba(255, 59, 48, 0.1)'}`,
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={isDarkTheme ? '#ff3b30' : '#dc2626'} strokeWidth="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <div style={{
            fontSize: '14px',
            color: isDarkTheme ? '#ff3b30' : '#dc2626',
            flex: 1,
          }}>
            The Ollama server appears to be offline. Please make sure it's running by:
            <ol style={{
              marginTop: '8px',
              marginLeft: '20px',
              color: isDarkTheme ? '#ff3b30' : '#dc2626',
            }}>
              <li>Opening a terminal</li>
              <li>Running the command: <code style={{
                backgroundColor: isDarkTheme ? 'rgba(255, 59, 48, 0.2)' : 'rgba(255, 59, 48, 0.1)',
                padding: '2px 6px',
                borderRadius: '4px',
              }}>ollama serve</code></li>
            </ol>
          </div>
        </div>
      </div>
    );
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
      // Fix extra spaces around punctuation
      .replace(/\s+([.,!?])/g, '$1')
      // Ensure proper spacing after punctuation
      .replace(/([.,!?])(\w)/g, '$1 $2')
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
      const lang = match ? match[1] : '';
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
        const lineMatch = /(\d+):(\d+):(.+)/.exec(lang);
        const displayLang = lineMatch ? lineMatch[3] : lang;
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
            backgroundColor: isDarkTheme ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
            padding: '2px 6px',
            borderRadius: '4px',
            fontSize: '13px',
            fontFamily: 'var(--font-mono)',
            color: isDarkTheme ? '#e0e0e0' : '#404040',
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

  return (
    <>
      <style>{codeBlockStyles}</style>
      {message.role === 'user' && <ContextArea isDarkTheme={isDarkTheme} onAddMessage={addMessage} />}
      <div className={isDarkTheme ? 'dark' : 'light'} style={{
        marginBottom: '1.5rem',
        fontFamily: message.role === 'assistant' ? 'Inter, sans-serif' : 'JetBrains Mono, monospace',
        fontSize: '14px',
        color: isDarkTheme ? '#e0e0e0' : '#404040',
        padding: '16px 20px',
        margin: '24px 0',
        borderRadius: '8px',
        backgroundColor: message.role === 'assistant' 
          ? (isDarkTheme ? 'rgba(26, 26, 26, 0.4)' : 'rgba(240, 240, 240, 0.95)')
          : 'transparent',
        border: message.role === 'assistant'
          ? `1px solid ${isDarkTheme ? 'rgba(255, 255, 255, 0.05)' : 'rgba(200, 200, 200, 0.8)'}`
          : 'none',
        boxShadow: message.role === 'assistant' && !isDarkTheme 
          ? '0 3px 10px rgba(0, 0, 0, 0.08)'
          : 'none',
        position: 'relative',
      }}>
        {message.role === 'assistant' && (
          <MessageHeader isDarkTheme={isDarkTheme} timestamp={message.timestamp || Date.now()} />
        )}
        
        {/* Display thinking content if it exists */}
        {thinkingContent && (
          <div style={{
            marginBottom: '16px',
            padding: '16px',
            borderRadius: '8px',
            backgroundColor: isDarkTheme ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.03)',
            border: `1px solid ${isDarkTheme ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
            fontSize: '14px',
            color: isDarkTheme ? '#d0d0d0' : '#404040',
            fontFamily: 'Inter, sans-serif',
            transition: 'all 0.3s ease',
            maxHeight: showThinking ? '2000px' : '40px',
            overflow: 'hidden',
            cursor: 'pointer',
          }} onClick={() => setShowThinking(!showThinking)}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              marginBottom: showThinking ? '12px' : '0',
              color: isDarkTheme ? '#888' : '#666',
              fontSize: '13px',
              fontWeight: 500,
              borderBottom: showThinking ? `1px solid ${isDarkTheme ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}` : 'none',
              paddingBottom: showThinking ? '8px' : '0'
            }}>
              <svg 
                width="16" 
                height="16" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                style={{ 
                  marginRight: '8px',
                  transform: showThinking ? 'rotate(0deg)' : 'rotate(-90deg)',
                  transition: 'transform 0.3s ease'
                }}
              >
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
              </svg>
              Thinking Process
              <span style={{
                marginLeft: '8px',
                fontSize: '11px',
                opacity: 0.7,
                fontWeight: 400
              }}>
                {showThinking ? '(click to collapse)' : '(click to expand)'}
              </span>
            </div>
            <div style={{
              opacity: showThinking ? 1 : 0,
              transition: 'opacity 0.3s ease',
              pointerEvents: showThinking ? 'auto' : 'none'
            }}>
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw, rehypeSanitize]}
                components={commonMarkdownStyles}
              >
                {formatThinking(thinkingContent)}
              </ReactMarkdown>
            </div>
          </div>
        )}
        
        {/* Display main content */}
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeRaw, rehypeSanitize]}
          components={{
            code({node, inline, className, children, ...props}: any) {
              const match = /language-(\w+)/.exec(className || '');
              return !inline && match ? (
                <SyntaxHighlighter
                  style={isDarkTheme ? vscDarkPlus : vs}
                  language={match[1]}
                  PreTag="div"
                  customStyle={{margin: '1em 0'}}
                >
                  {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
              ) : (
                <code className={className} {...props}>
                  {children}
                </code>
              );
            }
          }}
        >
          {mainContent}
        </ReactMarkdown>

        <div style={{
          fontSize: '11px',
          color: isDarkTheme ? 'rgba(224, 224, 224, 0.4)' : 'rgba(64, 64, 64, 0.4)',
          marginTop: '0.75rem',
          paddingTop: '0.75rem',
          borderTop: `1px solid ${isDarkTheme ? 'rgba(42, 42, 42, 0.2)' : 'rgba(224, 224, 224, 0.3)'}`,
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          gap: '12px',
        }}>
          <span>{formatTime(message.timestamp || Date.now())}</span>
          
          {message.role === 'assistant' && (
            <button
              onClick={handleCopy}
              className="command-button"
              style={{
                cursor: 'pointer',
                padding: '4px 8px',
                borderRadius: '4px',
                backgroundColor: 'transparent',
                border: 'none',
                color: copySuccess 
                  ? (isDarkTheme ? '#81c784' : '#4caf50')
                  : (isDarkTheme ? 'rgba(224, 224, 224, 0.5)' : 'rgba(64, 64, 64, 0.5)'),
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '11px',
                opacity: 0.8,
              }}
              title="Copy response"
            >
              {copySuccess ? (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  <span style={{ fontSize: '11px', letterSpacing: '0.5px' }}>Copied</span>
                </>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
              )}
            </button>
          )}
        </div>
      </div>
    </>
  );
};

export default MessageItem; 