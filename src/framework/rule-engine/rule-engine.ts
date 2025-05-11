/**
 * Rule Engine Implementation
 */

import { Rule } from '../types';
import * as coreRules from '../rules/core-rules';
import * as enhancementRules from '../rules/enhancement-rules';
import * as feedbackRules from '../rules/feedback-integration';

// Rule sets
const CORE_RULE_SETS = ['core-agent-behavior', 'rule-prioritization', 'context-retention'];
const ENHANCEMENT_RULE_SETS = ['rule-prioritization', 'context-retention'];
const ON_DEMAND_RULE_SETS = ['feedback-integration', 'code-quality-development'];

// Active rules
const activeRules: Rule[] = [];

/**
 * Initialize the rule engine
 */
export async function initialize(env: any): Promise<void> {
  console.log('Initializing Rule Engine...');
  
  try {
    // Clear active rules
    activeRules.length = 0;
    
    // Load core rules
    await loadCoreRules(env);
    
    console.log(`Rule Engine initialized with ${activeRules.length} rules.`);
  } catch (error) {
    console.error('Error initializing rule engine:', error);
    throw error;
  }
}

/**
 * Load core rules
 */
async function loadCoreRules(env: any): Promise<Rule[]> {
  try {
    console.log('Loading core rules...');
    
    // Get core rules
    const rules = coreRules.getRules();
    
    // Add to active rules
    for (const rule of rules) {
      activeRules.push(rule);
    }
    
    // Load enhancement rules
    await loadEnhancementRules(env);
    
    return rules;
  } catch (error) {
    console.error('Error loading core rules:', error);
    throw error;
  }
}

/**
 * Load enhancement rules
 */
async function loadEnhancementRules(env: any): Promise<Rule[]> {
  try {
    console.log('Loading enhancement rules...');
    
    // Get enhancement rules
    const rules = enhancementRules.getRules();
    
    // Add to active rules
    for (const rule of rules) {
      activeRules.push(rule);
    }
    
    return rules;
  } catch (error) {
    console.error('Error loading enhancement rules:', error);
    throw error;
  }
}

/**
 * Load a rule set
 */
export async function loadRuleSet(env: any, ruleSetId: string): Promise<boolean> {
  try {
    console.log(`Loading rule set: ${ruleSetId}`);
    
    // Check if rule set is valid
    if (!ON_DEMAND_RULE_SETS.includes(ruleSetId)) {
      console.error(`Invalid rule set: ${ruleSetId}`);
      return false;
    }
    
    // Check if already loaded
    if (isRuleSetLoaded(ruleSetId)) {
      console.log(`Rule set ${ruleSetId} already loaded.`);
      return true;
    }
    
    // Load rule set
    let rules: Rule[] = [];
    
    if (ruleSetId === 'feedback-integration') {
      rules = feedbackRules.getRules();
    } else if (ruleSetId === 'code-quality-development') {
      // Load code quality rules
      try {
        const codeQualityRules = await import('../rules/code-quality-development');
        rules = codeQualityRules.rules;
      } catch (error) {
        console.error('Error loading code quality rules:', error);
        return false;
      }
    }
    
    // Add to active rules
    for (const rule of rules) {
      activeRules.push(rule);
    }
    
    console.log(`Loaded ${rules.length} rules from ${ruleSetId}.`);
    
    return true;
  } catch (error) {
    console.error(`Error loading rule set ${ruleSetId}:`, error);
    return false;
  }
}

/**
 * Unload a rule set
 */
export async function unloadRuleSet(env: any, ruleSetId: string): Promise<boolean> {
  try {
    console.log(`Unloading rule set: ${ruleSetId}`);
    
    // Check if rule set is valid
    if (!ON_DEMAND_RULE_SETS.includes(ruleSetId)) {
      console.error(`Invalid rule set: ${ruleSetId}`);
      return false;
    }
    
    // Check if loaded
    if (!isRuleSetLoaded(ruleSetId)) {
      console.log(`Rule set ${ruleSetId} not loaded.`);
      return true;
    }
    
    // Remove rules from active rules
    const prefix = `${ruleSetId}:`;
    const initialCount = activeRules.length;
    
    for (let i = activeRules.length - 1; i >= 0; i--) {
      if (activeRules[i].id.startsWith(prefix)) {
        activeRules.splice(i, 1);
      }
    }
    
    const removedCount = initialCount - activeRules.length;
    console.log(`Unloaded ${removedCount} rules from ${ruleSetId}.`);
    
    return true;
  } catch (error) {
    console.error(`Error unloading rule set ${ruleSetId}:`, error);
    return false;
  }
}

/**
 * Check if a rule set is loaded
 */
function isRuleSetLoaded(ruleSetId: string): boolean {
  const prefix = `${ruleSetId}:`;
  return activeRules.some(rule => rule.id.startsWith(prefix));
}

/**
 * Get active rules
 */
export function getActiveRules(): Rule[] {
  return [...activeRules];
}

/**
 * Apply rules to a request
 */
