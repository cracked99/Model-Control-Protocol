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
  type: string;
  priority: number;
  description?: string;
  condition: (request: AgentRequest, context: any) => boolean;
  action: (request: AgentRequest, context: any) => Promise<any>;
}

// Context types
export interface Context {
  sessionId: string;
  userId: string;
  data: Record<string, any>;
  metadata: Record<string, any>;
  created: number;
  updated: number;
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
  command?: string;
  metadata?: {
    [key: string]: any;
  };
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
  message?: string;
  data?: any;
}

// Environment configuration
export interface FrameworkConfig {
  enabled: boolean;
  version: string;
  monitoring: {
    enabled: boolean;
    interval: number;
  };
  rules: {
    core: string[];
    enhancement: string[];
    onDemand: string[];
  };
  feedback: {
    enabled: boolean;
    storageLimit: number;
  };
}

// Rule Set
export interface RuleSet {
  id: string;
  name: string;
  type: 'core' | 'enhancement' | 'on-demand';
  status: 'active' | 'inactive';
  ruleCount: number;
}

// Feedback
export interface Feedback {
  sessionId: string;
  requestId: string;
  score: number;
  comment: string;
  timestamp: number;
} 