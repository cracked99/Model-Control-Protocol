/**
 * Core types for the Agentic Framework
 */

// Rule types
export type RuleType = 'core' | 'enhancement' | 'on-demand' | 'special';

export interface RuleContext {
  requestId: string;
  sessionId: string;
  request?: AgentRequest;
  response?: AgentResponse;
  data: Record<string, any>;
}

export interface RuleResult {
  success: boolean;
  modified: boolean;
  message: string;
  data?: Record<string, any>;
}

export interface Rule {
  id: string;
  name: string;
  description?: string;
  type?: RuleType;
  priority: number;
  content?: string;
  metadata?: {
    version: string;
    lastUpdated: string;
    dependencies: string[];
    triggers: string[];
  };
  execute: (context: RuleContext) => Promise<RuleResult>;
}

// Context types
export interface Context {
  id: string;
  sessionId: string;
  created: string;
  lastUpdated: string;
  data: Record<string, any>;
  metadata: {
    compressionLevel: number;
    originalSize: number;
    compressedSize: number;
  };
}

// Metrics types
export interface Metrics {
  timestamp: number;
  category: string;
  data: Record<string, any>;
  tags: string[];
}

// Request/Response types
export interface AgentRequest {
  id: string;
  sessionId: string;
  content: string;
  metadata?: Record<string, any>;
}

export interface AgentResponse {
  id: string;
  requestId: string;
  content: string;
  metadata?: Record<string, any>;
}

// Framework status
export interface FrameworkStatus {
  isEnabled: boolean;
  loadedRules: {
    name: string;
    type: RuleType;
    status: 'active' | 'inactive';
  }[];
  metrics?: {
    ruleCalls: number;
    responseTimes: {
      avg: number;
      min: number;
      max: number;
    };
    memoryUsage: string;
  };
}

// Command response
export interface CommandResponse {
  status: 'success' | 'error';
  message: string;
  data?: any;
}

// Environment configuration
export interface FrameworkConfig {
  settings: {
    initialization: {
      enabled: boolean;
    };
    framework: {
      enableMetrics: boolean;
    };
  };
} 