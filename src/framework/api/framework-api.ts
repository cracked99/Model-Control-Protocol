/**
 * Framework API Implementation
 */

import { CommandResponse, AgentRequest } from '../types';
import * as initSystem from '../core/init-system';
import * as monitoringSystem from '../monitoring/monitoring-system';
import * as agentService from '../agent/agent-service';
import * as projectState from '../core/project-state';
import { v4 as uuidv4 } from 'uuid';

/**
 * Initialize the Framework API
 */
export async function initialize(env: any): Promise<void> {
  console.log('Initializing Framework API...');
}

/**
 * Handle API requests
 */
export async function handleRequest(request: Request, env: any): Promise<Response> {
  try {
    const url = new URL(request.url);
    const path = url.pathname;
    
    // Framework API routes
    if (path === '/api/framework/initialize') {
      return handleInitializeRequest(request, env);
    } else if (path === '/api/framework/status') {
      return handleStatusRequest(request, env);
    } else if (path === '/api/framework/rules/load') {
      return handleLoadRulesRequest(request, env);
    } else if (path === '/api/framework/rules/unload') {
      return handleUnloadRulesRequest(request, env);
    } else if (path === '/api/framework/rules/list') {
      return handleListRulesRequest(request, env);
    } else if (path === '/api/framework/reset') {
      return handleResetRequest(request, env);
    } else if (path === '/api/framework/reset-project-state') {
      return handleResetProjectStateRequest(request, env);
    } else if (path === '/api/agent/process') {
      return handleProcessRequest(request, env);
    } else if (path === '/api/agent/context') {
      return handleContextRequest(request, env);
    } else if (path === '/api/monitoring/metrics') {
      return handleMetricsRequest(request, env);
    } else if (path === '/api/agent/feedback') {
      return handleFeedbackRequest(request, env);
    } else if (path === '/api/agent/feedback/analysis') {
      return handleFeedbackAnalysisRequest(request, env);
    }
    
    // If no route matches, return 404
    return createJsonResponse({ error: 'Not Found' }, 404);
  } catch (error) {
    console.error('Error handling API request:', error);
    return createErrorResponse('Internal server error', error, 500);
  }
}

// Alias for backward compatibility
export const handleApiRequest = handleRequest;

/**
 * Handle initialize request
 */
async function handleInitializeRequest(request: Request, env: any): Promise<Response> {
  try {
    // Initialize framework
    const result = await initSystem.initializeFramework(env);
    
    // Return result
    return createJsonResponse({
      status: result.status === 'error' ? 'error' : 'success',
      message: 'Framework initialized',
    });
  } catch (error) {
    console.error('Error initializing framework:', error);
    return createErrorResponse('Error initializing framework', error);
  }
}

/**
 * Handle status request
 */
async function handleStatusRequest(request: Request, env: any): Promise<Response> {
  try {
    // Get framework status
    const isEnabled = initSystem.isFrameworkEnabled();
    const config = await initSystem.getConfig(env);
    
    // Get metrics if monitoring is enabled
    let metrics = null;
    if (config && config.monitoring && config.monitoring.enabled) {
      metrics = await monitoringSystem.getMetrics(env);
    }
    
    // Return status
    return createJsonResponse({
      status: 'success',
      data: {
        enabled: isEnabled,
        config,
        metrics,
      },
    });
  } catch (error) {
    console.error('Error getting framework status:', error);
    return createErrorResponse('Error getting framework status', error);
  }
}

/**
 * Handle metrics request
 */
async function handleMetricsRequest(request: Request, env: any): Promise<Response> {
  try {
    // Get metrics
    const metrics = await monitoringSystem.getMetrics(env);
    
    // Return metrics
    return createJsonResponse({
      status: 'success',
      data: {
        metrics: {
          ruleCalls: metrics.ruleCalls,
          responseTime: {
            avg: metrics.responseTimeAvg,
            min: metrics.responseTimeMin,
            max: metrics.responseTimeMax,
          },
          memory: metrics.memoryUsage,
          cpu: metrics.cpuUsage,
          activeRules: metrics.activeRules,
          requestRate: metrics.requestRate,
        },
      },
    });
  } catch (error) {
    console.error('Error getting metrics:', error);
    return createErrorResponse('Error getting metrics', error);
  }
}

