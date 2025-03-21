// AI Provider Types
export type AIProvider = 'ollama' | 'openai' | 'deepseek';

export interface AIProviderConfig {
  provider: AIProvider;
  apiKey?: string;
  baseUrl?: string;
  models: string[];
  defaultModel: string;
}

// Message Types
export type MessageRole = 'system' | 'user' | 'assistant';

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
  systemPrompt: string;
  model: string;
  provider: AIProvider;
}

// User Settings
export type UserRole = 'developer' | 'casual' | 'code-helper';

export interface AppSettings {
  theme: 'dark' | 'light';
  fontSize: number;
  userRole: UserRole;
  temperature: number;
  customSystemPrompts: Record<UserRole, string>;
  providers: Record<AIProvider, AIProviderConfig>;
  activeProvider: AIProvider;
  showLineNumbers?: boolean;
  showTimestamps?: boolean;
  autoScroll?: boolean;
  codeHighlighting?: boolean;
  showSystemMessages?: boolean;
  showAnalysis?: boolean; // Controls whether to show AI's analysis/thinking
  codeFontSize?: number; // Font size for code blocks
  lineHeight?: number; // Line height for regular text
  codeLineHeight?: number; // Line height for code blocks
  showTokenCount?: boolean;
  showThinking?: boolean;
}

// Token Usage
export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCost: number;
  tokensPerSecond?: number;
  _responseStartTime?: number; // Internal: timestamp when response started
  _lastTokenCount?: number;    // Internal: previous token count
}

// Electron Window API
export interface ElectronAPI {
  windowControls: {
    minimize: () => void;
    close: () => void;
  };
  store: {
    get: (key: string) => Promise<any>;
    set: (key: string, value: any) => Promise<boolean>;
    delete: (key: string) => Promise<boolean>;
  };
}

// Stream Response for AI calls
export interface StreamResponse {
  content: string;
  done: boolean;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export type TimestampFormat = 'absolute' | 'relative' | 'none';

export interface Settings {
  theme?: 'light' | 'dark' | 'system';
  activeProvider?: AIProvider;
  providers?: {
    [key: string]: AIProviderConfig;
  };
  defaultSystemPrompt?: string;
  customSystemPrompts?: {
    [role in UserRole]?: string;
  };
  tokenCount?: boolean;
  timestampFormat?: TimestampFormat;
  messageCount?: number;
  showTokenCount?: boolean;
  showThinking?: boolean; // Whether to show thinking indicator
  codeAutorun?: boolean; // Whether to auto-run executable code blocks
  temperature?: number;
} 