export async function applyRules(env: any, request: any, context: any): Promise<any> {
  try {
    console.log(`Applying rules to request: ${request.id}`);
    
    // Sort rules by priority
    const sortedRules = [...activeRules].sort((a, b) => b.priority - a.priority);
    
    // Apply rules
    let result = { ...request };
    
    for (const rule of sortedRules) {
      try {
        // Check if rule applies
        if (rule.condition(request, context)) {
          // Apply rule
          result = await rule.action(result, context);
        }
      } catch (error) {
        console.error(`Error applying rule ${rule.id}:`, error);
      }
    }
    
    return result;
  } catch (error) {
    console.error('Error applying rules:', error);
    return request;
  }
}

/**
 * Rule Prioritization
 */
class RulePrioritization {
  private static instance: RulePrioritization;
  private effectivenessScores: Map<string, number> = new Map();
  private priorityAdjustments: Map<string, number> = new Map();
  
  private constructor() {}
  
  static getInstance(): RulePrioritization {
    if (!RulePrioritization.instance) {
      RulePrioritization.instance = new RulePrioritization();
    }
    
    return RulePrioritization.instance;
  }
  
  async initialize(env: any): Promise<void> {
    try {
      // Load effectiveness scores from KV
      const scoresStr = await env.FRAMEWORK_KV?.get('rule_effectiveness');
      
      if (scoresStr) {
        const scores = JSON.parse(scoresStr);
        this.effectivenessScores = new Map(Object.entries(scores));
      }
      
      // Load priority adjustments from KV
      const adjustmentsStr = await env.FRAMEWORK_KV?.get('rule_priority_adjustments');
      
      if (adjustmentsStr) {
        const adjustments = JSON.parse(adjustmentsStr);
        this.priorityAdjustments = new Map(Object.entries(adjustments));
      }
    } catch (error) {
      console.error('Error initializing rule prioritization:', error);
    }
  }
  
  async updateEffectivenessScore(env: any, ruleId: string, score: number): Promise<void> {
    try {
      // Get current score
      const currentScore = this.effectivenessScores.get(ruleId) || 0;
      
      // Update score (moving average)
      const newScore = currentScore * 0.9 + score * 0.1;
      this.effectivenessScores.set(ruleId, newScore);
      
      // Save scores
      await this.saveEffectivenessScores(env);
      
      // Adjust priority if score changes significantly
      if (Math.abs(newScore - currentScore) > 0.2) {
        this.adjustRulePriority(ruleId, newScore);
      }
    } catch (error) {
      console.error(`Error updating effectiveness score for rule ${ruleId}:`, error);
    }
  }
  
  adjustRulePriority(ruleId: string, score: number): void {
    try {
      // Find rule
      const rule = activeRules.find(r => r.id === ruleId);
      
      if (!rule) {
        return;
      }
      
      // Calculate priority adjustment
      let adjustment = 0;
      
      if (score > 0.8) {
        adjustment = 1;
      } else if (score < 0.3) {
        adjustment = -1;
      }
      
      // Update priority adjustment
      const currentAdjustment = this.priorityAdjustments.get(ruleId) || 0;
      const newAdjustment = Math.max(-2, Math.min(2, currentAdjustment + adjustment));
      
      if (newAdjustment !== currentAdjustment) {
        this.priorityAdjustments.set(ruleId, newAdjustment);
        
        // Apply adjustment to rule
        rule.priority += (newAdjustment - currentAdjustment);
      }
    } catch (error) {
      console.error(`Error adjusting priority for rule ${ruleId}:`, error);
    }
  }
  
  async saveEffectivenessScores(env: any): Promise<void> {
    try {
      // Convert map to object
      const scores = Object.fromEntries(this.effectivenessScores);
      
      // Save to KV
      await env.FRAMEWORK_KV?.put('rule_effectiveness', JSON.stringify(scores));
    } catch (error) {
      console.error('Error saving effectiveness scores:', error);
    }
  }
  
  async savePriorityAdjustments(env: any): Promise<void> {
    try {
      // Convert map to object
      const adjustments = Object.fromEntries(this.priorityAdjustments);
      
      // Save to KV
      await env.FRAMEWORK_KV?.put('rule_priority_adjustments', JSON.stringify(adjustments));
    } catch (error) {
      console.error('Error saving priority adjustments:', error);
    }
  }
}

/**
 * Rule set determination
 */
export function determineRuleSetsToLoad(request: any): string[] {
  try {
    const ruleSets: string[] = [];
    
    // Always include core rule sets
    ruleSets.push(...CORE_RULE_SETS);
    
    // Check for user interaction (always load feedback integration)
    if (request.command && request.sessionId) {
      ruleSets.push('feedback-integration');
    }
    
    // Check for code-related requests
    if (request.command && (
      request.command.includes('code') ||
      request.command.includes('function') ||
      request.command.includes('class') ||
      request.command.includes('implement')
    )) {
      ruleSets.push('code-quality-development');
    }
    
    return ruleSets;
  } catch (error) {
    console.error('Error determining rule sets to load:', error);
    return CORE_RULE_SETS;
  }
} 