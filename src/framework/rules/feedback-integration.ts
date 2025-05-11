/**
 * Feedback Integration Rules
 * 
 * This rule set defines how user feedback is captured, processed,
 * and integrated into the agent's behavior for continuous improvement.
 */

import { Rule, RuleContext, RuleResult } from '../types';

/**
 * Captures explicit user feedback
 */
export const explicitFeedbackCapture: Rule = {
  id: 'feedback-integration:explicit-capture',
  name: 'Explicit Feedback Capture',
  description: 'Captures explicit feedback from the user',
  priority: 175,
  
  execute: async (context: RuleContext): Promise<RuleResult> => {
    // Skip if there's no request to process
    if (!context.request || !context.request.content) {
      return {
        success: true,
        modified: false,
        message: 'No request to analyze for feedback'
      };
    }
    
    // Process request for explicit feedback patterns
    const requestContent = context.request.content.toLowerCase();
    
    // Check for explicit feedback markers
    const positiveIndicators = [
      'good job', 'thanks', 'that works', 'helpful', 'perfect', 
      'awesome', 'excellent', 'great', 'well done'
    ];
    
    const negativeIndicators = [
      'not what I asked', 'wrong', 'incorrect', 'not helpful',
      'doesn\'t work', 'bad', 'poor', 'confused', 'misunderstood'
    ];
    
    // Detect feedback and score it (simple implementation)
    let feedbackDetected = false;
    let feedbackScore = 0;
    let feedbackType = '';
    
    // Check for positive feedback
    for (const indicator of positiveIndicators) {
      if (requestContent.includes(indicator)) {
        feedbackDetected = true;
        feedbackScore = 1;
        feedbackType = 'positive';
        break;
      }
    }
    
    // Check for negative feedback if no positive was found
    if (!feedbackDetected) {
      for (const indicator of negativeIndicators) {
        if (requestContent.includes(indicator)) {
          feedbackDetected = true;
          feedbackScore = -1;
          feedbackType = 'negative';
          break;
        }
      }
    }
    
    // If feedback was detected, store it in the context
    if (feedbackDetected) {
      if (!context.data.feedback) {
        context.data.feedback = [];
      }
      
      context.data.feedback.push({
        timestamp: new Date().toISOString(),
        type: feedbackType,
        score: feedbackScore,
        content: context.request.content
      });
      
      return {
        success: true,
        modified: true,
        message: `Captured ${feedbackType} feedback`,
        data: {
          feedbackType,
          feedbackScore
        }
      };
    }
    
    return {
      success: true,
      modified: false,
      message: 'No explicit feedback detected'
    };
  }
};

/**
 * Captures implicit user feedback
 */
export const implicitFeedbackCapture: Rule = {
  id: 'feedback-integration:implicit-capture',
  name: 'Implicit Feedback Capture',
  description: 'Infers implicit feedback from user interactions',
  priority: 170,
  
  execute: async (context: RuleContext): Promise<RuleResult> => {
    // Skip if there's no request to process
    if (!context.request || !context.request.content) {
      return {
        success: true,
        modified: false,
        message: 'No request to analyze for implicit feedback'
      };
    }
    
    // Check if we have previous interactions to analyze
    if (!context.data.interactions || context.data.interactions.length < 2) {
      return {
        success: true,
        modified: false,
        message: 'Not enough interaction history for implicit feedback analysis'
      };
    }
    
    // Analyze patterns that suggest implicit feedback
    const requestContent = context.request.content.toLowerCase();
    
    // Pattern 1: User repeats the same question/request -> negative implicit feedback
    const previousRequest = context.data.interactions[context.data.interactions.length - 1].request;
    const similarityScore = calculateTextSimilarity(previousRequest, context.request.content);
    
    if (similarityScore > 0.8) {
      // High similarity suggests the user is repeating themselves - negative feedback
      if (!context.data.feedback) {
        context.data.feedback = [];
      }
      
      context.data.feedback.push({
        timestamp: new Date().toISOString(),
        type: 'implicit_negative',
        score: -0.5,
        content: 'User repeated a similar request, suggesting the previous response was not satisfactory',
        similarityScore
      });
      
      return {
        success: true,
        modified: true,
        message: 'Captured implicit negative feedback from repeated request',
        data: {
          feedbackType: 'implicit_negative',
          feedbackScore: -0.5,
          similarityScore
        }
      };
    }
    
    // Pattern 2: User continues the conversation without correction -> positive implicit feedback
    const conversationContinuationIndicators = [
      'and', 'also', 'next', 'now', 'then', 'additionally',
      'furthermore', 'moreover', 'continue', 'proceed'
    ];
    
    for (const indicator of conversationContinuationIndicators) {
      if (requestContent.startsWith(indicator) || requestContent.includes(` ${indicator} `)) {
        if (!context.data.feedback) {
          context.data.feedback = [];
        }
        
        context.data.feedback.push({
          timestamp: new Date().toISOString(),
          type: 'implicit_positive',
          score: 0.3,
          content: 'User continued the conversation without correction, suggesting the previous response was satisfactory'
        });
        
        return {
          success: true,
          modified: true,
          message: 'Captured implicit positive feedback from conversation continuation',
          data: {
            feedbackType: 'implicit_positive',
            feedbackScore: 0.3
          }
        };
      }
    }
    
    return {
      success: true,
      modified: false,
      message: 'No implicit feedback patterns detected'
    };
  }
};

