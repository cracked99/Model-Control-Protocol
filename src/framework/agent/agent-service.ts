/**
 * Agent Service Implementation
 */

import { AgentRequest, AgentResponse, Feedback } from '../types';

/**
 * Process a request through the agent
 */
export async function processRequest(env: any, request: AgentRequest): Promise<AgentResponse> {
  try {
    console.log(`Processing request: ${request.id}`);
    
    // Get context for the session
    const context = await getContext(env, request.sessionId);
    
    // Record request in context
    context.data.requests = context.data.requests || [];
    context.data.requests.push({
      id: request.id,
      command: request.command,
      timestamp: Date.now(),
      metadata: request.metadata,
    });
    
    // Update context
    await updateContext(env, context);
    
    // Process request
    const response: AgentResponse = {
      id: `resp_${Date.now()}`,
      requestId: request.id,
      content: `Processed command: ${request.command}`,
    };
    
    // Record response in context
    context.data.responses = context.data.responses || [];
    context.data.responses.push({
      id: response.id,
      requestId: request.id,
      content: response.content,
      timestamp: Date.now(),
    });
    
    // Update context
    await updateContext(env, context);
    
    // Record metrics
    await recordMetrics(env, request, response);
    
    return response;
  } catch (error) {
    console.error('Error processing request:', error);
    
    return {
      id: `error_${Date.now()}`,
      requestId: request.id,
      content: `Error processing request: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Get context for a session
 */
export async function getContext(env: any, sessionId: string): Promise<any> {
  try {
    // Try to get existing context
    const contextStr = await env.FRAMEWORK_KV?.get(`context:${sessionId}`);
    
    if (contextStr) {
      return JSON.parse(contextStr);
    }
    
    // Create new context
    const context = {
      sessionId,
      userId: 'anonymous',
      data: {},
      metadata: {},
      created: Date.now(),
      updated: Date.now(),
    };
    
    // Save new context
    await updateContext(env, context);
    
    return context;
  } catch (error) {
    console.error('Error getting context:', error);
    throw error;
  }
}

/**
 * Update context
 */
async function updateContext(env: any, context: any): Promise<void> {
  try {
    // Update timestamp
    context.updated = Date.now();
    
    // Save context
    await env.FRAMEWORK_KV?.put(`context:${context.sessionId}`, JSON.stringify(context));
  } catch (error) {
    console.error('Error updating context:', error);
    throw error;
  }
}

/**
 * Store feedback for a session
 */
export async function storeFeedback(env: any, feedback: Feedback): Promise<void> {
  try {
    // Get context for the session
    const context = await getContext(env, feedback.sessionId);
    
    // Add feedback to context
    context.data.feedback = context.data.feedback || [];
    context.data.feedback.push(feedback);
    
    // Update context
    await updateContext(env, context);
    
    // Store in feedback collection
    const feedbackKey = 'feedback';
    const feedbackStr = await env.FRAMEWORK_KV?.get(feedbackKey);
    const allFeedback = feedbackStr ? JSON.parse(feedbackStr) : [];
    
    // Add new feedback
    allFeedback.push(feedback);
    
    // Keep only the last 100 feedback items
    if (allFeedback.length > 100) {
      allFeedback.shift();
    }
    
    // Save feedback
    await env.FRAMEWORK_KV?.put(feedbackKey, JSON.stringify(allFeedback));
  } catch (error) {
    console.error('Error storing feedback:', error);
    throw error;
  }
}

/**
 * Get feedback for a session
 */
export async function getFeedback(env: any, sessionId: string): Promise<Feedback[]> {
  try {
    // Get context for the session
    const context = await getContext(env, sessionId);
    
    // Return feedback from context
    return context.data.feedback || [];
  } catch (error) {
    console.error('Error getting feedback:', error);
    return [];
  }
}

/**
 * Get all feedback
 */
export async function getAllFeedback(env: any): Promise<Feedback[]> {
  try {
    // Get all feedback from KV
    const feedbackKey = 'feedback';
    const feedbackStr = await env.FRAMEWORK_KV?.get(feedbackKey);
    
    if (!feedbackStr) {
      return [];
    }
    
    return JSON.parse(feedbackStr);
  } catch (error) {
    console.error('Error getting all feedback:', error);
    return [];
  }
}

/**
 * Record metrics
 */
async function recordMetrics(env: any, request: AgentRequest, response: AgentResponse): Promise<void> {
  try {
    // Create metrics collector if not exists
    if (!MetricsCollector.instance) {
      MetricsCollector.instance = new MetricsCollector();
    }
    
    // Record metrics
    await MetricsCollector.instance.recordRequestMetrics(env, request, response);
  } catch (error) {
    console.error('Error recording metrics:', error);
  }
}

/**
 * Metrics Collector
 */
class MetricsCollector {
  static instance: MetricsCollector;
  
  private requestCount: number = 0;
  private responseTimes: number[] = [];
  
  async recordRequestMetrics(env: any, request: AgentRequest, response: AgentResponse): Promise<void> {
    try {
      // Increment request count
      this.requestCount++;
      
      // Calculate response time (mock for now)
      const responseTime = Math.random() * 100 + 50; // 50-150ms
      this.responseTimes.push(responseTime);
      
      // Keep only the last 100 response times
      if (this.responseTimes.length > 100) {
        this.responseTimes.shift();
      }
      
      // Calculate average, min, max response times
      const avg = this.responseTimes.reduce((sum, time) => sum + time, 0) / this.responseTimes.length;
      const min = Math.min(...this.responseTimes);
      const max = Math.max(...this.responseTimes);
      
      // Record metrics
      try {
        const monitoringSystem = await import('../monitoring/monitoring-system');
        await monitoringSystem.recordMetrics(env, 'agent', {
          ruleCalls: this.requestCount,
          responseTimes: {
            avg,
            min,
            max,
          },
          lastRequest: {
            id: request.id,
            sessionId: request.sessionId,
            timestamp: Date.now(),
          },
        }, ['agent', 'request']);
      } catch (error) {
        console.error('Error recording metrics in monitoring system:', error);
      }
    } catch (error) {
      console.error('Error recording request metrics:', error);
    }
  }
} 