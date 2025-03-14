/**
 * Classified AI - Client-side Application
 * A terminal-style AI chat interface
 */

// Configuration
const CONFIG = {
  defaultTheme: 'dark',
  themes: {
    dark: {
      bgColor: '#1E1E1E',
      textColor: '#CCCCCC',
      accentColor: '#569CD6',
      userPrefixColor: '#4EC9B0',
      aiPrefixColor: '#CE9178',
      systemColor: '#D7BA7D',
      errorColor: '#F44747',
      inputBg: '#2D2D2D',
      codeBg: '#1E1E1E',
      borderColor: '#474747'
    },
    green: {
      bgColor: '#0D1117',
      textColor: '#4AF626',
      accentColor: '#56D364',
      userPrefixColor: '#39D353',
      aiPrefixColor: '#26A641',
      systemColor: '#FFFF00',
      errorColor: '#FF0000',
      inputBg: '#010409',
      codeBg: '#0D1117',
      borderColor: '#26A641'
    },
    amber: {
      bgColor: '#2D1B00',
      textColor: '#FFB000',
      accentColor: '#FFC133',
      userPrefixColor: '#FF9000',
      aiPrefixColor: '#FFB000',
      systemColor: '#FFFF00',
      errorColor: '#FF5555',
      inputBg: '#1F1200',
      codeBg: '#2A1A00',
      borderColor: '#915900'
    }
  },
  models: [
    { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', tokenRate: 0.000002 },
    { id: 'gpt-4', name: 'GPT-4', tokenRate: 0.00006 },
    { id: 'claude-3-opus', name: 'Claude 3 Opus', tokenRate: 0.00015 },
    { id: 'llama-3', name: 'Llama 3', tokenRate: 0 }
  ],
  maxConversations: 10,
  defaultSystemMessage: 'Welcome to Classified AI. How can I help you today?'
};

// Sample AI responses for demo
const SAMPLE_RESPONSES = [
  "I'm analyzing your request. Let me think about that...",
  "That's an interesting question. Here's what I found:\n\nAccording to best practices, you should consider the following approach...",
  "Here's a code example that might help:\n\n```javascript\nconst solution = (input) => {\n  return input.map(item => item * 2);\n};\n```\n\nThis function will process your data as requested.",
  "I don't have enough information to answer that completely. Could you provide more details about your specific use case?",
  "There are several ways to approach this problem:\n\n1. Use a recursive function\n2. Implement an iterative solution\n3. Leverage built-in methods\n\nThe best choice depends on your specific requirements and constraints."
];

// State management
const state = {
  currentTheme: localStorage.getItem('theme') || CONFIG.defaultTheme,
  conversations: JSON.parse(localStorage.getItem('conversations')) || [
    {
      id: 'default',
      title: 'New Conversation',
      messages: [
        { role: 'system', content: CONFIG.defaultSystemMessage }
      ],
      createdAt: Date.now()
    }
  ],
  currentConversationId: localStorage.getItem('currentConversationId') || 'default',
  currentModel: localStorage.getItem('currentModel') || CONFIG.models[0].id,
  tokenCount: 0,
  cost: 0
};

// DOM Elements
let elements = {};

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
  // Cache DOM elements
  cacheElements();
  
  // Initialize the application
  initializeApp();
  
  // Set up event listeners
  setupEventListeners();
});

// Cache DOM elements for better performance
function cacheElements() {
  elements = {
    textarea: document.querySelector('.input-textarea'),
    sendButton: document.querySelector('.send-button'),
    messagesContainer: document.querySelector('.messages-container'),
    clearButton: document.querySelector('.input-button:nth-child(2)'),
    themeButtons: document.querySelectorAll('.theme-button'),
    conversationItems: document.querySelectorAll('.conversation-item'),
    newChatButton: document.querySelector('.new-chat-button'),
    statusModel: document.querySelector('.status-model'),
    statusTokens: document.querySelector('.status-right div:first-child span:last-child'),
    statusCost: document.querySelector('.status-right div:last-child span:last-child'),
    statusDot: document.querySelector('.status-dot'),
    statusText: document.querySelector('.status-indicator span')
  };
}

// Initialize the application
function initializeApp() {
  // Apply saved theme
  applyTheme(state.currentTheme);
  
  // Load conversations
  renderConversations();
  
  // Set current model in status bar
  updateModelDisplay();
  
  // Focus the textarea
  elements.textarea.focus();
}

// Set up event listeners
function setupEventListeners() {
  // Auto-resize textarea
  elements.textarea.addEventListener('input', autoResizeTextarea);
  
  // Send message on Enter (not Shift+Enter)
  elements.textarea.addEventListener('keydown', handleEnterKey);
  
  // Send button click
  elements.sendButton.addEventListener('click', sendMessage);
  
  // Clear button
  elements.clearButton.addEventListener('click', clearChat);
  
  // Theme switching
  elements.themeButtons.forEach(button => {
    button.addEventListener('click', handleThemeSwitch);
  });
  
  // New chat
  elements.newChatButton.addEventListener('click', createNewChat);
  
  // Window beforeunload - save state
  window.addEventListener('beforeunload', saveState);
}

