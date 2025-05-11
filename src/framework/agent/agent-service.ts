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

/**
 * Start the dashboard process
 * This function initiates the dashboard UI for monitoring the framework
 */
export async function startDashboard(env: any): Promise<boolean> {
  try {
    console.log('Starting dashboard process');
    
    // Check if dashboard is already running
    const existingStatusStr = await env.FRAMEWORK_KV?.get('dashboard:status');
    const existingStatus = existingStatusStr ? JSON.parse(existingStatusStr) : null;
    
    if (existingStatus?.active) {
      console.log('Dashboard is already running');
      return true;
    }
    
    // Store dashboard state in KV with session persistence flag
    await env.FRAMEWORK_KV?.put('dashboard:status', JSON.stringify({
      active: true,
      persistent: true, // Mark as persistent for the entire session
      startedAt: Date.now(),
      pid: process.pid || 'unknown'
    }));
    
    // Get the current status to display in the dashboard
    const initSystem = await import('../core/init-system');
    const config = await initSystem.getConfig(env);
    
    // Get rule metrics
    const monitoringSystem = await import('../monitoring/monitoring-system');
    const metrics = await monitoringSystem.collectSystemMetrics(env);
    
    // Log dashboard startup for the terminal UI
    console.log('\n======================================');
    console.log('📊 AGENTIC FRAMEWORK DASHBOARD 📊');
    console.log('======================================');
    console.log(`Status: ${config?.enabled ? '✅ Active' : '❌ Inactive'}`);
    console.log(`Started: ${new Date().toLocaleString()}`);
    console.log(`Persistence: Enabled for entire session`);
    console.log(`Memory: ${metrics.data.memory?.used || 0}MB`);
    console.log('======================================\n');
    
    // Ensure dashboard heartbeat (refresh dashboard status periodically)
    const heartbeatInterval = setInterval(async () => {
      try {
        await env.FRAMEWORK_KV?.put('dashboard:heartbeat', Date.now().toString());
      } catch (error) {
        console.error('Dashboard heartbeat error:', error);
      }
    }, 30000); // Every 30 seconds
    
    // Setup refresh interval for live updates with error recovery
    const createDashboardInterval = () => {
      return setInterval(async () => {
        try {
          // Check if dashboard should still be active
          const statusStr = await env.FRAMEWORK_KV?.get('dashboard:status');
          const status = statusStr ? JSON.parse(statusStr) : { active: false };
          
          if (!status.active && !status.persistent) {
            clearInterval(dashboardInterval);
            clearInterval(heartbeatInterval);
            console.log('Dashboard stopped');
            return;
          }
          
          // Update dashboard display
          const updatedMetrics = await monitoringSystem.collectSystemMetrics(env);
          
          console.clear();
          console.log('\n======================================');
          console.log('📊 AGENTIC FRAMEWORK DASHBOARD 📊');
          console.log('======================================');
          console.log(`Status: ${config?.enabled ? '✅ Active' : '❌ Inactive'}`);
          console.log(`Started: ${new Date(status.startedAt).toLocaleString()}`);
          console.log(`Uptime: ${Math.floor((Date.now() - status.startedAt) / 1000)}s`);
          console.log(`Persistence: ${status.persistent ? 'Enabled for entire session' : 'Standard'}`);
          console.log(`Memory: ${updatedMetrics.data.memory?.used || 0}MB`);
          console.log(`Rule Calls: ${updatedMetrics.data.ruleCalls || 0}`);
          console.log(`Last Update: ${new Date().toLocaleString()}`);
          console.log('======================================\n');
          
        } catch (error) {
          console.error('Error updating dashboard:', error);
          
          // If interval fails, try to restart it after a brief delay
          clearInterval(dashboardInterval);
          setTimeout(() => {
            dashboardInterval = createDashboardInterval();
          }, 5000);
        }
      }, 3000);
    };
    
    // Create the initial interval
    let dashboardInterval = createDashboardInterval();
    
    // Setup recovery mechanism
    const recoveryInterval = setInterval(async () => {
      try {
        const heartbeatStr = await env.FRAMEWORK_KV?.get('dashboard:heartbeat');
        const lastHeartbeat = parseInt(heartbeatStr || '0');
        
        // If no heartbeat for 2 minutes, try to restart the dashboard
        if (Date.now() - lastHeartbeat > 120000) {
          clearInterval(dashboardInterval);
          dashboardInterval = createDashboardInterval();
          console.log('Dashboard recovered after inactivity');
        }
      } catch (error) {
        console.error('Dashboard recovery error:', error);
      }
    }, 60000); // Check every minute
    
    // Make the dashboard highly resilient
    process.on('uncaughtException', (error) => {
      console.error('Uncaught exception in dashboard:', error);
      
      // Try to restart the dashboard
      clearInterval(dashboardInterval);
      dashboardInterval = createDashboardInterval();
    });
    
    return true;
  } catch (error) {
    console.error('Error starting dashboard:', error);
    return false;
  }
}

/**
 * Stop the dashboard
 */
export async function stopDashboard(env: any): Promise<boolean> {
  try {
    // Update dashboard status in KV
    await env.FRAMEWORK_KV?.put('dashboard:status', JSON.stringify({ 
      active: false,
      persistent: false,
      lastUpdate: Date.now()
    }));
    
    return true;
  } catch (error) {
    console.error('Error stopping dashboard:', error);
    return false;
  }
}

/**
 * Refresh the dashboard with updated data
 * This is used to refresh the dashboard when data is updated by agents
 */
export async function refreshDashboard(env: any): Promise<boolean> {
  try {
    console.log('Refreshing dashboard with latest data');
    
    // Get current dashboard status
    const statusStr = await env.FRAMEWORK_KV?.get('dashboard:status');
    const status = statusStr ? JSON.parse(statusStr) : { active: false };
    
    // If dashboard is not active, nothing to refresh
    if (!status.active) {
      console.log('Dashboard is not active, no refresh needed');
      return false;
    }
    
    // Update dashboard status with new timestamp to trigger refresh
    await env.FRAMEWORK_KV?.put('dashboard:status', JSON.stringify({
      ...status,
      lastUpdate: Date.now(),
      refreshedByAgent: true
    }));
    
    console.log('Dashboard refresh triggered');
    return true;
  } catch (error) {
    console.error('Error refreshing dashboard:', error);
    return false;
  }
} 