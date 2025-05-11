/**
 * Framework Initialization System
 */

import { CommandResponse, FrameworkConfig, RuleSet } from '../types';
import * as monitoringSystem from '../monitoring/monitoring-system';
import * as ruleEngine from '../rule-engine/rule-engine';

// Framework configuration
let frameworkConfig: FrameworkConfig | null = null;
let isEnabled = false;

/**
 * Initialize the framework
 */
export async function initializeFramework(env: any): Promise<CommandResponse> {
  try {
    console.log('Initializing framework...');
    
    // Load configuration
    await loadConfig(env);
    
    // Enable framework
    isEnabled = true;
    
    // Initialize monitoring system
    if (frameworkConfig?.monitoring?.enabled) {
      await monitoringSystem.initialize(env);
    }
    
    // Initialize rule engine
    await ruleEngine.initialize(env);
    
    return { status: 'success' };
  } catch (error) {
    console.error('Error initializing framework:', error);
    return { status: 'error', message: 'Error initializing framework' };
  }
}

/**
 * Reset the framework
 */
export async function resetFramework(env: any): Promise<CommandResponse> {
  try {
    console.log('Resetting framework...');
    
    // Disable framework
    isEnabled = false;
    
    // Reset configuration
    frameworkConfig = null;
    
    // Reinitialize framework
    return await initializeFramework(env);
  } catch (error) {
    console.error('Error resetting framework:', error);
    return { status: 'error', message: 'Error resetting framework' };
  }
}

/**
 * Check if the framework is enabled
 */
export function isFrameworkEnabled(): boolean {
  return isEnabled;
}

/**
 * Get the framework configuration
 */
export async function getConfig(env: any): Promise<FrameworkConfig | null> {
  if (!frameworkConfig) {
    await loadConfig(env);
  }
  
  return frameworkConfig;
}

/**
 * Load rule set
 */
export async function loadRuleSet(env: any, ruleSetId: string): Promise<CommandResponse> {
  try {
    console.log(`Loading rule set: ${ruleSetId}`);
    
    // Check if the rule set exists
    const ruleSets = await listRuleSets(env);
    const ruleSet = ruleSets.find(rs => rs.id === ruleSetId);
    
    if (!ruleSet) {
      return { status: 'error', message: `Rule set ${ruleSetId} not found` };
    }
    
    // Load the rule set
    const result = await ruleEngine.loadRuleSet(env, ruleSetId);
    
    if (result) {
      return { status: 'success', message: `Rule set ${ruleSetId} loaded successfully` };
    } else {
      return { status: 'error', message: `Failed to load rule set ${ruleSetId}` };
    }
  } catch (error) {
    console.error(`Error loading rule set ${ruleSetId}:`, error);
    return { status: 'error', message: `Error loading rule set ${ruleSetId}` };
  }
}

/**
 * Unload rule set
 */
export async function unloadRuleSet(env: any, ruleSetId: string): Promise<CommandResponse> {
  try {
    console.log(`Unloading rule set: ${ruleSetId}`);
    
    // Check if the rule set exists
    const ruleSets = await listRuleSets(env);
    const ruleSet = ruleSets.find(rs => rs.id === ruleSetId);
    
    if (!ruleSet) {
      return { status: 'error', message: `Rule set ${ruleSetId} not found` };
    }
    
    // Unload the rule set
    const result = await ruleEngine.unloadRuleSet(env, ruleSetId);
    
    if (result) {
      return { status: 'success', message: `Rule set ${ruleSetId} unloaded successfully` };
    } else {
      return { status: 'error', message: `Failed to unload rule set ${ruleSetId}` };
    }
  } catch (error) {
    console.error(`Error unloading rule set ${ruleSetId}:`, error);
    return { status: 'error', message: `Error unloading rule set ${ruleSetId}` };
  }
}

/**
 * List rule sets
 */
export async function listRuleSets(env: any): Promise<RuleSet[]> {
  try {
    console.log('Listing rule sets...');
    
    // Get active rules
    const activeRules = await ruleEngine.getActiveRules();
    
    // Create rule sets
    const ruleSets: RuleSet[] = [
      {
        id: 'core-agent-behavior',
        name: 'Core Agent Behavior',
        type: 'core',
        status: 'active',
        ruleCount: activeRules.filter(r => r.id.startsWith('core-agent-behavior:')).length,
      },
      {
        id: 'rule-prioritization',
        name: 'Rule Prioritization',
        type: 'enhancement',
        status: 'active',
        ruleCount: activeRules.filter(r => r.id.startsWith('rule-prioritization:')).length,
      },
      {
        id: 'context-retention',
        name: 'Context Retention',
        type: 'enhancement',
        status: 'active',
        ruleCount: activeRules.filter(r => r.id.startsWith('context-retention:')).length,
      },
      {
        id: 'feedback-integration',
        name: 'Feedback Integration',
        type: 'on-demand',
        status: activeRules.some(r => r.id.startsWith('feedback-integration:')) ? 'active' : 'inactive',
        ruleCount: activeRules.filter(r => r.id.startsWith('feedback-integration:')).length,
      },
      {
        id: 'code-quality-development',
        name: 'Code Quality Development',
        type: 'on-demand',
        status: activeRules.some(r => r.id.startsWith('code-quality-development:')) ? 'active' : 'inactive',
        ruleCount: activeRules.filter(r => r.id.startsWith('code-quality-development:')).length,
      },
    ];
    
    return ruleSets;
  } catch (error) {
    console.error('Error listing rule sets:', error);
    return [];
  }
}

/**
 * Load configuration
 */
async function loadConfig(env: any): Promise<void> {
  try {
    console.log('Loading configuration...');
    
    // Try to load from KV
    const configStr = await env.FRAMEWORK_KV?.get('config');
    
    if (configStr) {
      frameworkConfig = JSON.parse(configStr);
    } else {
      // Create default configuration
      frameworkConfig = {
        enabled: true,
        version: '1.0.0',
        monitoring: {
          enabled: true,
          interval: 60000, // 1 minute
        },
        rules: {
          core: ['core-agent-behavior'],
          enhancement: ['rule-prioritization', 'context-retention'],
          onDemand: ['feedback-integration', 'code-quality-development'],
        },
        feedback: {
          enabled: true,
          storageLimit: 100,
        },
      };
      
      // Save default configuration
      await saveConfig(env);
    }
  } catch (error) {
    console.error('Error loading configuration:', error);
    
    // Create default configuration
    frameworkConfig = {
      enabled: true,
      version: '1.0.0',
      monitoring: {
        enabled: true,
        interval: 60000, // 1 minute
      },
      rules: {
        core: ['core-agent-behavior'],
        enhancement: ['rule-prioritization', 'context-retention'],
        onDemand: ['feedback-integration', 'code-quality-development'],
      },
      feedback: {
        enabled: true,
        storageLimit: 100,
      },
    };
  }
}

/**
 * Save configuration
 */
async function saveConfig(env: any): Promise<void> {
  try {
    console.log('Saving configuration...');
    
    if (frameworkConfig) {
      await env.FRAMEWORK_KV?.put('config', JSON.stringify(frameworkConfig));
    }
  } catch (error) {
    console.error('Error saving configuration:', error);
  }
} 