// Auto-resize textarea
function autoResizeTextarea() {
  this.style.height = 'auto';
  this.style.height = this.scrollHeight + 'px';
}

// Handle Enter key in textarea
function handleEnterKey(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
}

// Send a message
function sendMessage() {
  const message = elements.textarea.value.trim();
  if (!message) return;
  
  // Add user message
  addMessage(message, 'user');
  
  // Save to state
  const conversation = getCurrentConversation();
  conversation.messages.push({ role: 'user', content: message });
  saveConversations();
  
  // Clear input
  elements.textarea.value = '';
  elements.textarea.style.height = 'auto';
  
  // Update connection status
  updateConnectionStatus('connected');
  
  // Simulate AI thinking
  setTimeout(() => {
    // Show typing indicator
    const typingIndicator = document.createElement('div');
    typingIndicator.className = 'message message-ai';
    typingIndicator.innerHTML = '<span class="message-prefix">AI> </span><span class="message-content">Thinking...</span>';
    typingIndicator.id = 'typing-indicator';
    elements.messagesContainer.appendChild(typingIndicator);
    elements.messagesContainer.scrollTop = elements.messagesContainer.scrollHeight;
    
    // Simulate AI response after a delay
    setTimeout(() => {
      // Remove typing indicator
      document.getElementById('typing-indicator').remove();
      
      // Add AI response
      const randomResponse = SAMPLE_RESPONSES[Math.floor(Math.random() * SAMPLE_RESPONSES.length)];
      addMessage(randomResponse, 'ai');
      
      // Save to state
      conversation.messages.push({ role: 'assistant', content: randomResponse });
      saveConversations();
      
      // Update token count and cost
      updateTokenUsage(message, randomResponse);
      
      // Update conversation preview
      updateConversationPreview(state.currentConversationId, randomResponse);
    }, 1500);
  }, 500);
}

// Add a message to the UI
function addMessage(content, role) {
  const messageDiv = document.createElement('div');
  messageDiv.className = `message message-${role}`;
  
  let prefix = '';
  if (role === 'user') prefix = 'USER> ';
  else if (role === 'ai' || role === 'assistant') prefix = 'AI> ';
  else if (role === 'system') prefix = 'SYSTEM> ';
  
  // Process content for code blocks
  const processedContent = processCodeBlocks(content);
  
  messageDiv.innerHTML = `<span class="message-prefix">${prefix}</span><span class="message-content">${processedContent}</span>`;
  elements.messagesContainer.appendChild(messageDiv);
  
  // Scroll to bottom
  elements.messagesContainer.scrollTop = elements.messagesContainer.scrollHeight;
}

// Process code blocks in message content
function processCodeBlocks(content) {
  // Simple processing for code blocks marked with ```
  return content.replace(/```([\s\S]*?)```/g, '<div class="code-block">$1</div>');
}

// Clear the current chat
function clearChat() {
  // Keep only the system message
  const messages = elements.messagesContainer.querySelectorAll('.message');
  
  messages.forEach(message => {
    if (!message.classList.contains('message-system')) {
      message.remove();
    }
  });
  
  // Add cleared message
  addMessage('Chat cleared.', 'system');
  
  // Update state
  const conversation = getCurrentConversation();
  conversation.messages = [
    { role: 'system', content: CONFIG.defaultSystemMessage },
    { role: 'system', content: 'Chat cleared.' }
  ];
  saveConversations();
  
  // Reset token count and cost
  state.tokenCount = 0;
  state.cost = 0;
  updateStatusDisplay();
}

// Handle theme switching
function handleThemeSwitch(e) {
  const theme = e.target.classList.contains('theme-dark') ? 'dark' : 
               e.target.classList.contains('theme-green') ? 'green' : 'amber';
  
  applyTheme(theme);
  
  // Save theme preference
  state.currentTheme = theme;
  localStorage.setItem('theme', theme);
}

// Apply a theme
function applyTheme(theme) {
  const themeConfig = CONFIG.themes[theme];
  
  Object.keys(themeConfig).forEach(key => {
    document.documentElement.style.setProperty(`--${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`, themeConfig[key]);
  });
}

