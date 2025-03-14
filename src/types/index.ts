// AI Provider Types
export type AIProvider = 'openai' | 'ollama' | 'deepseek';

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
  theme: 'dark' | 'green' | 'amber';
  fontSize: number;
  userRole: UserRole;
  temperature: number;
  customSystemPrompts: Record<UserRole, string>;
  providers: Record<AIProvider, AIProviderConfig>;
  activeProvider: AIProvider;
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
    maximize: () => void;
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