/**
 * Rule Engine Implementation
 */

import { v4 as uuidv4 } from 'uuid';
import { Rule, RuleType, RuleContext, RuleResult } from '../types';

// Import rule sets
import coreAgentBehavior from '../rules/core-agent-behavior';
import rulePrioritization from '../rules/rule-prioritization';
import contextRetention from '../rules/context-retention';

// Define the structure for rule data
interface RuleData {
  content?: string;
  type: RuleType;
  version: string;
  dependencies: string[];
  triggers: string[];
}

// Map of core rule sets
const CORE_RULE_SETS: Record<string, any> = {
  'core-agent-behavior': coreAgentBehavior,
  'rule-prioritization': rulePrioritization,
  'context-retention': contextRetention,
};

// Map of on-demand rule sets (to be loaded from actual files in a full implementation)
const ON_DEMAND_RULE_SETS: Record<string, RuleData> = {
  'code-quality-development': {
    type: 'on-demand' as RuleType,
    version: '1.0.0',
    dependencies: [],
    triggers: ['code_implementation', 'code_review', 'refactoring'],
  },
  'architectural-guidelines': {
    type: 'on-demand' as RuleType,
    version: '1.0.0',
    dependencies: [],
    triggers: ['system_design', 'architecture_planning', 'structural_changes'],
  },
};

// Rule engine class
class RuleEngine {
  private activeRules: Map<string, Rule> = new Map();
  private ruleCache: Map<string, Rule> = new Map();
  private prioritization: RulePrioritization;
  
  constructor() {
    this.prioritization = new RulePrioritization();
  }
  
  async initialize(env: any): Promise<{ status: string }> {
    console.log('Initializing Rule Engine...');
    
    // Initialize rule prioritization
    await this.prioritization.initialize(env);
    
    return { status: 'success' };
  }
  
  async loadAlwaysActiveRules(env: any): Promise<Rule[]> {
    console.log('Loading always-active rules...');
    
    const loadedRules: Rule[] = [];
    
    // Load core rule sets
    for (const [name, ruleSet] of Object.entries(CORE_RULE_SETS)) {
      // Add each rule from the rule set
      for (const rule of ruleSet.rules) {
        this.activeRules.set(rule.id, rule);
        loadedRules.push(rule);
      }
    }
    
    // Register rules with prioritization system
    await this.prioritization.registerRules(env, loadedRules);
    
    console.log(`Loaded ${loadedRules.length} always-active rules`);
    return loadedRules;
  }
  
  async loadOnDemandRules(env: any, triggers: string[]): Promise<Rule[]> {
    console.log(`Loading on-demand rules for triggers: ${triggers.join(', ')}...`);
    
    const ruleSetsToLoad = this.determineRuleSetsToLoad(triggers);
    const loadedRules: Rule[] = [];
    
    for (const ruleSetName of ruleSetsToLoad) {
      // In a full implementation, we would dynamically import the rule set file
      // For now, we'll just create placeholder rules
      const ruleSetData = ON_DEMAND_RULE_SETS[ruleSetName];
      if (ruleSetData) {
        const rule = this.createPlaceholderRule(ruleSetName, ruleSetData);
        if (!this.activeRules.has(rule.id)) {
          this.activeRules.set(rule.id, rule);
          loadedRules.push(rule);
        }
      }
    }
    
    // Register rules with prioritization system
    if (loadedRules.length > 0) {
      await this.prioritization.registerRules(env, loadedRules);
    }
    
    console.log(`Loaded ${loadedRules.length} on-demand rules`);
    return loadedRules;
  }
  
  async unloadRule(env: any, ruleName: string): Promise<boolean> {
    // Find rules that belong to the specified rule set
    const rulesToUnload = Array.from(this.activeRules.values())
      .filter(rule => rule.id.startsWith(`${ruleName}:`));
    
    if (rulesToUnload.length > 0) {
      for (const rule of rulesToUnload) {
        this.activeRules.delete(rule.id);
        await this.prioritization.unregisterRule(env, rule.id);
      }
      return true;
    }
    return false;
  }
  
  async getActiveRules(): Promise<Rule[]> {
    return Array.from(this.activeRules.values());
  }
  
  async applyRules(request: any, context: any): Promise<any> {
    // Create rule context
    const ruleContext: RuleContext = {
      requestId: request.id,
      sessionId: request.sessionId,
      request,
      data: { ...context }
    };
    
    // Get active rules in priority order
    const rules = await this.prioritization.getPrioritizedRules(Array.from(this.activeRules.values()));
    
    // Apply each rule to the request
    let modified = false;
    
    for (const rule of rules) {
      try {
        console.log(`Applying rule: ${rule.name}`);
        
        // Execute the rule
        const result = await rule.execute(ruleContext);
        
        // Update modified flag
        if (result.modified) {
          modified = true;
        }
        
        // Record rule application for effectiveness tracking
        await this.prioritization.recordRuleApplication(rule.id);
        
      } catch (error) {
        console.error(`Error applying rule ${rule.name}:`, error);
      }
    }
    
    return {
      ...request,
      modified,
      context: ruleContext.data
    };
  }
  
