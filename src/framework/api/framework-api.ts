/**
 * Framework API Implementation
 */

import { Router } from 'itty-router';
import { CommandResponse, AgentRequest } from '../types';

// Create a new router
const router = Router();

/**
 * Initialize the API
 */
export async function initialize(): Promise<{ status: string }> {
  console.log('Initializing Framework API...');
  return { status: 'success' };
}

/**
 * Handle framework API requests
 */
export async function handleRequest(request: Request, env: any): Promise<Response> {
  return router.handle(request, env);
}

// Define API routes

/**
 * Initialize the framework
 */
router.post('/api/framework/initialize', async (request: Request, env: any) => {
  try {
    const initSystem = await import('../core/init-system');
    const result = await initSystem.initializeFramework(env);
    
    return createJsonResponse({
      status: result.status === 'error' ? 'error' : 'success',
      message: result.message,
      data: { activeRules: result.activeRules },
    });
  } catch (error) {
    return createErrorResponse('Error initializing framework', error);
  }
});

/**
 * Get framework status
 */
router.get('/api/framework/status', async (request: Request, env: any) => {
  try {
    const initSystem = await import('../core/init-system');
    const ruleEngine = await import('../rule-engine/rule-engine');
    const monitoring = await import('../monitoring/monitoring-system');
    
    // Get config
    const config = await initSystem.getConfig(env);
    
    // Get loaded rules
    const loadedRules = await ruleEngine.getActiveRules();
    
    // Get metrics if enabled
    let metrics = null;
    if (config.settings.framework.enableMetrics) {
      const systemMetrics = await monitoring.collectSystemMetrics(env);
      metrics = {
        ruleCalls: systemMetrics.data.ruleCalls || 0,
        responseTimes: systemMetrics.data.responseTimes || {
          avg: 0,
          min: 0,
          max: 0,
        },
        memoryUsage: `${Math.round(systemMetrics.data.memory?.used || 0)}MB`,
      };
    }
    
    return createJsonResponse({
      status: 'success',
      message: 'Framework status retrieved successfully',
      data: {
        isEnabled: config.settings.initialization.enabled,
        loadedRules: loadedRules.map(rule => ({
          name: rule.name,
          type: rule.type,
          status: 'active',
        })),
        metrics,
      },
    });
  } catch (error) {
    return createErrorResponse('Error getting framework status', error);
  }
});

/**
 * Load specific rule sets
 */
router.post('/api/framework/rules/load', async (request: Request, env: any) => {
  try {
    const { ruleSets, triggers } = await request.json() as { ruleSets?: string[]; triggers?: string[] };
    
    if (!ruleSets && !triggers) {
      return createJsonResponse({
        status: 'error',
        message: 'Either ruleSets or triggers must be provided',
      }, 400);
    }
    
    const ruleEngine = await import('../rule-engine/rule-engine');
    
    let loadedRules;
    if (triggers) {
      // Load rules by triggers
      loadedRules = await ruleEngine.loadOnDemandRules(env, triggers);
    } else {
      // Load specific rule sets
      // In a real implementation, this would load the specified rule sets
      loadedRules = [];
      for (const ruleName of ruleSets!) {
        // This is a simplified version - in reality, we would need to map rule names to triggers
        const mockTriggers = [ruleName.replace('-', '_')];
        const rules = await ruleEngine.loadOnDemandRules(env, mockTriggers);
        loadedRules.push(...rules);
      }
    }
    
    return createJsonResponse({
      status: 'success',
      message: `Loaded ${loadedRules.length} rule(s) successfully`,
      data: {
        loadedRules: loadedRules.map(rule => rule.name),
      },
    });
  } catch (error) {
    return createErrorResponse('Error loading rules', error);
  }
});

/**
 * Unload specific rule sets
 */
router.post('/api/framework/rules/unload', async (request: Request, env: any) => {
  try {
    const { ruleSets } = await request.json() as { ruleSets: string[] };
    
    if (!ruleSets || !Array.isArray(ruleSets)) {
      return createJsonResponse({
        status: 'error',
        message: 'ruleSets must be provided as an array',
      }, 400);
    }
    
    const ruleEngine = await import('../rule-engine/rule-engine');
    
    const results = [];
    for (const ruleName of ruleSets) {
      const success = await ruleEngine.unloadRule(env, ruleName);
      results.push({ ruleName, success });
    }
    
    const successCount = results.filter(r => r.success).length;
    
    return createJsonResponse({
      status: 'success',
      message: `Unloaded ${successCount} rule(s) successfully`,
      data: { results },
    });
  } catch (error) {
    return createErrorResponse('Error unloading rules', error);
  }
});

/**
 * List all available rule sets
 */