/**
 * Applies feedback to adjust rule priorities
 */
export const feedbackPrioritization: Rule = {
  id: 'feedback-integration:prioritization',
  name: 'Feedback-Based Prioritization',
  description: 'Adjusts rule priorities based on feedback',
  priority: 185,
  
  execute: async (context: RuleContext): Promise<RuleResult> => {
    // Skip if no feedback data exists
    if (!context.data.feedback || context.data.feedback.length === 0) {
      return {
        success: true,
        modified: false,
        message: 'No feedback data available for priority adjustment'
      };
    }
    
    // Process recent feedback to determine priority adjustments
    const recentFeedback = context.data.feedback.slice(-5); // Last 5 feedback items
    
    // Calculate aggregate feedback score
    let aggregateScore = 0;
    for (const feedback of recentFeedback) {
      aggregateScore += feedback.score;
    }
    
    // Normalize score
    const normalizedScore = aggregateScore / recentFeedback.length;
    
    // Store the priority adjustment factor in context
    if (!context.data.priorityAdjustments) {
      context.data.priorityAdjustments = {};
    }
    
    // Different adjustments based on feedback type
    if (normalizedScore > 0.3) {
      // Positive feedback: strengthen current behavior
      context.data.priorityAdjustments.factor = 1.2; // Increase priorities by 20%
      
      return {
        success: true,
        modified: true,
        message: 'Applied positive feedback to increase behavior reinforcement',
        data: {
          adjustmentFactor: 1.2,
          normalizedScore
        }
      };
    } else if (normalizedScore < -0.3) {
      // Negative feedback: modify behavior
      context.data.priorityAdjustments.factor = 0.8; // Decrease priorities by 20%
      
      return {
        success: true,
        modified: true,
        message: 'Applied negative feedback to encourage behavior adaptation',
        data: {
          adjustmentFactor: 0.8,
          normalizedScore
        }
      };
    }
    
    // Neutral feedback: no significant changes
    context.data.priorityAdjustments.factor = 1.0;
    
    return {
      success: true,
      modified: false,
      message: 'Neutral feedback applied, no priority adjustments needed',
      data: {
        adjustmentFactor: 1.0,
        normalizedScore
      }
    };
  }
};

/**
 * Analyzes feedback trends over time
 */
export const feedbackTrendAnalysis: Rule = {
  id: 'feedback-integration:trend-analysis',
  name: 'Feedback Trend Analysis',
  description: 'Analyzes feedback trends to identify patterns over time',
  priority: 160,
  
  execute: async (context: RuleContext): Promise<RuleResult> => {
    // Skip if limited feedback data exists
    if (!context.data.feedback || context.data.feedback.length < 5) {
      return {
        success: true,
        modified: false,
        message: 'Insufficient feedback data for trend analysis'
      };
    }
    
    // Analyze feedback trends over time
    const feedbackHistory = context.data.feedback;
    const trendResults = analyzeFeedbackTrends(feedbackHistory);
    
    // Store trend analysis in context
    if (!context.data.feedbackAnalysis) {
      context.data.feedbackAnalysis = {};
    }
    
    context.data.feedbackAnalysis.trends = trendResults;
    
    return {
      success: true,
      modified: true,
      message: 'Completed feedback trend analysis',
      data: trendResults
    };
  }
};