  private determineRuleSetsToLoad(triggers: string[]): string[] {
    const ruleSetsToLoad: string[] = [];
    
    for (const [ruleSetName, ruleSetData] of Object.entries(ON_DEMAND_RULE_SETS)) {
      // Check if any trigger matches
      if (ruleSetData.triggers.some(trigger => triggers.includes(trigger))) {
        ruleSetsToLoad.push(ruleSetName);
      }
    }
    
    return ruleSetsToLoad;
  }
  
  private createPlaceholderRule(ruleSetName: string, ruleData: RuleData): Rule {
    const rule: Rule = {
      id: `${ruleSetName}:placeholder`,
      name: `${ruleSetName} (Placeholder)`,
      description: `Placeholder for ${ruleSetName} rule set`,
      type: ruleData.type,
      priority: 50,
      
      execute: async (context: RuleContext): Promise<RuleResult> => {
        return {
          success: true,
          modified: false,
          message: `Executed placeholder for ${ruleSetName}`
        };
      }
    };
    
    return rule;
  }
}

/**
 * Rule prioritization system
 */
class RulePrioritization {
  private effectivenessScores: Map<string, number> = new Map();
  
  async initialize(env: any): Promise<void> {
    console.log('Initializing Rule Prioritization...');
    
    // Load effectiveness scores from KV
    try {
      const scoresStr = await env.FRAMEWORK_KV?.get('rule_effectiveness');
      if (scoresStr) {
        const scores = JSON.parse(scoresStr);
        this.effectivenessScores = new Map(Object.entries(scores));
      }
    } catch (error) {
      console.error('Error loading rule effectiveness scores:', error);
    }
  }
  
  async registerRules(env: any, rules: Rule[]): Promise<void> {
    for (const rule of rules) {
      if (!this.effectivenessScores.has(rule.id)) {
        this.effectivenessScores.set(rule.id, 1.0); // Default score
      }
    }
    
    // Save updated scores
    await this.saveEffectivenessScores(env);
  }
  
  async unregisterRule(env: any, ruleId: string): Promise<void> {
    // We don't remove effectiveness scores to maintain history
    // Just update the KV store
    await this.saveEffectivenessScores(env);
  }
  
  async recordRuleApplication(ruleId: string): Promise<void> {
    // In a real implementation, we would track success/failure
    // and adjust scores accordingly
  }
  
  async recordRuleEffectiveness(env: any, ruleId: string, effectiveness: number): Promise<void> {
    // Update effectiveness score
    const currentScore = this.effectivenessScores.get(ruleId) || 1.0;
    const newScore = currentScore * 0.9 + effectiveness * 0.1; // Simple moving average
    this.effectivenessScores.set(ruleId, newScore);
    
    // Save updated scores
    await this.saveEffectivenessScores(env);
  }
  
  async getPrioritizedRules(rules: Rule[]): Promise<Rule[]> {
    // Sort rules by priority first, then by effectiveness score for tiebreakers
    return [...rules].sort((a, b) => {
      // Higher priority first
      if (a.priority !== b.priority) {
        return b.priority - a.priority;
      }
      
      // If same priority, use effectiveness score
      const scoreA = this.effectivenessScores.get(a.id) || 1.0;
      const scoreB = this.effectivenessScores.get(b.id) || 1.0;
      return scoreB - scoreA;
    });
  }
  
  private async saveEffectivenessScores(env: any): Promise<void> {
    try {
      const scores = Object.fromEntries(this.effectivenessScores);
      await env.FRAMEWORK_KV?.put('rule_effectiveness', JSON.stringify(scores));
    } catch (error) {
      console.error('Error saving rule effectiveness scores:', error);
    }
  }
}

// Export singleton instance
const ruleEngine = new RuleEngine();
export const initialize = ruleEngine.initialize.bind(ruleEngine);
export const loadAlwaysActiveRules = ruleEngine.loadAlwaysActiveRules.bind(ruleEngine);
export const loadOnDemandRules = ruleEngine.loadOnDemandRules.bind(ruleEngine);
export const unloadRule = ruleEngine.unloadRule.bind(ruleEngine);
export const getActiveRules = ruleEngine.getActiveRules.bind(ruleEngine);
export const applyRules = ruleEngine.applyRules.bind(ruleEngine); 