/**
 * Handle load rules request
 */
async function handleLoadRulesRequest(request: Request, env: any): Promise<Response> {
  try {
    // Get request body
    const body = await request.json() as { ruleSet?: string };
    
    if (!body.ruleSet) {
      return createErrorResponse('Missing ruleSet parameter', null);
    }
    
    // Load rule set
    const result = await initSystem.loadRuleSet(env, body.ruleSet);
    
    // Return result
    return createJsonResponse(result);
  } catch (error) {
    console.error('Error loading rule set:', error);
    return createErrorResponse('Error loading rule set', error);
  }
}

/**
 * Handle unload rules request
 */
async function handleUnloadRulesRequest(request: Request, env: any): Promise<Response> {
  try {
    // Get request body
    const body = await request.json() as { ruleSet?: string };
    
    if (!body.ruleSet) {
      return createErrorResponse('Missing ruleSet parameter', null);
    }
    
    // Unload rule set
    const result = await initSystem.unloadRuleSet(env, body.ruleSet);
    
    // Return result
    return createJsonResponse(result);
  } catch (error) {
    console.error('Error unloading rule set:', error);
    return createErrorResponse('Error unloading rule set', error);
  }
}

/**
 * Handle list rules request
 */
async function handleListRulesRequest(request: Request, env: any): Promise<Response> {
  try {
    // Get rule sets
    const ruleSets = await initSystem.listRuleSets(env);
    
    // Return rule sets
    return createJsonResponse({
      status: 'success',
      data: {
        ruleSets,
      },
    });
  } catch (error) {
    console.error('Error listing rule sets:', error);
    return createErrorResponse('Error listing rule sets', error);
  }
}

/**
 * Handle reset request
 */
async function handleResetRequest(request: Request, env: any): Promise<Response> {
  try {
    // Reset framework
    const result = await initSystem.resetFramework(env);
    
    // Return result
    return createJsonResponse({
      status: result.status === 'error' ? 'error' : 'success',
      message: 'Framework reset',
    });
  } catch (error) {
    console.error('Error resetting framework:', error);
    return createErrorResponse('Error resetting framework', error);
  }
}

/**
 * Handle process request
 */
async function handleProcessRequest(request: Request, env: any): Promise<Response> {
  try {
    // Get request body
    const body = await request.json() as Record<string, any>;
    
    // Validate request data
    if (!body || typeof body !== 'object') {
      return createErrorResponse('Invalid request data', null);
    }
    
    // Create agent request
    const agentRequest: AgentRequest = {
      id: body.id || uuidv4(),
      sessionId: body.sessionId || uuidv4(),
      content: body.content || '',
      command: body.command || '',
      metadata: body.metadata && typeof body.metadata === 'object' ? body.metadata : {},
    };
    
    // Process request
    const result = await agentService.processRequest(env, agentRequest);
    
    // Return result
    return createJsonResponse({
      status: 'success',
      data: result,
    });
  } catch (error) {
    console.error('Error processing request:', error);
    return createErrorResponse('Error processing request', error);
  }
}

/**
 * Handle context request
 */
async function handleContextRequest(request: Request, env: any): Promise<Response> {
  try {
    // Get session ID from query params
    const url = new URL(request.url);
    const sessionId = url.searchParams.get('sessionId');
    
    if (!sessionId) {
      return createErrorResponse('Missing sessionId parameter', null);
    }
    
    // Get context
    const context = await agentService.getContext(env, sessionId);
    
    // Return context
    return createJsonResponse({
      status: 'success',
      data: {
        context,
      },
    });
  } catch (error) {
    console.error('Error getting context:', error);
    return createErrorResponse('Error getting context', error);
  }
}

/**
 * Handle feedback request
 */