// Helper function to calculate text similarity (simplified)
function calculateTextSimilarity(text1: string, text2: string): number {
  if (!text1 || !text2) return 0;
  
  // Convert to lowercase for comparison
  const a = text1.toLowerCase();
  const b = text2.toLowerCase();
  
  // Very simple similarity measure using character overlap
  // In a real implementation, this would use more sophisticated algorithms
  
  // Count common characters
  const setA = new Set(a);
  const setB = new Set(b);
  const intersection = new Set([...setA].filter(x => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  
  // Jaccard similarity
  return intersection.size / union.size;
}

// Helper function to analyze feedback trends
function analyzeFeedbackTrends(feedbackHistory: any[]): any {
  // Sort feedback by timestamp
  const sortedFeedback = [...feedbackHistory].sort((a, b) => 
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
  
  // Divide into time periods for analysis
  const periods = divideIntoPeriods(sortedFeedback, 5); // 5 periods
  
  // Calculate average scores per period
  const periodAverages = periods.map(periodFeedback => {
    const sum = periodFeedback.reduce((acc, item) => acc + item.score, 0);
    return {
      average: periodFeedback.length > 0 ? sum / periodFeedback.length : 0,
      count: periodFeedback.length
    };
  });
  
  // Calculate trend direction
  let trendDirection = 'stable';
  if (periods.length >= 2) {
    const firstAvg = periodAverages[0].average;
    const lastAvg = periodAverages[periodAverages.length - 1].average;
    const difference = lastAvg - firstAvg;
    
    if (difference > 0.2) trendDirection = 'improving';
    else if (difference < -0.2) trendDirection = 'declining';
  }
  
  return {
    periodAverages,
    trendDirection,
    overallAverage: calculateOverallAverage(sortedFeedback),
    positiveFeedbackPercentage: calculatePositivePercentage(sortedFeedback)
  };
}

// Helper function to divide feedback into equal time periods
function divideIntoPeriods(sortedFeedback: any[], numPeriods: number): any[][] {
  if (sortedFeedback.length === 0) return [];
  
  const result: any[][] = Array(numPeriods).fill(null).map(() => []);
  
  // Get time range
  const firstTime = new Date(sortedFeedback[0].timestamp).getTime();
  const lastTime = new Date(sortedFeedback[sortedFeedback.length - 1].timestamp).getTime();
  const timeRange = lastTime - firstTime;
  
  // Calculate period size
  const periodSize = timeRange / numPeriods;
  
  // Distribute feedback into periods
  for (const feedback of sortedFeedback) {
    const feedbackTime = new Date(feedback.timestamp).getTime();
    const periodIndex = Math.min(
      Math.floor((feedbackTime - firstTime) / periodSize),
      numPeriods - 1
    );
    result[periodIndex].push(feedback);
  }
  
  return result;
}

// Helper function to calculate overall average feedback score
function calculateOverallAverage(feedbackHistory: any[]): number {
  if (feedbackHistory.length === 0) return 0;
  
  const sum = feedbackHistory.reduce((acc, item) => acc + item.score, 0);
  return sum / feedbackHistory.length;
}

// Helper function to calculate percentage of positive feedback
function calculatePositivePercentage(feedbackHistory: any[]): number {
  if (feedbackHistory.length === 0) return 0;
  
  const positiveCount = feedbackHistory.filter(item => item.score > 0).length;
  return (positiveCount / feedbackHistory.length) * 100;
}

// Export all rules as a collection
export const rules: Rule[] = [
  explicitFeedbackCapture,
  implicitFeedbackCapture,
  feedbackPrioritization,
  feedbackTrendAnalysis
];

// Export default rule set metadata
export default {
  id: 'feedback-integration',
  name: 'Feedback Integration',
  description: 'Controls how user feedback is captured and integrated',
  version: '1.0.0',
  rules
};

/**
 * Feedback Integration Rules Implementation
 */

import { Rule } from '../types';

/**
 * Get feedback integration rules
 */
export function getRules(): Rule[] {
  return [
    // Feedback Collection Rules
    {
      id: 'feedback-integration:feedback-collection',
      name: 'Feedback Collection',
      type: 'on-demand',
      priority: 90,
      description: 'Collects feedback from users',
      condition: (request, context) => {
        // Apply if the request is a feedback request
        return request.command?.toLowerCase().includes('feedback') ||
               request.command?.toLowerCase().includes('rate') ||
               request.command?.toLowerCase().includes('review');
      },
      action: async (request, context) => {
        // This would handle feedback collection
        return request;
      },
    },
    {
      id: 'feedback-integration:feedback-prompt',
      name: 'Feedback Prompt',
      type: 'on-demand',
      priority: 85,
      description: 'Prompts users for feedback after interactions',
      condition: (request, context) => {
        // Apply if this is the end of a conversation or a complex request
        return request.command?.toLowerCase().includes('thank') ||
               request.command?.toLowerCase().includes('bye') ||
               (context?.data?.responses && context.data.responses.length > 5);
      },
      action: async (request, context) => {
        // This would add a feedback prompt to the response
        return request;
      },
    },
    
    // Feedback Analysis Rules
    {
      id: 'feedback-integration:sentiment-analysis',
      name: 'Sentiment Analysis',
      type: 'on-demand',
      priority: 80,
      description: 'Analyzes sentiment in feedback',
      condition: (request, context) => {
        // Apply if there is feedback in the context
        return context?.data?.feedback && context.data.feedback.length > 0;
      },
      action: async (request, context) => {
        // This would analyze sentiment in feedback
        return request;
      },
    },
    {
      id: 'feedback-integration:feedback-categorization',
      name: 'Feedback Categorization',
      type: 'on-demand',
      priority: 75,
      description: 'Categorizes feedback into different types',
      condition: (request, context) => {
        // Apply if there is feedback in the context
        return context?.data?.feedback && context.data.feedback.length > 0;
      },
      action: async (request, context) => {
        // This would categorize feedback
        return request;
      },
    },
    
    // Feedback Integration Rules
    {
      id: 'feedback-integration:rule-adjustment',
      name: 'Rule Adjustment',
      type: 'on-demand',
      priority: 70,
      description: 'Adjusts rules based on feedback',
      condition: (request, context) => {
        // Apply if there is feedback in the context
        return context?.data?.feedback && context.data.feedback.length > 0;
      },
      action: async (request, context) => {
        // This would adjust rules based on feedback
        return request;
      },
    },
    {
      id: 'feedback-integration:response-improvement',
      name: 'Response Improvement',
      type: 'on-demand',
      priority: 65,
      description: 'Improves responses based on feedback',
      condition: (request, context) => {
        // Apply if there is feedback in the context
        return context?.data?.feedback && context.data.feedback.length > 0;
      },
      action: async (request, context) => {
        // This would improve responses based on feedback
        return request;
      },
    },
    
    // Feedback Reporting Rules
    {
      id: 'feedback-integration:feedback-summary',
      name: 'Feedback Summary',
      type: 'on-demand',
      priority: 60,
      description: 'Summarizes feedback for reporting',
      condition: (request, context) => {
        // Apply if the request is for a feedback summary
        return request.command?.toLowerCase().includes('feedback summary') ||
               request.command?.toLowerCase().includes('summarize feedback');
      },
      action: async (request, context) => {
        // This would summarize feedback
        return request;
      },
    },
    {
      id: 'feedback-integration:feedback-trends',
      name: 'Feedback Trends',
      type: 'on-demand',
      priority: 55,
      description: 'Identifies trends in feedback',
      condition: (request, context) => {
        // Apply if there is enough feedback for trend analysis
        return context?.data?.feedback && context.data.feedback.length >= 5;
      },
      action: async (request, context) => {
        // This would identify trends in feedback
        return request;
      },
    },
  ];
} 