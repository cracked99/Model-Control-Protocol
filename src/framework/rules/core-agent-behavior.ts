/**
 * Core Agent Behavior Rules
 * 
 * This rule set defines the fundamental behavior patterns for the agent,
 * including response formatting, decision-making processes, and interaction protocols.
 */

import { Rule, RuleContext, RuleResult } from '../types';

/**
 * Ensures responses are concise and direct
 */
export const conciseResponseRule: Rule = {
  id: 'core-agent-behavior:concise-response',
  name: 'Concise Response',
  description: 'Ensures agent responses are concise, direct, and to the point',
  priority: 100,
  
  execute: async (context: RuleContext): Promise<RuleResult> => {
    // This rule would typically modify the response generation process
    // In a real implementation, it would analyze and trim verbose content
    
    return {
      success: true,
      modified: false, // In a real implementation, this would be true if the response was modified
      message: 'Applied concise response formatting'
    };
  }
};

/**
 * Ensures consistent tone in responses
 */
export const consistentToneRule: Rule = {
  id: 'core-agent-behavior:consistent-tone',
  name: 'Consistent Tone',
  description: 'Maintains a consistent professional tone in all communications',
  priority: 90,
  
  execute: async (context: RuleContext): Promise<RuleResult> => {
    // This rule would analyze and adjust the tone of responses
    
    return {
      success: true,
      modified: false,
      message: 'Applied consistent tone formatting'
    };
  }
};

/**
 * Adds contextual awareness to responses
 */
export const contextAwarenessRule: Rule = {
  id: 'core-agent-behavior:context-awareness',
  name: 'Context Awareness',
  description: 'Ensures responses consider the full conversation context',
  priority: 95,
  
  execute: async (context: RuleContext): Promise<RuleResult> => {
    // This rule would analyze conversation history to ensure contextual relevance
    
    return {
      success: true,
      modified: false,
      message: 'Applied context awareness to response'
    };
  }
};

/**
 * Ensures responses are helpful and actionable
 */
export const helpfulnessRule: Rule = {
  id: 'core-agent-behavior:helpfulness',
  name: 'Helpfulness',
  description: 'Ensures responses are helpful and provide actionable information',
  priority: 85,
  
  execute: async (context: RuleContext): Promise<RuleResult> => {
    // This rule would analyze responses to ensure they provide value
    
    return {
      success: true,
      modified: false,
      message: 'Applied helpfulness check to response'
    };
  }
};

// Export all rules as a collection
export const rules: Rule[] = [
  conciseResponseRule,
  consistentToneRule,
  contextAwarenessRule,
  helpfulnessRule
];

// Export default rule set metadata
export default {
  id: 'core-agent-behavior',
  name: 'Core Agent Behavior',
  description: 'Fundamental behavior patterns for the agent',
  version: '1.0.0',
  rules
}; 