async function handleFeedbackRequest(request: Request, env: any): Promise<Response> {
  try {
    if (request.method === 'POST') {
      // Handle POST request (submit feedback)
      const body = await request.json() as { 
        sessionId?: string;
        requestId?: string;
        score?: number | string;
        comment?: string;
      };
      
      // Validate required fields
      if (!body.sessionId) {
        return createErrorResponse('Missing sessionId parameter', null);
      }
      
      if (body.score === undefined) {
        return createErrorResponse('Missing score parameter', null);
      }
      
      // Convert score to number if it's a string
      const score = typeof body.score === 'string' ? parseFloat(body.score) : body.score;
      
      // Create feedback entry
      const feedback = {
        sessionId: body.sessionId,
        requestId: body.requestId || uuidv4(),
        score,
        comment: body.comment || '',
        timestamp: Date.now(),
      };
      
      // Store feedback
      await agentService.storeFeedback(env, feedback);
      
      // Return success
      return createJsonResponse({
        status: 'success',
        message: 'Feedback submitted',
        data: {
          feedback,
        },
      });
    } else {
      // Handle GET request (get feedback)
      const url = new URL(request.url);
      const sessionId = url.searchParams.get('sessionId');
      
      if (!sessionId) {
        return createErrorResponse('Missing sessionId parameter', null);
      }
      
      // Get feedback
      const feedback = await agentService.getFeedback(env, sessionId);
      
      // Return feedback
      return createJsonResponse({
        status: 'success',
        data: {
          feedback,
        },
      });
    }
  } catch (error) {
    console.error('Error handling feedback:', error);
    return createErrorResponse('Error handling feedback', error);
  }
}

/**
 * Handle feedback analysis request
 */
async function handleFeedbackAnalysisRequest(request: Request, env: any): Promise<Response> {
  try {
    // Get all feedback
    const allFeedback = await agentService.getAllFeedback(env);
    
    if (!allFeedback || allFeedback.length === 0) {
      return createJsonResponse({
        status: 'success',
        data: {
          analysis: {
            count: 0,
            averageScore: 0,
            positiveCount: 0,
            neutralCount: 0,
            negativeCount: 0,
          },
        },
      });
    }
    
    // Calculate metrics
    const count = allFeedback.length;
    let totalScore = 0;
    let positiveCount = 0;
    let neutralCount = 0;
    let negativeCount = 0;
    
    for (const feedback of allFeedback) {
      totalScore += feedback.score;
      
      if (feedback.score > 3.5) {
        positiveCount++;
      } else if (feedback.score < 2.5) {
        negativeCount++;
      } else {
        neutralCount++;
      }
    }
    
    const averageScore = totalScore / count;
    
    // Return analysis
    return createJsonResponse({
      status: 'success',
      data: {
        analysis: {
          count,
          averageScore,
          positiveCount,
          neutralCount,
          negativeCount,
        },
      },
    });
  } catch (error) {
    console.error('Error analyzing feedback:', error);
    return createErrorResponse('Error analyzing feedback', error);
  }
}

/**
 * Handle reset project state request
 */
async function handleResetProjectStateRequest(request: Request, env: any): Promise<Response> {
  try {
    // Create an empty project state
    const emptyState: projectState.ProjectState = {
      components: [],
      ruleSets: [],
      tasks: [],
      phases: [],
      currentPhase: 0,
      lastUpdated: Date.now()
    };
    
    // Update project state with empty state
    await projectState.updateProjectState(env, emptyState);
    
    // Return success result
    return createJsonResponse({
      status: 'success',
      message: 'Project state reset to empty state',
    });
  } catch (error) {
    console.error('Error resetting project state:', error);
    return createErrorResponse('Error resetting project state', error);
  }
}

/**
 * Create a JSON response
 */
function createJsonResponse(data: any, status: number = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

/**
 * Create an error response
 */
function createErrorResponse(message: string, error: any, status: number = 400): Response {
  return createJsonResponse({
    status: 'error',
    message,
    error: error ? String(error) : undefined,
  }, status);
} 