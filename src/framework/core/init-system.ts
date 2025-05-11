/**
 * Initialization system for the Agentic Framework
 */

import { FrameworkConfig } from '../types';

// Default configuration
const DEFAULT_CONFIG: FrameworkConfig = {
  settings: {
    initialization: {
      enabled: true,
    },
    framework: {
      enableMetrics: true,
    },
  },
};

/**
 * Initialize the framework
 */
export async function initializeFramework(env: any): Promise<{ status: string; message: string; activeRules?: number }> {
  console.log('Initializing Agentic Framework...');
  
  try {
    // Get or create configuration
    const config = await getConfig(env);
    
    if (!config.settings.initialization.enabled) {
      console.log('Framework initialization is disabled in config');
      return {
        status: 'error',
        message: 'Framework initialization is disabled in config',
      };
    }
    
    // Load rule engine
    const ruleEngine = await import('../rule-engine/rule-engine');
    await ruleEngine.initialize(env);
    
    // Load agent service
    const agentService = await import('../agent-service/agent-service');
    await agentService.initialize(env);
    
    // Load monitoring system
    const monitoring = await import('../monitoring/monitoring-system');
    await monitoring.initialize(env);
    
    // Load always-active rules
    const loadedRules = await ruleEngine.loadAlwaysActiveRules(env);
    
    // Log initialization
    await logInitialization(env, {
      timestamp: new Date().toISOString(),
      status: 'success',
      loadedRules: loadedRules.length,
    });
    
    console.log('Agentic Framework initialized successfully.');
    return {
      status: 'success',
      message: 'Agentic Framework initialized successfully.',
      activeRules: loadedRules.length,
    };
  } catch (error) {
    console.error('Error initializing Agentic Framework:', error);
    
    // Log error
    await logInitialization(env, {
      timestamp: new Date().toISOString(),
      status: 'error',
      error: error instanceof Error ? error.message : String(error),
    });
    
    return {
      status: 'error',
      message: `Framework initialization failed: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Get or create configuration
 */
export async function getConfig(env: any): Promise<FrameworkConfig> {
  try {
    // Try to get config from KV
    const configStr = await env.FRAMEWORK_KV?.get('config');
    if (configStr) {
      return JSON.parse(configStr);
    }
  } catch (error) {
    console.error('Error getting config from KV:', error);
  }
  
  // Return default config if not found
  return DEFAULT_CONFIG;
}

/**
 * Save configuration
 */
export async function saveConfig(env: any, config: FrameworkConfig): Promise<boolean> {
  try {
    // Save config to KV
    await env.FRAMEWORK_KV?.put('config', JSON.stringify(config));
    return true;
  } catch (error) {
    console.error('Error saving config to KV:', error);
    return false;
  }
}

/**
 * Log initialization
 */
async function logInitialization(env: any, data: any): Promise<void> {
  try {
    // Get existing logs
    const logsStr = await env.FRAMEWORK_KV?.get('initialization_logs');
    const logs = logsStr ? JSON.parse(logsStr) : [];
    
    // Add new log
    logs.push(data);
    
    // Keep only last 100 logs
    const trimmedLogs = logs.slice(-100);
    
    // Save logs
    await env.FRAMEWORK_KV?.put('initialization_logs', JSON.stringify(trimmedLogs));
  } catch (error) {
    console.error('Error logging initialization:', error);
  }
} 