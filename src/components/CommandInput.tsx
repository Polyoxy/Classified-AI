import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAppContext } from '@/context/AppContext';
import { useChat } from '@/hooks/useChat';
import TextareaAutosize from 'react-textarea-autosize';
import { FaPaperPlane, FaStop, FaRobot, FaChevronDown } from 'react-icons/fa';

// Add styles for the pulsing animation
const pulsingLightningStyles = `
  @keyframes pulse {
    0% {
      transform: scale(1);
      opacity: 0.7;
    }
    50% {
      transform: scale(1.3);
      opacity: 1;
    }
    100% {
      transform: scale(1);
      opacity: 0.7;
    }
  }

  .lightning-icon {
    animation: pulse 1.5s ease-in-out infinite;
    transform-origin: center;
  }
`;

// Example questions to cycle through - simplified list
const EXAMPLE_QUESTIONS = [
  "How can I optimize my React application's performance?",
  "Write a Python script to analyze data",
  "Create a landing page with Next.js",
  "Help me debug this function",
  "What are the best practices for API design?",
];

const CommandInput: React.FC = () => {
  const [input, setInput] = useState('');
  const [placeholder, setPlaceholder] = useState("Enter command...");
  const [targetPlaceholder, setTargetPlaceholder] = useState("Enter command...");
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  
  // Add state for response style
  const [responseStyle, setResponseStyle] = useState(() => {
    // Try to load saved style from localStorage
    if (typeof window !== 'undefined') {
      const savedStyle = localStorage.getItem('preferredResponseStyle');
      return savedStyle || 'normal';
    }
    return 'normal';
  });
  const [showStyleDropdown, setShowStyleDropdown] = useState(false);
  
  // Add style descriptions for the AI to understand what each style means
  const styleDescriptions = {
    normal: "Use a conversational tone with appropriate formatting. Include clear headings for sections using markdown formatting (## for headings), lists when appropriate, and properly format any code blocks with ```language syntax.",
    concise: "Keep your response very brief and to the point. Minimize explanation and focus only on the most essential information. Still use markdown ## headings for key points and proper code formatting when needed.",
    explanatory: "Provide a detailed explanation with examples. Break down complex concepts and explain thoroughly. Use proper markdown formatting with ## headings for sections, * for lists, and ```language for code blocks. Make your explanations well-structured and visually organized.",
    formal: "Use formal language, proper terminology, and structured format. Avoid colloquialisms and maintain a professional tone. Include a proper structure with ## headings and subheadings, and organize content logically with clear sections."
  };
  
  const { 
    settings,
    addMessage,
    isProcessing,
    setIsProcessing,
    currentConversation,
    createConversation,
    changeModel,
  } = useAppContext();
  
  // Add state for model dropdown
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  
  // Reference for model dropdown
  const modelDropdownRef = useRef<HTMLDivElement>(null);
  const modelSelectorRef = useRef<HTMLDivElement>(null);
  
  // Reference for style dropdown
  const styleDropdownRef = useRef<HTMLDivElement>(null);
  const styleSelectorRef = useRef<HTMLDivElement>(null);
  
  // Handle click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Handle model dropdown
      if (
        showModelDropdown && 
        modelDropdownRef.current && 
        modelSelectorRef.current && 
        !modelDropdownRef.current.contains(event.target as Node) &&
        !modelSelectorRef.current.contains(event.target as Node)
      ) {
        setShowModelDropdown(false);
      }
      
      // Handle style dropdown
      if (
        showStyleDropdown && 
        styleDropdownRef.current && 
        styleSelectorRef.current && 
        !styleDropdownRef.current.contains(event.target as Node) &&
        !styleSelectorRef.current.contains(event.target as Node)
      ) {
        setShowStyleDropdown(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showModelDropdown, showStyleDropdown]);
  
  // Define a model interface
  interface Model {
    id: string;
    name: string;
  }
  
  // Get available models for the current provider
  const getAvailableModels = (): string[] => {
    if (settings && settings.activeProvider) {
      const providerConfig = settings.providers[settings.activeProvider];
      if (providerConfig && providerConfig.models) {
        return providerConfig.models;
      }
    }
    return [];
  };
  
  const availableModels = getAvailableModels();
  
  // Model-related functions
  const isDeepThinkModel = (model: string | undefined): boolean => {
    return model ? model.toLowerCase().includes('deepseek') || model.toLowerCase().includes('deepthink') : false;
  };
  
  const isVisionModel = (model: string | undefined): boolean => {
    return model ? model.toLowerCase().includes('vision') : false;
  };
  
  // Get the current model name from context
  const getCurrentModel = () => {
    if (currentConversation?.model) {
      return currentConversation.model;
    }
    
    // Default to the first model
    if (settings?.activeProvider) {
      const provider = settings.providers[settings.activeProvider];
      return provider.defaultModel;
    }
    
    return 'Unknown Model';
  };
  
  const [currentModel, setCurrentModel] = useState<string>(getCurrentModel());
  
  // Update currentModel whenever the conversation changes
  useEffect(() => {
    setCurrentModel(getCurrentModel());
  }, [currentConversation]);
  
  // Add additional styles for the gradient and mobile optimization
  const customStyles = `
    @media (max-width: 767px) {
      .command-input {
        position: fixed !important;
        bottom: 32px !important; /* More space from bottom on mobile */
        left: 10px !important;
        right: 10px !important;
        width: calc(100% - 20px) !important;
        max-width: calc(100% - 20px) !important;
        margin: 0 auto !important;
        z-index: 80 !important;
        background: ${settings?.theme === 'dark' 
          ? 'linear-gradient(to bottom, rgba(18, 18, 18, 0.85), rgba(24, 24, 24, 0.95))' 
          : 'linear-gradient(to bottom, rgba(245, 245, 245, 0.85), rgba(250, 250, 250, 0.95))'} !important;
        padding: 12px 16px !important; /* Larger padding for bigger input area */
        min-height: 60px !important; /* Increase minimum height */
        box-shadow: 0px 2px 4px ${settings?.theme === 'dark' ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.1)'} !important;
        border-radius: var(--border-radius) !important;
      }
      
      .command-input textarea {
        font-size: 16px !important; /* Larger font size on mobile */
        min-height: 24px !important; /* Taller input area */
      }
      
      body.has-open-panel .command-input {
        opacity: 0 !important;
        visibility: hidden !important;
        transition: opacity 0.3s ease, visibility 0.3s ease !important;
      }
    }
    
    @media (min-width: 768px) {
      .command-input {
        position: fixed !important;
        bottom: 48px !important; /* More space from bottom on desktop */
        left: 50% !important;
        transform: translateX(-50%) !important;
        margin: 0 !important;
        z-index: 80 !important;
        width: calc(100% - 3rem) !important;
        max-width: 800px !important;
        box-shadow: 0px 2px 4px ${settings?.theme === 'dark' ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.1)'} !important;
        border-radius: var(--border-radius) !important;
      }
      
      body.has-open-panel .command-input {
        transform: translateX(calc(-50% - 25%)) !important;
        max-width: 400px !important;
        transition: transform 0.3s ease-in-out, max-width 0.3s ease-in-out !important;
      }
    }
  `;
  
  // Use our chat hook
  const { sendMessage: chatSendMessage, stopResponse } = useChat();
  
  // Add state for message summary
  const [messageSummary, setMessageSummary] = useState<string>('');
  
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const animationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const cycleTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Function to scramble text with enhanced hacker effect
  const scrambleText = (target: string, current: string, progress: number) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    
    return target.split('').map((char, index) => {
      if (char === ' ' || /[.,?!]/.test(char)) {
        return char;
      }

      if (index < progress * target.length) {
        return char;
      }
      
      const rand = Math.random();
      const closeToReveal = (index - (progress * target.length)) < 2;
      if (closeToReveal && rand > 0.6) {
        return target[index];
      }
      
      return rand > 0.8 ? target[index] : chars[Math.floor(Math.random() * chars.length)];
    }).join('');
  };

  // Animation function to gradually transform placeholder
  const animatePlaceholder = (current: string, target: string, startTime: number) => {
    const duration = 1200;
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    if (progress < 1) {
      setPlaceholder(scrambleText(target, current, progress));
      animationTimerRef.current = setTimeout(() => {
        animatePlaceholder(current, target, startTime);
      }, 20);
    } else {
      setPlaceholder(target);
      cycleTimerRef.current = setTimeout(() => {
        const nextIndex = (placeholderIndex + 1) % EXAMPLE_QUESTIONS.length;
        setPlaceholderIndex(nextIndex);
        setTargetPlaceholder(EXAMPLE_QUESTIONS[nextIndex]);
      }, 4000);
    }
  };

  // Effect to handle placeholder animation
  useEffect(() => {
    if (!isProcessing && targetPlaceholder !== placeholder) {
      if (animationTimerRef.current) {
        clearTimeout(animationTimerRef.current);
      }
      animatePlaceholder(placeholder, targetPlaceholder, Date.now());
    }
    
    return () => {
      if (animationTimerRef.current) clearTimeout(animationTimerRef.current);
      if (cycleTimerRef.current) clearTimeout(cycleTimerRef.current);
    };
  }, [targetPlaceholder, isProcessing]);
  
  // Start cycling through examples
  useEffect(() => {
    cycleTimerRef.current = setTimeout(() => {
      setTargetPlaceholder(EXAMPLE_QUESTIONS[0]);
    }, 3000);
    
    return () => {
      if (cycleTimerRef.current) clearTimeout(cycleTimerRef.current);
      if (animationTimerRef.current) clearTimeout(animationTimerRef.current);
    };
  }, []);

  // Handle input change and auto resize
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    if (inputRef.current) {
      // Reset height temporarily to get the correct scrollHeight
      inputRef.current.style.height = '24px';
      
      // Get the scroll height (content height)
      const scrollHeight = inputRef.current.scrollHeight;
      
      // Set a maximum height for the textarea
      const maxHeight = 150;
      
      // Set to scrollHeight to adjust to content, but cap at maxHeight
      const newHeight = Math.min(scrollHeight, maxHeight);
      inputRef.current.style.height = `${newHeight}px`;
      
      // Enable scrolling if content exceeds max height
      inputRef.current.style.overflowY = scrollHeight > maxHeight ? 'auto' : 'hidden';
      
      // Calculate total height for container (textarea + selector row)
      const selectorRowHeight = 34; // Height of the selector row
      const paddingSpace = 24; // Top and bottom padding combined
      const containerHeight = newHeight + selectorRowHeight + paddingSpace;
      
      // Update the container height
      const container = inputRef.current.closest('.command-input-container') as HTMLElement;
      if (container) {
        // Set minimum container height to 118px, but allow it to grow with content
        const minContainerHeight = 130;
        container.style.height = `${Math.max(minContainerHeight, containerHeight)}px`;
      }
    }
  };
  
  // Auto-resize when component mounts or input changes
  useEffect(() => {
    if (inputRef.current && input) {
      // Reset height temporarily to get the correct scrollHeight
      inputRef.current.style.height = '24px';
      
      // Get the scroll height (content height)
      const scrollHeight = inputRef.current.scrollHeight;
      
      // Set a maximum height for the textarea
      const maxHeight = 150;
      
      // Set to scrollHeight to adjust to content, but cap at maxHeight
      const newHeight = Math.min(scrollHeight, maxHeight);
      inputRef.current.style.height = `${newHeight}px`;
      
      // Enable scrolling if content exceeds max height
      inputRef.current.style.overflowY = scrollHeight > maxHeight ? 'auto' : 'hidden';
      
      // Calculate total height for container (textarea + selector row)
      const selectorRowHeight = 34; // Height of the selector row
      const paddingSpace = 24; // Top and bottom padding combined
      const containerHeight = newHeight + selectorRowHeight + paddingSpace;
      
      // Update the container height
      const container = inputRef.current.closest('.command-input-container') as HTMLElement;
      if (container) {
        // Set minimum container height to 118px, but allow it to grow with content
        const minContainerHeight = 130;
        container.style.height = `${Math.max(minContainerHeight, containerHeight)}px`;
      }
    }
  }, [input]);
  
  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  // Add function to generate a summary of user's message
  const generateMessageSummary = (message: string): string => {
    if (!message) return '';
    
    // Remove any style prefixes
    const cleanMessage = message.replace(/^\[Response style: [a-z]+\]\s*/i, '');
    
    // If message is short enough, return it as is
    if (cleanMessage.length <= 60) return cleanMessage;
    
    // Try to extract the main intent from the message
    if (cleanMessage.includes('?')) {
      // Extract the first question
      const question = cleanMessage.split('?')[0] + '?';
      if (question.length <= 100) return question;
    }
    
    // Otherwise truncate with ellipsis
    return cleanMessage.substring(0, 60) + '...';
  };

  // Handle send message
  const handleSendMessage = () => {
    if (input.trim() && !isProcessing) {
      // Generate and store a summary of the user's message
      setMessageSummary(generateMessageSummary(input.trim()));
      
      // Get the message text with appropriate prefix
      let messageToSend = input.trim();
      
      // Add response style if not normal
      if (responseStyle !== 'normal') {
        // Use multiple approaches to ensure the AI understands the style request
        messageToSend = `[Response style: ${responseStyle}] ${messageToSend}`;
      }
      
      chatSendMessage(messageToSend);
      setInput('');
      
      // Reset textarea height
      if (inputRef.current) {
        inputRef.current.style.height = '24px';
        inputRef.current.style.overflowY = 'hidden';
        
        // Reset container height to minimum
        const container = inputRef.current.closest('.command-input-container') as HTMLElement;
        if (container) {
          container.style.height = '130px'; // Reset to minimum height
        }
      }
    }
  };
  
  // Handle manual focus when user clicks in the input area
  const handleInputClick = () => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
    
    // Ensure we're connected to the AI when the user interacts with the input
    if (!currentConversation) {
      createConversation();
    }
  };
  
  // Handle cancel message
  const handleCancelMessage = () => {
    if (isProcessing) {
      // Call stopResponse which handles stopping the ongoing response
      stopResponse();
    }
  };
  
  // Handle model change
  const handleModelChange = (model: string) => {
    if (currentConversation && !isProcessing) {
      // Use the changeModel function from context to actually change the model
      changeModel(model);
      setCurrentModel(model);
      setShowModelDropdown(false);
    }
  };
  
  // Update button styles
  const buttonStyle: React.CSSProperties = {
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: '6px',
    padding: '6px 10px',
    marginLeft: '8px',
    cursor: 'pointer',
    color: settings?.theme === 'dark' ? 'rgba(208, 208, 208, 0.6)' : 'rgba(64, 64, 64, 0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
    opacity: !input.trim() || isProcessing ? 0.3 : 0.6,
    height: '40px',
    width: '40px',
    flexShrink: 0,
  };

  // Save style whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('preferredResponseStyle', responseStyle);
    }
  }, [responseStyle]);

  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // Focus search input when modal opens
  useEffect(() => {
    if (isSearchModalOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [isSearchModalOpen]);

  // Handle search form submission
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    setSearchError(null);
    
    try {
      setSearchResults([]);
    } catch (error) {
      console.error('Search error:', error);
      setSearchError(
        error instanceof Error 
          ? error.message 
          : 'An error occurred while searching'
      );
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Helper function to clean up model names for display
  const formatModelName = (model: string): string => {
    if (!model) return 'Unknown';
    
    // Remove version numbers and special characters
    let displayName = model;
    
    // Special case handling for common models
    if (model.includes('deepseek-r1')) {
      if (model.includes('1.5b')) {
        return 'DeepSeek 1.5B';
      } else if (model.includes('7b')) {
        return 'DeepSeek 7B';
      } else if (model.includes('14b')) {
        return 'DeepSeek 14B';
      }
      return 'DeepSeek';
    }
    
    if (model.includes('llama3.2')) {
      if (model.includes('vision')) {
        return 'Llama3 11B';
      }
      
      if (model.includes('1b')) {
        return 'Llama3 1B';
      } else if (model.includes('11b')) {
        return 'Llama3 11B';
      }
      return 'Llama3';
    }
    
    // Remove any special characters and format remaining
    displayName = displayName
      .replace(/[-:]/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
    
    return displayName;
  };

  // New useEffect for positioning the model dropdown correctly
  useEffect(() => {
    if (showModelDropdown && modelDropdownRef.current && modelSelectorRef.current) {
      // Position the dropdown above the model selector
      const selectorRect = modelSelectorRef.current.getBoundingClientRect();
      
      // Apply left offset to move dropdown more to the left
      modelDropdownRef.current.style.left = `${selectorRect.left - 280}px`;
      modelDropdownRef.current.style.bottom = `${window.innerHeight - selectorRect.top + -15}px`;
    }
  }, [showModelDropdown]);

  // New useEffect for positioning the style dropdown correctly
  useEffect(() => {
    if (showStyleDropdown && styleDropdownRef.current && styleSelectorRef.current) {
      // Position the dropdown above the style selector
      const selectorRect = styleSelectorRef.current.getBoundingClientRect();
      
      // Apply left offset to move dropdown more to the left
      styleDropdownRef.current.style.left = `${selectorRect.left - 280}px`;
      styleDropdownRef.current.style.bottom = `${window.innerHeight - selectorRect.top + -15}px`;
    }
  }, [showStyleDropdown]);

  return (
    <div style={{
      position: 'sticky',
      bottom: '0',
      left: '0',
      right: '0',
      zIndex: 100,
      backgroundColor: settings?.theme === 'dark' ? 'rgba(24, 24, 24, 0.7)' : 'rgba(252, 252, 252, 0.8)',
      padding: '1rem',
      transition: 'right 0.3s ease, left 0.3s ease, transform 0.3s ease',
      backdropFilter: 'blur(8px)',
    }}>
      <div className="command-input-container-wrapper" style={{
        margin: '0 auto',
        position: 'relative',
        transition: 'width 0.3s ease, transform 0.3s ease',
      }}>
        <div className="command-input-container" style={{
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: settings?.theme === 'dark' ? 'rgba(32, 32, 32, 0.7)' : 'rgba(252, 252, 252, 0.8)',
          borderRadius: 'var(--input-border-radius)',
          padding: '14px 18px',
          height: 'auto',
          minHeight: '60px',
          maxHeight: '300px',
          position: 'relative',
          transition: 'height 0.3s ease, width 0.3s ease, transform 0.3s ease',
          justifyContent: 'space-between',
          boxShadow: `0px 2px 4px ${settings?.theme === 'dark' ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.08)'}`,
          backdropFilter: 'blur(8px)',
        }}>
          <style>
            {`
              .command-input-container::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                border-radius: var(--input-border-radius);
                background: transparent;
                pointer-events: none;
              }
              
              @keyframes borderGlow {
                0% {
                  filter: brightness(1) blur(1px);
                }
                50% {
                  filter: brightness(1.2) blur(1.5px);
                }
                100% {
                  filter: brightness(1) blur(1px);
                }
              }
              
              .selector-button {
                background-color: transparent;
                border: none;
                border-radius: var(--border-radius);
                color: ${settings?.theme === 'dark' ? '#d0d0d0' : '#333'};
                padding: 4px 8px;
                font-size: 12px;
                cursor: pointer;
                display: flex;
                alignItems: center;
                gap: 5px;
                height: 26px;
                transition: background 0.2s, transform 0.1s;
                user-select: none;
              }
              
              .selector-button:hover {
                background-color: ${settings?.theme === 'dark' ? 'rgba(58, 58, 58, 0.4)' : 'rgba(240, 240, 240, 0.8)'};
                transform: scale(1.02);
              }
              
              .badge-container {
                position: relative;
                border-radius: 6px;
                overflow: hidden;
              }
              
              .badge-container::before {
                content: '';
                position: absolute;
                top: -1px;
                left: -1px;
                right: -1px;
                bottom: -1px;
                background: ${settings?.theme === 'dark' ? 
                  'linear-gradient(90deg, rgba(255,255,255,0.01), rgba(255,255,255,0.08), rgba(255,255,255,0.01))' : 
                  'linear-gradient(90deg, rgba(255,255,255,0.2), rgba(255,255,255,0.6), rgba(255,255,255,0.2))'
                };
                z-index: 0;
                background-size: 200% 200%;
                animation: movingStroke 3s ease-in-out infinite;
                pointer-events: none;
                border-radius: 6px;
              }
              
              @media (max-width: 767px) {
                .command-input-container-wrapper {
                  width: 100% !important;
                  min-width: 100% !important;
                  max-width: 100% !important;
                }
                
                .command-input-container {
                  width: 100% !important;
                  padding: 10px 14px !important;
                  background: ${settings?.theme === 'dark' ? 
                    'rgba(32, 32, 32, 0.7)' : 
                    'rgba(252, 252, 252, 0.8)'
                  } !important;
                }
                
                .selector-button {
                  font-size: 11px !important;
                  padding: 3px 6px !important;
                }
                
                body.has-open-panel .command-input-container-wrapper {
                  opacity: 0 !important;
                  visibility: hidden !important;
                  transition: opacity 0.3s ease, visibility 0.3s ease !important;
                }
              }
            `}
          </style>
          
          {/* Top section: Input and send button */}
          <div style={{ 
            display: 'flex',
            alignItems: 'flex-start', // Changed from center to flex-start to handle multi-line input
            gap: '12px',
            outline: 'none',
            minHeight: '20px',
            position: 'relative',
          }}>
            <div 
              onClick={handleInputClick}
              style={{ 
                flex: 1, 
                cursor: 'text',
                outline: 'none',
                minHeight: '20px',
                position: 'relative',
              }}
            >
              <textarea
                ref={inputRef}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyPress}
                disabled={isProcessing}
                placeholder={isProcessing ? "Processing request..." : placeholder}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: settings?.theme === 'dark' ? '#d0d0d0' : '#505050', 
                  fontFamily: 'var(--font-family-mono)',
                  fontSize: '14px',
                  resize: 'none',
                  height: 'auto', // Changed from fixed to auto
                  minHeight: '32px',
                  maxHeight: '200px', // Maximum height
                  width: '100%',
                  outline: 'none',
                  padding: '0',
                  paddingTop: '0',
                  overflow: 'auto', // Allow scrolling
                  lineHeight: 1.4,
                  verticalAlign: 'middle',
                  caretColor: settings?.theme === 'dark' ? '#d0d0d0' : '#505050',
                  position: 'relative',
                  zIndex: 2,
                  letterSpacing: '0.01em',
                }}
                rows={1}
                autoComplete="off"
                autoCorrect="off"
                spellCheck="false"
                autoCapitalize="off"
                className="no-focus-visible"
              />
            </div>
            
            <button
              onClick={handleSendMessage}
              disabled={!input.trim() || isProcessing}
              className={`command-button ${(!input.trim() || isProcessing) ? 'command-button-disabled' : ''}`}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                color: settings?.theme === 'dark' ? 'rgba(208, 208, 208, 0.6)' : 'rgba(64, 64, 64, 0.6)',
                cursor: input.trim() && !isProcessing ? 'pointer' : 'not-allowed',
                padding: '0.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: input.trim() && !isProcessing ? 0.6 : 0.3,
                transition: 'opacity 0.2s ease',
                flexShrink: 0,
                marginTop: '2px', // Added to align with text
              }}
              title="Send message"
            >
              <svg 
                width="16" 
                height="16" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </button>
            
            {isProcessing && (
              <button
                onClick={handleCancelMessage}
                className="command-button"
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: settings?.theme === 'dark' ? 'rgba(208, 208, 208, 0.6)' : 'rgba(64, 64, 64, 0.6)',
                  cursor: 'pointer',
                  padding: '0.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: 0.6,
                  transition: 'opacity 0.2s ease',
                  flexShrink: 0,
                  marginTop: '2px', // Added to align with text
                }}
                title="Stop generating"
              >
                <svg 
                  width="16" 
                  height="16" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                </svg>
              </button>
            )}
          </div>
          
          {/* Bottom section: Style selector and model selector */}
          <div style={{
            display: 'flex',
            gap: 'var(--spacing-2)',
            alignSelf: 'flex-start',
            justifyContent: 'space-between',
            marginTop: '8px', 
            paddingTop: '0',
            height: '38px',
            width: '100%',
          }}>
            <div style={{
              display: 'flex',
              gap: 'var(--spacing-2)',
              alignItems: 'center',
              height: '32px',
            }}>
              {/* Model selector (left side) */}
              <div 
                ref={modelSelectorRef}
                onClick={() => !isProcessing && setShowModelDropdown(!showModelDropdown)}
                className="selector-button"
                style={{
                  opacity: isProcessing ? 0.6 : 1,
                  width: 'auto',
                  minWidth: '130px',
                  whiteSpace: 'nowrap',
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 'var(--spacing-1)',
                  height: '32px',
                  background: isVisionModel(currentModel) 
                    ? `${settings?.theme === 'dark' ? 'rgba(255, 80, 80, 0.15)' : 'rgba(255, 60, 60, 0.07)'}`
                    : isDeepThinkModel(currentModel)
                    ? `${settings?.theme === 'dark' ? 'rgba(0, 102, 204, 0.15)' : 'rgba(0, 102, 204, 0.07)'}`
                    : settings?.theme === 'dark' ? 'rgba(58, 58, 58, 0.4)' : 'rgba(240, 240, 240, 0.7)',
                  borderRadius: '6px',
                  padding: '0 12px',
                  cursor: isProcessing ? 'default' : 'pointer',
                  transition: 'background 0.2s ease, opacity 0.2s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {isVisionModel(currentModel) && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"></path>
                      <circle cx="12" cy="12" r="2"></circle>
                    </svg>
                  )}
                  {isDeepThinkModel(currentModel) && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 3.5c5.5 0 8.5 3.5 8.5 7.5 0 2.25-.5 3.5-2 5-1.5 1.5-3.5 2.5-6.5 2.5s-5-1-6.5-2.5c-1.5-1.5-2-2.75-2-5 0-4 3-7.5 8.5-7.5z" />
                      <path d="M9 17.5v2.5" />
                      <path d="M15 17.5v2.5" />
                      <path d="M6 10a1 1 0 100-2 1 1 0 000 2z" />
                      <path d="M18 10a1 1 0 100-2 1 1 0 000 2z" />
                    </svg>
                  )}
                  <span style={{ 
                    fontWeight: 500,
                    fontSize: '13px',
                    maxWidth: isVisionModel(currentModel) || isDeepThinkModel(currentModel) ? '84px' : '110px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    lineHeight: '32px',
                  }}>
                    {formatModelName(currentModel)}
                  </span>
                </div>
                
                <svg 
                  width="14" 
                  height="14" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="white" 
                  strokeWidth="2.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                  style={{
                    transform: showModelDropdown ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s ease',
                  }}
                >
                  <polyline points="7 10 12 15 17 10"></polyline>
                </svg>
              </div>
              
              {/* Model dropdown (opens upward) */}
              {showModelDropdown && (
                <div 
                  ref={modelDropdownRef}
                  style={{
                    position: 'fixed',
                    bottom: '48px', // Increase distance from button
                    left: '0',
                    backgroundColor: settings?.theme === 'dark' ? '#1A1A1A' : '#ffffff',
                    border: `1px solid ${settings?.theme === 'dark' ? '#333' : '#ddd'}`,
                    borderRadius: '6px',
                    marginBottom: '8px',
                    zIndex: 10000,
                    maxHeight: '240px',
                    overflowY: 'auto',
                    boxShadow: settings?.theme === 'dark' ? '0 -4px 8px rgba(0,0,0,0.3)' : '0 -4px 8px rgba(0,0,0,0.1)',
                    fontFamily: 'Söhne, sans-serif',
                    minWidth: '180px',
                    backdropFilter: 'blur(8px)',
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {availableModels.map((model) => (
                    <div 
                      key={model}
                      className="model-option"
                      onClick={() => handleModelChange(model)}
                      style={{
                        padding: '8px 12px',
                        cursor: 'pointer',
                        backgroundColor: model === currentModel
                          ? (settings?.theme === 'dark' ? '#333' : '#e0e0e0') 
                          : 'transparent',
                        transition: 'all 0.1s ease',
                        fontSize: '13px',
                        fontWeight: model === currentModel ? '500' : 'normal',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 'var(--spacing-1)',
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.backgroundColor = settings?.theme === 'dark' ? '#333' : '#e0e0e0';
                      }}
                      onMouseOut={(e) => {
                        if (model !== currentModel) {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }
                      }}
                    >
                      <span>{formatModelName(model)}</span>
                      
                      {/* Model type indicator - icon only */}
                      {(isVisionModel(model) || isDeepThinkModel(model)) && (
                        <span style={{ 
                          fontSize: '10px',
                          padding: '5px',
                          borderRadius: '4px',
                          background: isVisionModel(model)
                            ? `${settings?.theme === 'dark' ? 'rgba(255, 80, 80, 0.4)' : 'rgba(255, 60, 60, 0.3)'}`
                            : `${settings?.theme === 'dark' ? 'rgba(0, 102, 204, 0.2)' : 'rgba(0, 102, 204, 0.1)'}`,
                          color: isVisionModel(model)
                            ? `${settings?.theme === 'dark' ? '#ffffff' : '#ffffff'}`
                            : `${settings?.theme === 'dark' ? '#ffffff' : '#ffffff'}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}>
                          {isVisionModel(model) ? (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"></path>
                              <circle cx="12" cy="12" r="2"></circle>
                            </svg>
                          ) : (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M12 3.5c5.5 0 8.5 3.5 8.5 7.5 0 2.25-.5 3.5-2 5-1.5 1.5-3.5 2.5-6.5 2.5s-5-1-6.5-2.5c-1.5-1.5-2-2.75-2-5 0-4 3-7.5 8.5-7.5z" />
                              <path d="M9 17.5v2.5" />
                              <path d="M15 17.5v2.5" />
                              <path d="M6 10a1 1 0 100-2 1 1 0 000 2z" />
                              <path d="M18 10a1 1 0 100-2 1 1 0 000 2z" />
                            </svg>
                          )}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
              
              {/* Style selector (right side) */}
              <div 
                ref={styleSelectorRef}
                onClick={() => !isProcessing && setShowStyleDropdown(!showStyleDropdown)}
                className="selector-button"
                style={{
                  opacity: isProcessing ? 0.6 : 1,
                  width: 'auto',
                  minWidth: '130px',
                  whiteSpace: 'nowrap',
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 'var(--spacing-1)',
                  height: '32px',
                  background: settings?.theme === 'dark' ? 'rgba(58, 58, 58, 0.4)' : 'rgba(240, 240, 240, 0.7)',
                  borderRadius: '6px',
                  padding: '0 12px',
                  cursor: isProcessing ? 'default' : 'pointer',
                  transition: 'background 0.2s ease, opacity 0.2s ease',
                }}
              >
                <span style={{ 
                  fontWeight: 500,
                  fontSize: '13px',
                  maxWidth: '110px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  lineHeight: '32px',
                }}>
                  {responseStyle.charAt(0).toUpperCase() + responseStyle.slice(1)}
                </span>
                
                <svg 
                  width="14" 
                  height="14" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="white" 
                  strokeWidth="2.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                  style={{
                    transform: showStyleDropdown ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s ease',
                  }}
                >
                  <polyline points="7 10 12 15 17 10"></polyline>
                </svg>
              </div>
              
              {/* Style dropdown (opens upward) */}
              {showStyleDropdown && (
                <div 
                  ref={styleDropdownRef}
                  style={{
                    position: 'fixed',
                    bottom: '48px',
                    left: '0',
                    backgroundColor: settings?.theme === 'dark' ? '#1A1A1A' : '#ffffff',
                    border: `1px solid ${settings?.theme === 'dark' ? '#333' : '#ddd'}`,
                    borderRadius: '6px',
                    marginBottom: '8px',
                    zIndex: 10000,
                    maxHeight: '240px',
                    overflowY: 'auto',
                    boxShadow: settings?.theme === 'dark' ? '0 -4px 8px rgba(0,0,0,0.3)' : '0 -4px 8px rgba(0,0,0,0.1)',
                    fontFamily: 'Söhne, sans-serif',
                    minWidth: '180px',
                    backdropFilter: 'blur(8px)',
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="style-option-label" style={{
                    padding: '6px 10px',
                    fontSize: '11px',
                    color: settings?.theme === 'dark' ? 'rgba(180, 180, 180, 0.7)' : 'rgba(100, 100, 100, 0.7)',
                    borderBottom: `1px solid ${settings?.theme === 'dark' ? '#333' : '#ddd'}`,
                    fontStyle: 'italic',
                  }}>
                    How should AI write responses?
                  </div>
                  {['normal', 'concise', 'explanatory', 'formal'].map((style) => (
                    <div 
                      key={style}
                      onClick={() => {
                        setResponseStyle(style);
                        setShowStyleDropdown(false);
                        
                        // Provide feedback to user about style change
                        if (style !== 'normal') {
                          const description = styleDescriptions[style as keyof typeof styleDescriptions];
                          console.log(`Response style set to ${style}: ${description}`);
                        }
                      }}
                      style={{
                        padding: '8px 12px',
                        cursor: 'pointer',
                        backgroundColor: style === responseStyle
                          ? (settings?.theme === 'dark' ? '#333' : '#e0e0e0') 
                          : 'transparent',
                        transition: 'all 0.1s ease',
                        fontSize: '13px',
                        fontWeight: style === responseStyle ? '500' : 'normal',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.backgroundColor = settings?.theme === 'dark' ? '#333' : '#e0e0e0';
                      }}
                      onMouseOut={(e) => {
                        if (style !== responseStyle) {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }
                      }}
                    >
                      <span>{style.charAt(0).toUpperCase() + style.slice(1)}</span>
                      
                      {style !== 'normal' && (
                        <span style={{ 
                          fontSize: '10px',
                          padding: '2px 5px',
                          borderRadius: '4px',
                          background: settings?.theme === 'dark' ? 'rgba(80, 80, 80, 0.2)' : 'rgba(200, 200, 200, 0.3)',
                          color: settings?.theme === 'dark' ? '#d0d0d0' : '#505050',
                        }}>
                          {style === 'concise' ? 'Brief' : style === 'explanatory' ? 'Detailed' : 'Professional'}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Disclaimer text on the right */}
            <div style={{
              fontSize: '11px',
              color: settings?.theme === 'dark' ? 'rgba(180, 180, 180, 0.5)' : 'rgba(120, 120, 120, 0.5)',
              display: 'flex',
              alignItems: 'center',
              height: '32px',
              fontStyle: 'italic',
              padding: '0 5px',
            }}>
              AI responses may be inaccurate
            </div>
          </div>
        </div>
      </div>
      
      <style>
        {`
          .no-focus-visible:focus {
            outline: none !important;
            box-shadow: none !important;
          }
          
          .no-focus-visible:focus-visible {
            outline: none !important;
            box-shadow: none !important;
          }
          
          textarea::selection {
            background-color: ${settings?.theme === 'dark' ? 'rgba(100, 100, 100, 0.4)' : 'rgba(200, 200, 200, 0.4)'};
          }
          
          /* For Firefox */
          textarea::-moz-selection {
            background-color: ${settings?.theme === 'dark' ? 'rgba(100, 100, 100, 0.4)' : 'rgba(200, 200, 200, 0.4)'};
          }
          
          /* iOS specific fixes */
          @supports (-webkit-touch-callout: none) {
            textarea {
              font-size: 16px !important; /* Prevents zoom on focus */
              -webkit-appearance: none; /* Removes iOS styling */
              border-radius: 0; /* Fix for iOS border issues */
            }
            
            .command-input-container {
              padding-bottom: env(safe-area-inset-bottom, 0.75rem) !important;
              z-index: 1001;
            }
          }
        `}
      </style>
    </div>
  );
};

export default CommandInput;