router.get('/api/framework/rules/list', async (request: Request, env: any) => {
  try {
    const ruleEngine = await import('../rule-engine/rule-engine');
    
    // Get active rules
    const activeRules = await ruleEngine.getActiveRules();
    const activeRuleNames = activeRules.map(rule => rule.name);
    
    // In a real implementation, this would get all available rules from storage
    // For this example, we'll just return the core and on-demand rules we've defined
    
    const availableRules = [
      { name: 'core-agent-behavior', type: 'core', location: 'always_active/core_rules' },
      { name: 'rule-prioritization', type: 'enhancement', location: 'always_active/core_enhancements' },
      { name: 'context-retention', type: 'enhancement', location: 'always_active/core_enhancements' },
      { name: 'code-quality-development', type: 'on-demand', location: 'on_demand/comprehensive' },
      { name: 'architectural-guidelines', type: 'on-demand', location: 'on_demand/comprehensive' },
    ];
    
    // Mark active rules
    const rulesWithStatus = availableRules.map(rule => ({
      ...rule,
      isActive: activeRuleNames.includes(rule.name),
    }));
    
    return createJsonResponse({
      status: 'success',
      message: 'Rule sets retrieved successfully',
      data: { rules: rulesWithStatus },
    });
  } catch (error) {
    return createErrorResponse('Error listing rule sets', error);
  }
});

/**
 * Reset framework to default state
 */
router.post('/api/framework/reset', async (request: Request, env: any) => {
  try {
    // In a real implementation, this would reset the framework to its default state
    // For this example, we'll just reinitialize the framework
    
    const initSystem = await import('../core/init-system');
    
    // Reset config to default
    const defaultConfig = {
      settings: {
        initialization: {
          enabled: true,
        },
        framework: {
          enableMetrics: true,
        },
      },
    };
    
    await initSystem.saveConfig(env, defaultConfig);
    
    // Reinitialize the framework
    const result = await initSystem.initializeFramework(env);
    
    return createJsonResponse({
      status: result.status === 'error' ? 'error' : 'success',
      message: 'Framework reset to default state',
      data: { activeRules: result.activeRules },
    });
  } catch (error) {
    return createErrorResponse('Error resetting framework', error);
  }
});

/**
 * Process a request through the agent
 */
router.post('/api/agent/process', async (request: Request, env: any) => {
  try {
    const requestData = await request.json();
    
    // Validate and create a proper AgentRequest
    if (!requestData || typeof requestData !== 'object' || !('content' in requestData)) {
      return createJsonResponse({
        status: 'error',
        message: 'Request content is required',
      }, 400);
    }
    
    // Extract metadata safely
    let metadata: Record<string, any> | undefined = undefined;
    if ('metadata' in requestData && requestData.metadata && typeof requestData.metadata === 'object') {
      metadata = requestData.metadata as Record<string, any>;
    }
    
    const agentRequest: AgentRequest = {
      id: ('id' in requestData && typeof requestData.id === 'string') ? requestData.id : crypto.randomUUID(),
      sessionId: ('sessionId' in requestData && typeof requestData.sessionId === 'string') ? requestData.sessionId : crypto.randomUUID(),
      content: String(requestData.content),
      metadata: metadata,
    };
    
    const agentService = await import('../agent-service/agent-service');
    const response = await agentService.processRequest(env, agentRequest);
    
    return createJsonResponse({
      status: 'success',
      message: 'Request processed successfully',
      data: { response },
    });
  } catch (error) {
    return createErrorResponse('Error processing request', error);
  }
});

/**
 * Get current agent context
 */
router.get('/api/agent/context', async (request: Request, env: any) => {
  try {
    const url = new URL(request.url);
    const sessionId = url.searchParams.get('sessionId');
    
    if (!sessionId) {
      return createJsonResponse({
        status: 'error',
        message: 'sessionId is required',
      }, 400);
    }
    
    const contextManager = await import('../agent-service/context-manager');
    const context = await contextManager.getContext(env, { sessionId });
    
    return createJsonResponse({
      status: 'success',
      message: 'Context retrieved successfully',
      data: { context },
    });
  } catch (error) {
    return createErrorResponse('Error getting context', error);
  }
});

/**
 * Get framework metrics
 */
router.get('/api/monitoring/metrics', async (request: Request, env: any) => {
  try {
    const url = new URL(request.url);
    const category = url.searchParams.get('category') || 'system';
    const limitParam = url.searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : 10;
    
    const monitoring = await import('../monitoring/monitoring-system');
    const metrics = await monitoring.getMetrics(env, category, limit);
    
    return createJsonResponse({
      status: 'success',
      message: 'Metrics retrieved successfully',
      data: { metrics },
    });
  } catch (error) {
    return createErrorResponse('Error getting metrics', error);
  }
});

/**
 * Create a JSON response
 */
function createJsonResponse(data: CommandResponse, status: number = 200): Response {
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
function createErrorResponse(message: string, error: any, status: number = 500): Response {
  console.error(`${message}:`, error);
  
  return createJsonResponse({
    status: 'error',
    message: `${message}: ${error instanceof Error ? error.message : String(error)}`,
  }, status);
} 