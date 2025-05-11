/**
 * Framework Commands Implementation
 */

import { CommandResponse } from '../types';

// Command handler mapping
const COMMANDS: Record<string, (args: string[], env: any) => Promise<CommandResponse>> = {
  'status': handleStatusCommand,
  'help': handleHelpCommand,
  'load': handleLoadCommand,
  'unload': handleUnloadCommand,
  'reload': handleReloadCommand,
  'list': handleListCommand,
  'reset': handleResetCommand,
};

/**
 * Main entry point for framework commands
 */
export async function handleFrameworkCommand(args: string[], env: any): Promise<CommandResponse> {
  const command = args[0] || 'help';
  const commandArgs = args.slice(1);
  
  // Check if command exists
  if (COMMANDS[command]) {
    return await COMMANDS[command](commandArgs, env);
  } else {
    return {
      status: 'error',
      message: `Unknown command: ${command}. Use "/framework help" for available commands.`,
    };
  }
}

/**
 * Handle /framework status command
 */
async function handleStatusCommand(args: string[], env: any): Promise<CommandResponse> {
  try {
    // Get framework status
    const initSystem = await import('./init-system');
    const config = await initSystem.getConfig(env);
    const isEnabled = config.settings.initialization.enabled;
    
    // Get loaded rules
    const ruleEngine = await import('../rule-engine/rule-engine');
    const loadedRules = await ruleEngine.getActiveRules();
    
    // Get metrics if enabled
    let metrics = null;
    if (config.settings.framework.enableMetrics) {
      const monitoring = await import('../monitoring/monitoring-system');
      const systemMetrics = await monitoring.collectSystemMetrics(env);
      
      metrics = {
        ruleCalls: systemMetrics.data.ruleCalls || 0,
        responseTimes: {
          avg: systemMetrics.data.responseTimes?.avg || 0,
          min: systemMetrics.data.responseTimes?.min || 0,
          max: systemMetrics.data.responseTimes?.max || 0,
        },
        memoryUsage: `${Math.round(systemMetrics.data.memory?.used || 0)}MB`,
      };
    }
    
    return {
      status: 'success',
      message: formatStatusMessage(isEnabled, loadedRules, metrics),
    };
  } catch (error) {
    return {
      status: 'error',
      message: `Error getting framework status: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Handle /framework help command
 */
async function handleHelpCommand(args: string[], env: any): Promise<CommandResponse> {
  const helpText = `
  Agentic Framework Commands:
  
  /framework status - Show current framework status
  /framework help   - Show this help message
  /framework load <rule-set> - Load a specific rule set
  /framework unload <rule-set> - Unload a specific rule set
  /framework reload - Reload all active rules
  /framework list   - List all available rule sets
  /framework reset  - Reset framework to default state
  
  Examples:
  /framework load code-quality-development
  /framework unload architectural-guidelines
  `;
  
  return {
    status: 'success',
    message: helpText,
  };
}

/**
 * Handle /framework load command
 */
async function handleLoadCommand(args: string[], env: any): Promise<CommandResponse> {
  if (!args || args.length === 0) {
    return {
      status: 'error',
      message: 'Please specify a rule set to load. Use "/framework list" to see available rule sets.',
    };
  }
  
  const ruleSet = args[0];
  
  try {
    const ruleEngine = await import('../rule-engine/rule-engine');
    
    // This is a simplified version - in reality, we would need to map rule names to triggers
    const mockTriggers = [ruleSet.replace('-', '_')];
    const loadedRules = await ruleEngine.loadOnDemandRules(env, mockTriggers);
    
    if (loadedRules.length === 0) {
      return {
        status: 'error',
        message: `Rule set "${ruleSet}" not found or already loaded.`,
      };
    }
    
    return {
      status: 'success',
      message: `Rule set "${ruleSet}" loaded successfully.`,
    };
  } catch (error) {
    return {
      status: 'error',
      message: `Error loading rule set "${ruleSet}": ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Handle /framework unload command
 */
async function handleUnloadCommand(args: string[], env: any): Promise<CommandResponse> {
  if (!args || args.length === 0) {
    return {
      status: 'error',
      message: 'Please specify a rule set to unload.',
    };
  }
  
  const ruleSet = args[0];
  
  try {
    const ruleEngine = await import('../rule-engine/rule-engine');
    const success = await ruleEngine.unloadRule(env, ruleSet);
    
    if (!success) {
      return {
        status: 'error',
        message: `Rule set "${ruleSet}" not found or cannot be unloaded.`,
      };
    }
    
    return {
      status: 'success',
      message: `Rule set "${ruleSet}" unloaded successfully.`,
    };
  } catch (error) {
    return {
      status: 'error',
      message: `Error unloading rule set "${ruleSet}": ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Handle /framework reload command
 */
async function handleReloadCommand(args: string[], env: any): Promise<CommandResponse> {
  try {
    // Reinitialize the framework
    const initSystem = await import('./init-system');
    const result = await initSystem.initializeFramework(env);
    
    if (result.status === 'error') {
      return {
        status: 'error',
        message: result.message,
      };
    }
    
    return {
      status: 'success',
      message: 'Framework rules reloaded successfully.',
    };
  } catch (error) {
    return {
      status: 'error',
      message: `Error reloading framework rules: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Handle /framework list command
 */
async function handleListCommand(args: string[], env: any): Promise<CommandResponse> {
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
    
    const message = formatRuleListMessage(availableRules, activeRules);
    
    return {
      status: 'success',
      message,
    };
  } catch (error) {
    return {
      status: 'error',
      message: `Error listing rule sets: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Handle /framework reset command
 */
async function handleResetCommand(args: string[], env: any): Promise<CommandResponse> {
  try {
    // Reset config to default
    const initSystem = await import('./init-system');
    
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
    
    if (result.status === 'error') {
      return {
        status: 'error',
        message: result.message,
      };
    }
    
    return {
      status: 'success',
      message: 'Framework reset to default state.',
    };
  } catch (error) {
    return {
      status: 'error',
      message: `Error resetting framework: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Format status message
 */
function formatStatusMessage(isEnabled: boolean, loadedRules: any[], metrics: any | null): string {
  let message = `
  ======================================
  📊 AGENTIC FRAMEWORK STATUS 📊
  
  Status: ${isEnabled ? '✅ Active' : '❌ Inactive'}
  Loaded Rules: ${loadedRules.length}
  `;
  
  // Add rule details
  message += '\n  Active Rules:';
  loadedRules.forEach(rule => {
    message += `\n   - ${rule.name} (${rule.type})`;
  });
  
  // Add metrics if available
  if (metrics) {
    message += `
    
  Performance Metrics:
   - Rule Calls: ${metrics.ruleCalls}
   - Avg Response Time: ${metrics.responseTimes.avg}ms
   - Memory Usage: ${metrics.memoryUsage}
  `;
  }
  
  message += '\n  ======================================';
  
  return message;
}

/**
 * Format rule list message
 */
function formatRuleListMessage(availableRules: any[], loadedRules: any[]): string {
  const loadedRuleNames = loadedRules.map(rule => rule.name);
  
  let message = `
  ======================================
  📋 AVAILABLE RULE SETS 📋
  
  `;
  
  // Group rules by type
  const rulesByType: Record<string, any[]> = {};
  availableRules.forEach(rule => {
    if (!rulesByType[rule.type]) {
      rulesByType[rule.type] = [];
    }
    rulesByType[rule.type].push(rule);
  });
  
  // List rules by type
  Object.keys(rulesByType).forEach(type => {
    message += `\n  ${type.toUpperCase()}:`;
    
    rulesByType[type].forEach(rule => {
      const isLoaded = loadedRuleNames.includes(rule.name);
      message += `\n   - ${rule.name} ${isLoaded ? '✅' : '⬜'}`;
    });
    
    message += '\n';
  });
  
  message += `
  ✅ = Active   ⬜ = Inactive
  
  Use "/framework load <rule-set>" to load a rule set.
  ======================================
  `;
  
  return message;
} 