/**
 * Agent Service Implementation
 */

import { AgentRequest, AgentResponse, Feedback } from '../types';
import * as ruleEngine from '../rule-engine/rule-engine';

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
    let responseContent = `Processed command: ${request.command}`;
    
    // Check if this is a code quality request
    if (request.metadata?.type === 'code-quality') {
      try {
        // Make sure code quality rules are loaded
        await ruleEngine.loadRuleSet(env, 'code-quality-development');
        
        // Get the code from the request content
        const code = request.content;
        const language = request.metadata?.language || 'javascript';
        
        // Analyze code quality
        const qualityAnalysis = await analyzeCodeQuality(code, language);
        
        if (qualityAnalysis) {
          responseContent = qualityAnalysis;
        }
      } catch (error) {
        console.error('Error analyzing code quality:', error);
      }
    }
    
    const response: AgentResponse = {
      id: `resp_${Date.now()}`,
      requestId: request.id,
      content: responseContent,
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
 * Analyze code quality
 */
async function analyzeCodeQuality(code: string, language: string): Promise<string> {
  try {
    // Basic code quality checks
    const findings = [];
    let improvedCode = code;
    
    // Check for error handling
    if (!code.includes('try') && !code.includes('catch')) {
      findings.push("⚠️ Error Handling: Missing proper error handling patterns");
      improvedCode = `// Consider adding error handling\ntry {\n  ${code}\n} catch (error) {\n  // Handle errors appropriately\n  console.error(error);\n}`;
    }
    
    // Check for security issues
    if (code.includes('eval(') || code.includes('innerHTML =')) {
      findings.push("🔒 Security: Potential security vulnerabilities detected");
      improvedCode = improvedCode.replace(/eval\s*\(/g, '/* Security risk: avoid eval */ (');
      improvedCode = improvedCode.replace(/\.innerHTML\s*=/g, '/* Security risk: use textContent instead */ .textContent =');
    }
    
    // Check for performance issues
    if (code.includes('for (') && code.includes('.concat(')) {
      findings.push("⚡ Performance: Performance optimization opportunities identified");
      improvedCode = improvedCode.replace(/\.concat\(/g, '/* Performance: consider using push instead */ .push(');
    }
    
    // Check for testability
    if (code.includes('document.') || code.includes('window.')) {
      findings.push("🧪 Testability: Code could be improved for better testability");
      improvedCode = `// Consider dependency injection for better testability\n${improvedCode}`;
    }
    
    // Check for maintainability
    const lines = code.split('\n');
    if (lines.length > 10 || code.length > 200) {
      findings.push("🔧 Maintainability: Code maintainability issues detected");
      improvedCode = `// Consider breaking down into smaller functions\n${improvedCode}`;
    }
    
    // Generate response
    if (findings.length > 0) {
      let response = "## Code Quality Analysis\n\n";
      response += findings.join("\n");
      response += "\n\n### Improved Code\n\n";
      response += "```" + language + "\n";
      response += improvedCode;
      response += "\n```";
      return response;
    } else {
      return "## Code Quality Analysis\n\n✅ No quality issues detected in the provided code.";
    }
  } catch (error) {
    console.error('Error in code quality analysis:', error);
    return "Error analyzing code quality.";
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