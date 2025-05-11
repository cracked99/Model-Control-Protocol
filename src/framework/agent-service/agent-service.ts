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
      
      // Determine which rule sets to load based on triggers
      const ruleEngine = await import('../rule-engine/rule-engine');
      const ruleSetsToLoad = ruleEngine.determineRuleSetsToLoad(request);
      
      // Load each rule set
      for (const ruleSetId of ruleSetsToLoad) {
        await import('../core/init-system').then(initSystem => 
          initSystem.loadRuleSet(env, ruleSetId)
        );
      }
      
      // Get context for request
      const context = await contextManager.getContext(env, request);
      
      // Store env in context for later use
      (context as any).env = env;
      
      // Process request with rules and context
      const processedRequest = await ruleEngine.applyRules(env, request, context);
      
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
    console.log(`Analyzing request: ${request.id}`);
    
    // Initialize triggers array
    const triggers: string[] = [];
    const content = request.command.toLowerCase();
    
    // Use more sophisticated pattern matching for request analysis
    
    // Code-related triggers
    const codePatterns = [
      /\b(code|function|class|method|implement|develop|program)\b/i,
      /\b(javascript|typescript|python|java|c\+\+|ruby|go|rust)\b/i,
      /\b(algorithm|data structure|api|library)\b/i,
      /\b(bug|error|exception|fix|debug)\b/i
    ];
    
    if (codePatterns.some(pattern => pattern.test(content))) {
      triggers.push('code_implementation');
      
      // Check for specific code quality concerns
      if (/\b(security|vulnerability|auth|encrypt|protect)\b/i.test(content)) {
        triggers.push('code_security');
      }
      
      if (/\b(performance|optimize|speed|efficient|slow)\b/i.test(content)) {
        triggers.push('code_performance');
      }
      
      if (/\b(test|unit test|integration test|mock|stub|assert)\b/i.test(content)) {
        triggers.push('code_testing');
      }
    }
    
    // Architecture-related triggers
    const architecturePatterns = [
      /\b(architecture|design|structure|pattern|system)\b/i,
      /\b(microservice|monolith|serverless|distributed)\b/i,
      /\b(database|storage|cache|queue)\b/i,
      /\b(scaling|deployment|infrastructure)\b/i
    ];
    
    if (architecturePatterns.some(pattern => pattern.test(content))) {
      triggers.push('system_design');
      
      // Check for specific architecture concerns
      if (/\b(scalability|load|traffic|concurrent|parallel)\b/i.test(content)) {
        triggers.push('architecture_scalability');
      }
      
      if (/\b(security|auth|permission|role|access)\b/i.test(content)) {
        triggers.push('architecture_security');
      }
    }
    
    // Check for feedback-related content
    if (/\b(feedback|improve|better|suggestion|review)\b/i.test(content)) {
      triggers.push('feedback_integration');
    }
    
    // Check for context-related content
    if (/\b(context|remember|previous|earlier|before)\b/i.test(content)) {
      triggers.push('context_retention');
    }
    
    // Log the identified triggers
    console.log(`Identified triggers: ${triggers.join(', ')}`);
    
    return triggers;
  }
  
  async generateResponse(request: AgentRequest, context: any): Promise<AgentResponse> {
    console.log(`Generating response for request: ${request.id}`);
    
    // Get active rules and apply them to the request
    let processedRequest = { ...request };
    let responseContent = '';
    
    try {
      // Import rule engine
      const ruleEngine = await import('../rule-engine/rule-engine');
      
      // Apply rules to the request
      const env = (context as any).env;
      processedRequest = await ruleEngine.applyRules(env, processedRequest, context);
      
      // Generate base response based on the request type
      if (processedRequest.command.toLowerCase().includes('help')) {
        responseContent = this.generateHelpResponse();
      } else if (processedRequest.command.toLowerCase().includes('status')) {
        responseContent = await this.generateStatusResponse();
      } else {
        // Default response handling
        responseContent = this.generateDefaultResponse(processedRequest, context);
      }
      
      // Create response object
      const response: AgentResponse = {
        id: uuidv4(),
        requestId: request.id,
        content: responseContent,
        metadata: {
          generatedAt: new Date().toISOString(),
          contextId: context.id,
          appliedRules: context.appliedRules || []
        }
      };
      
      // Apply post-processing rules
      const finalResponse = await this.applyPostProcessingRules(response, context);
      
      return finalResponse;
    } catch (error) {
      console.error(`Error generating response: ${error instanceof Error ? error.message : String(error)}`);
      
      // Return error response
      return {
        id: uuidv4(),
        requestId: request.id,
        content: `I encountered an error while processing your request. ${error instanceof Error ? error.message : 'Please try again.'}`,
        metadata: {
          error: true,
          errorType: error instanceof Error ? error.name : 'Unknown',
          generatedAt: new Date().toISOString()
        }
      };
    }
  }
  
  /**
   * Generate help response
   */
  private generateHelpResponse(): string {
    return `
# Agentic Framework Help

I'm an AI assistant powered by the Agentic Framework. Here are some things I can help you with:

## Commands
- **/framework status** - Check the framework status
- **/framework help** - Show this help message
- **/framework load <rule-set>** - Load a specific rule set
- **/framework unload <rule-set>** - Unload a specific rule set
- **/framework list** - List available rule sets

## Capabilities
- **Code Development** - I can help write, review, and improve code
- **System Design** - I can assist with architecture and design decisions
- **Problem Solving** - I can help solve technical problems
- **Explanations** - I can explain technical concepts

Let me know how I can assist you!
`;
  }
  
  /**
   * Generate status response
   */
  private async generateStatusResponse(): Promise<string> {
    try {
      // Get framework status
      const initSystem = await import('../core/init-system');
      const isEnabled = initSystem.isFrameworkEnabled();
      
      // Get rule engine status
      const ruleEngine = await import('../rule-engine/rule-engine');
      const activeRules = await ruleEngine.getActiveRules();
      
      // Get agent metrics
      const metrics = this.metrics.getMetrics();
      
      return `
# Agentic Framework Status

## Core Status
- Framework: ${isEnabled ? '✅ Active' : '❌ Inactive'}
- Active Rules: ${activeRules.length}
- Rule Types: ${new Set(activeRules.map(r => r.type)).size}

## Agent Metrics
- Total Requests: ${metrics.totalTasks}
- Completed: ${metrics.completedTasks}
- Failed: ${metrics.failedTasks}
- Avg Response Time: ${Math.round(metrics.avgDuration)}ms

## Task Queue
- Current Queue Size: ${this.taskQueue.length}
`;
    } catch (error) {
      console.error(`Error generating status response: ${error}`);
      return 'Error retrieving framework status.';
    }
  }
  
  /**
   * Generate default response
   */
  private generateDefaultResponse(request: AgentRequest, context: any): string {
    // Extract key information from the request
    const command = request.command.trim();
    
    // Check for code-related requests
    if (context.triggers?.includes('code_implementation')) {
      return this.handleCodeRequest(command, context);
    }
    
    // Check for architecture-related requests
    if (context.triggers?.includes('system_design')) {
      return this.handleArchitectureRequest(command, context);
    }
    
    // Generic response for other types of requests
    return `I've processed your request: "${command}"\n\nPlease let me know if you need any specific assistance with code development, system design, or other technical tasks.`;
  }
  
  /**
   * Handle code-related requests
   */
  private handleCodeRequest(command: string, context: any): string {
    // This would be expanded with more sophisticated code generation
    return `I'll help you with your code request. To provide the best assistance, could you provide more details about:
    
1. What programming language are you using?
2. What specific functionality are you trying to implement?
3. Are there any specific requirements or constraints?`;
  }
  
  /**
   * Handle architecture-related requests
   */
  private handleArchitectureRequest(command: string, context: any): string {
    // This would be expanded with more sophisticated architecture guidance
    return `I'll help you with your system design request. To provide the best architectural guidance, could you share:
    
1. What type of system are you designing?
2. What are your key requirements (scalability, performance, security)?
3. What technologies are you considering?`;
  }
  
  /**
   * Apply post-processing rules to the response
   */
  private async applyPostProcessingRules(response: AgentResponse, context: any): Promise<AgentResponse> {
    // This would apply rules that modify the response format, tone, etc.
    return response;
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