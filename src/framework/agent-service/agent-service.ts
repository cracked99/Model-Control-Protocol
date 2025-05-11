/**
 * Agent Service Implementation
 */

import { v4 as uuidv4 } from 'uuid';
import * as contextManager from './context-manager';
import { AgentRequest, AgentResponse } from '../types';

/**
 * Agent Service handles processing requests through the rule engine
 */
class AgentService {
  private taskQueue: Array<{ id: string; timestamp: number }> = [];
  private metrics: MetricsCollector;
  
  constructor() {
    this.metrics = new MetricsCollector('agent_service');
  }
  
  async initialize(env: any): Promise<{ status: string }> {
    console.log('Initializing Agent Service...');
    
    // Initialize context manager
    await contextManager.initialize(env);
    
    return { status: 'success' };
  }
  
  async processRequest(env: any, request: AgentRequest): Promise<AgentResponse> {
    // Start metrics collection
    const taskId = uuidv4();
    this.metrics.startTask(taskId);
    
    try {
      // Add to task queue
      this.taskQueue.push({ id: taskId, timestamp: Date.now() });
      
      // Analyze request to determine triggers
      const triggers = this.analyzeRequest(request);
      
      // Load relevant rules
      const ruleEngine = await import('../rule-engine/rule-engine');
      await ruleEngine.loadOnDemandRules(env, triggers);
      
      // Get context for request
      const context = await contextManager.getContext(env, request);
      
      // Process request with rules and context
      const processedRequest = await ruleEngine.applyRules(request, context);
      
      // Generate response
      const response = await this.generateResponse(processedRequest, context);
      
      // Update context with new information
      await contextManager.updateContext(env, request, response);
      
      // Remove from task queue
      this.taskQueue = this.taskQueue.filter(task => task.id !== taskId);
      
      // Complete metrics collection
      this.metrics.completeTask(taskId);
      
      return response;
    } catch (error) {
      // Record error in metrics
      this.metrics.recordError(taskId, error);
      
      // Remove from task queue
      this.taskQueue = this.taskQueue.filter(task => task.id !== taskId);
      
      // Return error response
      return {
        id: uuidv4(),
        requestId: request.id,
        content: `Error processing request: ${error instanceof Error ? error.message : String(error)}`,
        metadata: {
          error: true,
          errorType: error instanceof Error ? error.name : 'Unknown',
        },
      };
    }
  }
  
  analyzeRequest(request: AgentRequest): string[] {
    // In a real implementation, this would analyze the request content
    // to determine which rule triggers apply
    
    const triggers: string[] = [];
    
    // Check for code-related content
    if (request.content.includes('code') || 
        request.content.includes('function') || 
        request.content.includes('class')) {
      triggers.push('code_implementation');
    }
    
    // Check for architecture-related content
    if (request.content.includes('architecture') || 
        request.content.includes('design') || 
        request.content.includes('structure')) {
      triggers.push('system_design');
    }
    
    return triggers;
  }
  
  async generateResponse(request: AgentRequest, context: any): Promise<AgentResponse> {
    // In a real implementation, this would generate a response
    // based on the processed request and context
    
    return {
      id: uuidv4(),
      requestId: request.id,
      content: `Response to: ${request.content}`,
      metadata: {
        generatedAt: new Date().toISOString(),
        contextId: context.id,
      },
    };
  }
  
  getTaskQueueStatus(): { count: number; oldestTask: number | null } {
    if (this.taskQueue.length === 0) {
      return { count: 0, oldestTask: null };
    }
    
    const now = Date.now();
    const oldestTask = Math.min(...this.taskQueue.map(task => now - task.timestamp));
    
    return {
      count: this.taskQueue.length,
      oldestTask,
    };
  }
}

/**
 * Metrics collector for the agent service
 */
class MetricsCollector {
  private serviceName: string;
  private tasks: Map<string, { startTime: number; endTime?: number; error?: any }> = new Map();
  
  constructor(serviceName: string) {
    this.serviceName = serviceName;
  }
  
  startTask(taskId: string): void {
    this.tasks.set(taskId, { startTime: Date.now() });
  }
  
  completeTask(taskId: string): void {
    const task = this.tasks.get(taskId);
    if (task) {
      task.endTime = Date.now();
    }
  }
  
  recordError(taskId: string, error: any): void {
    const task = this.tasks.get(taskId);
    if (task) {
      task.endTime = Date.now();
      task.error = error;
    }
  }
  
  getMetrics(): { 
    totalTasks: number; 
    completedTasks: number; 
    failedTasks: number; 
    avgDuration: number;
  } {
    let completedCount = 0;
    let failedCount = 0;
    let totalDuration = 0;
    
    this.tasks.forEach(task => {
      if (task.endTime) {
        if (task.error) {
          failedCount++;
        } else {
          completedCount++;
          totalDuration += task.endTime - task.startTime;
        }
      }
    });
    
    const avgDuration = completedCount > 0 ? totalDuration / completedCount : 0;
    
    return {
      totalTasks: this.tasks.size,
      completedTasks: completedCount,
      failedTasks: failedCount,
      avgDuration,
    };
  }
}

// Export singleton instance
const agentService = new AgentService();
export const initialize = agentService.initialize.bind(agentService);
export const processRequest = agentService.processRequest.bind(agentService);
export const getTaskQueueStatus = agentService.getTaskQueueStatus.bind(agentService); 