// Create a new chat
function createNewChat() {
  // Create new conversation
  const id = 'conv_' + Date.now();
  const newConversation = {
    id,
    title: `New Conversation ${id.slice(-4)}`,
    messages: [
      { role: 'system', content: CONFIG.defaultSystemMessage }
    ],
    createdAt: Date.now()
  };
  
  // Add to state
  state.conversations.unshift(newConversation);
  state.currentConversationId = id;
  
  // Limit number of conversations
  if (state.conversations.length > CONFIG.maxConversations) {
    state.conversations = state.conversations.slice(0, CONFIG.maxConversations);
  }
  
  // Save conversations
  saveConversations();
  
  // Render conversations
  renderConversations();
  
  // Reset token count and cost
  state.tokenCount = 0;
  state.cost = 0;
  updateStatusDisplay();
  
  // Clear messages container
  elements.messagesContainer.innerHTML = '';
  
  // Add welcome message
  addMessage(CONFIG.defaultSystemMessage, 'system');
}

// Render conversations in the sidebar
function renderConversations() {
  // Get conversation list container
  const conversationList = document.querySelector('.conversation-list');
  
  // Clear existing items
  conversationList.innerHTML = '';
  
  // Add conversation items
  state.conversations.forEach(conversation => {
    const item = document.createElement('div');
    item.className = 'conversation-item';
    if (conversation.id === state.currentConversationId) {
      item.classList.add('active');
    }
    
    // Get preview from last message
    const lastMessage = conversation.messages.filter(m => m.role === 'assistant' || m.role === 'user').pop();
    const preview = lastMessage ? lastMessage.content.substring(0, 30) + (lastMessage.content.length > 30 ? '...' : '') : 'Start a new chat...';
    
    item.innerHTML = `
      <div class="conversation-title">${conversation.title}</div>
      <div class="conversation-preview">${preview}</div>
    `;
    
    // Add click event
    item.addEventListener('click', () => switchConversation(conversation.id));
    
    // Add to list
    conversationList.appendChild(item);
  });
}

// Switch to a different conversation
function switchConversation(conversationId) {
  // Set current conversation
  state.currentConversationId = conversationId;
  localStorage.setItem('currentConversationId', conversationId);
  
  // Update active state in sidebar
  document.querySelectorAll('.conversation-item').forEach(item => {
    item.classList.remove('active');
    if (item.querySelector('.conversation-title').textContent === getCurrentConversation().title) {
      item.classList.add('active');
    }
  });
  
  // Clear messages container
  elements.messagesContainer.innerHTML = '';
  
  // Load messages for this conversation
  const conversation = getCurrentConversation();
  conversation.messages.forEach(message => {
    addMessage(message.content, message.role);
  });
  
  // Reset token count and cost for this conversation
  // In a real app, we would load the actual values from the conversation
  state.tokenCount = 0;
  state.cost = 0;
  updateStatusDisplay();
}

// Update conversation preview
function updateConversationPreview(conversationId, content) {
  const preview = content.substring(0, 30) + (content.length > 30 ? '...' : '');
  
  document.querySelectorAll('.conversation-item').forEach(item => {
    if (item.classList.contains('active')) {
      item.querySelector('.conversation-preview').textContent = preview;
    }
  });
}

// Get the current conversation
function getCurrentConversation() {
  return state.conversations.find(c => c.id === state.currentConversationId) || state.conversations[0];
}

// Save conversations to localStorage
function saveConversations() {
  localStorage.setItem('conversations', JSON.stringify(state.conversations));
}

// Save application state
function saveState() {
  localStorage.setItem('theme', state.currentTheme);
  localStorage.setItem('currentConversationId', state.currentConversationId);
  localStorage.setItem('currentModel', state.currentModel);
  saveConversations();
}

// Update token usage and cost
function updateTokenUsage(userMessage, aiResponse) {
  // Very rough token estimation (in a real app, we would use a proper tokenizer)
  const userTokens = Math.ceil(userMessage.length / 4);
  const aiTokens = Math.ceil(aiResponse.length / 4);
  
  // Update token count
  state.tokenCount += userTokens + aiTokens;
  
  // Update cost based on current model
  const model = CONFIG.models.find(m => m.id === state.currentModel);
  state.cost += (userTokens + aiTokens) * model.tokenRate;
  
  // Update display
  updateStatusDisplay();
}

// Update status display
function updateStatusDisplay() {
  elements.statusTokens.textContent = state.tokenCount.toLocaleString();
  elements.statusCost.textContent = `$${state.cost.toFixed(6)}`;
}

// Update model display
function updateModelDisplay() {
  const model = CONFIG.models.find(m => m.id === state.currentModel);
  elements.statusModel.textContent = model ? model.id : 'unknown';
}

// Update connection status
function updateConnectionStatus(status) {
  elements.statusDot.className = 'status-dot';
  
  if (status === 'connected') {
    elements.statusDot.classList.add('status-connected');
    elements.statusText.textContent = 'connected';
  } else if (status === 'disconnected') {
    elements.statusDot.classList.add('status-disconnected');
    elements.statusText.textContent = 'disconnected';
  } else if (status === 'error') {
    elements.statusDot.classList.add('status-error');
    elements.statusText.textContent = 'error';
  }
} 