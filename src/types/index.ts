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
  isStarred?: boolean;
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
}

// Token Usage
export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCost: number;
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

// Extend Window interface
declare global {
  interface Window {
    electron: ElectronAPI;
  }
} 