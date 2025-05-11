/**
 * Code Quality Development Rules
 * 
 * This rule set defines rules for ensuring high-quality code development,
 * including best practices, patterns, and security considerations.
 */

import { Rule, RuleContext, RuleResult, AgentRequest } from '../types';

/**
 * Ensures proper error handling in code
 */
export const errorHandlingRule: Rule = {
  id: 'code-quality-development:error-handling',
  name: 'Error Handling',
  description: 'Ensures code includes proper error handling patterns',
  priority: 90,
  type: 'on-demand',
  
  condition: (request: AgentRequest, context: any): boolean => {
    // Check if the request is code-related
    return Boolean(
      request.command?.includes('code') || 
      request.command?.includes('function') ||
      request.command?.includes('class') || 
      request.content?.includes('function') ||
      request.content?.includes('class')
    );
  },
  
  action: async (request: AgentRequest, context: any): Promise<AgentRequest> => {
    // Skip if no response yet
    if (!context.response) {
      return request;
    }
    
    // Check if the response contains code
    if (!context.response.content.includes('```')) {
      return request;
    }
    
    // Extract code blocks
    const codeBlocks = extractCodeBlocks(context.response.content);
    let modified = false;
    
    // Process each code block
    for (let i = 0; i < codeBlocks.length; i++) {
      const { language, code } = codeBlocks[i];
      
      // Skip non-code blocks
      if (!isCodeLanguage(language)) {
        continue;
      }
      
      // Check for missing error handling
      const { improvedCode, hasChanges } = addErrorHandling(language, code);
      
      if (hasChanges) {
        // Replace the code block in the response
        context.response.content = replaceCodeBlock(
          context.response.content, 
          codeBlocks[i].original, 
          `\`\`\`${language}\n${improvedCode}\n\`\`\``
        );
        modified = true;
      }
    }
    
    // Log the action
    console.log(`Error handling rule applied, modified: ${modified}`);
    
    return request;
  }
};

/**
 * Ensures code follows security best practices
 */
export const securityBestPracticesRule: Rule = {
  id: 'code-quality-development:security-best-practices',
  name: 'Security Best Practices',
  description: 'Ensures code follows security best practices',
  priority: 95,
  type: 'on-demand',
  
  condition: (request: AgentRequest, context: any): boolean => {
    // Check if the request is code-related
    return request.command?.includes('code') || 
           request.command?.includes('function') ||
           request.command?.includes('class') ||
           request.content?.includes('function') ||
           request.content?.includes('class');
  },
  
  action: async (request: AgentRequest, context: any): Promise<AgentRequest> => {
    // Skip if no response yet
    if (!context.response) {
      return request;
    }
    
    // Check if the response contains code
    if (!context.response.content.includes('```')) {
      return request;
    }
    
    // Extract code blocks
    const codeBlocks = extractCodeBlocks(context.response.content);
    let modified = false;
    
    // Process each code block
    for (let i = 0; i < codeBlocks.length; i++) {
      const { language, code } = codeBlocks[i];
      
      // Skip non-code blocks
      if (!isCodeLanguage(language)) {
        continue;
      }
      
      // Check for security issues
      const { improvedCode, hasChanges } = enhanceCodeSecurity(language, code);
      
      if (hasChanges) {
        // Replace the code block in the response
        context.response.content = replaceCodeBlock(
          context.response.content, 
          codeBlocks[i].original, 
          `\`\`\`${language}\n${improvedCode}\n\`\`\``
        );
        modified = true;
      }
    }
    
    // Log the action
    console.log(`Security best practices rule applied, modified: ${modified}`);
    
    return request;
  }
};

/**
 * Ensures code follows best practices for performance
 */
export const performanceOptimizationRule: Rule = {
  id: 'code-quality-development:performance-optimization',
  name: 'Performance Optimization',
  description: 'Ensures code follows best practices for performance',
  priority: 85,
  type: 'on-demand',
  
  condition: (request: AgentRequest, context: any): boolean => {
    // Check if the request is code-related
    return request.command?.includes('code') || 
           request.command?.includes('function') ||
           request.command?.includes('class') ||
           request.content?.includes('function') ||
           request.content?.includes('class');
  },
  
  action: async (request: AgentRequest, context: any): Promise<AgentRequest> => {
    // Skip if no response yet
    if (!context.response) {
      return request;
    }
    
    // Check if the response contains code
    if (!context.response.content.includes('```')) {
      return request;
    }
    
    // Extract code blocks
    const codeBlocks = extractCodeBlocks(context.response.content);
    let modified = false;
    
    // Process each code block
    for (let i = 0; i < codeBlocks.length; i++) {
      const { language, code } = codeBlocks[i];
      
      // Skip non-code blocks
      if (!isCodeLanguage(language)) {
        continue;
      }
      
      // Check for performance issues
      const { improvedCode, hasChanges } = optimizeCodePerformance(language, code);
      
      if (hasChanges) {
        // Replace the code block in the response
        context.response.content = replaceCodeBlock(
          context.response.content, 
          codeBlocks[i].original, 
          `\`\`\`${language}\n${improvedCode}\n\`\`\``
        );
        modified = true;
      }
    }
    
    // Log the action
    console.log(`Performance optimization rule applied, modified: ${modified}`);
    
    return request;
  }
};

/**
 * Ensures code follows proper testing patterns
 */
export const testabilityRule: Rule = {
  id: 'code-quality-development:testability',
  name: 'Testability',
  description: 'Ensures code follows proper testing patterns',
  priority: 80,
  type: 'on-demand',
  
  condition: (request: AgentRequest, context: any): boolean => {
    // Check if the request is code-related
    return request.command?.includes('code') || 
           request.command?.includes('function') ||
           request.command?.includes('class') ||
           request.content?.includes('function') ||
           request.content?.includes('class');
  },
  
  action: async (request: AgentRequest, context: any): Promise<AgentRequest> => {
    // Skip if no response yet
    if (!context.response) {
      return request;
    }
    
    // Check if the response contains code
    if (!context.response.content) {
      return request;
    }
    
    if (!context.response.content.includes('```')) {
      return request;
    }
    
    // Extract code blocks
    const codeBlocks = extractCodeBlocks(context.response.content);
    let modified = false;
    
    // Process each code block
    for (let i = 0; i < codeBlocks.length; i++) {
      const { language, code } = codeBlocks[i];
      
      // Skip non-code blocks
      if (!isCodeLanguage(language)) {
        continue;
      }
      
      // Check for testability issues
      const { improvedCode, hasChanges } = improveTestability(language, code);
      
      if (hasChanges && context.response && context.response.content) {
        // Replace the code block in the response
        context.response.content = replaceCodeBlock(
          context.response.content, 
          codeBlocks[i].original, 
          `\`\`\`${language}\n${improvedCode}\n\`\`\``
        );
        modified = true;
      }
    }
    
    // Log the action
    console.log(`Testability rule applied, modified: ${modified}`);
    
    return request;
  }
};

/**
 * Rule to enhance code accessibility
 */
export const accessibilityRule: Rule = {
  id: 'code-quality-development:accessibility',
  name: 'Accessibility Enhancements',
  description: 'Analyzes code for accessibility issues and suggests improvements',
  priority: 88,
  type: 'on-demand',
  
  condition: (request: AgentRequest, context: any): boolean => {
    // Check if this is a code-related request
    return request.command?.includes('code') || 
           request.command?.includes('component') ||
           request.command?.includes('html') ||
           request.command?.includes('ui') ||
           request.command?.includes('interface');
  },
  
  action: async (request: AgentRequest, context: any): Promise<AgentRequest> => {
    // Skip if there's no response or content
    if (!context.response || !context.response.content) {
      return request;
    }

    // Extract code blocks from the response
    const codeBlocks = extractCodeBlocks(context.response.content);
    let modified = false;
    
    // Process each code block
    for (let i = 0; i < codeBlocks.length; i++) {
      const { language, code } = codeBlocks[i];
      
      // Skip non-code blocks
      if (!isCodeLanguage(language)) {
        continue;
      }

      // Apply accessibility improvements
      const { improvedCode, hasChanges } = improveAccessibility(language, code);
      
      if (hasChanges) {
        // Replace the code block in the response
        context.response.content = replaceCodeBlock(
          context.response.content, 
          codeBlocks[i].original, 
          `\`\`\`${language}\n${improvedCode}\n\`\`\``
        );
        modified = true;
      }
    }

    // Log the action
    console.log(`Accessibility rule applied, modified: ${modified}`);
    
    return request;
  }
};

/**
 * Ensures code follows maintainability best practices
 */
export const maintainabilityRule: Rule = {
  id: 'code-quality-development:maintainability',
  name: 'Code Maintainability',
  description: 'Ensures code follows best practices for maintainability',
  priority: 87,
  type: 'on-demand',
  
  condition: (request: AgentRequest, context: any): boolean => {
    // Check if the request is code-related
    return request.command?.includes('code') || 
           request.command?.includes('function') ||
           request.command?.includes('class');
  },
  
  action: async (request: AgentRequest, context: any): Promise<AgentRequest> => {
    // Skip if no response yet
    if (!context.response || !context.response.content) {
      return request;
    }
    
    // Check if the response contains code
    if (!context.response.content.includes('```')) {
      return request;
    }
    
    // Extract code blocks
    const codeBlocks = extractCodeBlocks(context.response.content);
    let modified = false;
    
    // Process each code block
    for (let i = 0; i < codeBlocks.length; i++) {
      const { language, code } = codeBlocks[i];
      
      // Skip non-code blocks
      if (!isCodeLanguage(language)) {
        continue;
      }
      
      // Check for maintainability issues
      const { improvedCode, hasChanges } = improveCodeMaintainability(language, code);
      
      if (hasChanges) {
        // Replace the code block in the response
        context.response.content = replaceCodeBlock(
          context.response.content, 
          codeBlocks[i].original, 
          `\`\`\`${language}\n${improvedCode}\n\`\`\``
        );
        modified = true;
      }
    }
    
    // Log the action
    console.log(`Maintainability rule applied, modified: ${modified}`);
    
    return request;
  }
};

// Helper functions

/**
 * Extract code blocks from markdown content
 */
function extractCodeBlocks(content: string): Array<{ original: string, language: string, code: string }> {
  const codeBlockRegex = /```([a-zA-Z0-9]*)\n([\s\S]*?)```/g;
  const blocks = [];
  let match;
  
  while ((match = codeBlockRegex.exec(content)) !== null) {
    blocks.push({
      original: match[0],
      language: match[1].toLowerCase(),
      code: match[2]
    });
  }
  
  return blocks;
}

/**
 * Replace a code block in content
 */
function replaceCodeBlock(content: string, original: string, replacement: string): string {
  return content.replace(original, replacement);
}

/**
 * Check if language is a programming language
 */
function isCodeLanguage(language: string): boolean {
  const codeLanguages = [
    'javascript', 'js', 'typescript', 'ts', 'python', 'py', 'java', 'c', 'cpp', 'c++',
    'csharp', 'c#', 'go', 'rust', 'php', 'ruby', 'swift', 'kotlin', 'scala'
  ];
  
  return codeLanguages.includes(language.toLowerCase());
}

/**
 * Add error handling to code
 */
function addErrorHandling(language: string, code: string): { improvedCode: string, hasChanges: boolean } {
  let improvedCode = code;
  let hasChanges = false;
  
  // Basic error handling check
  if (!code.includes('try') && !code.includes('catch')) {
    improvedCode = `// Consider adding error handling\ntry {\n  ${code}\n} catch (error) {\n  // Handle errors appropriately\n  console.error(error);\n}`;
    hasChanges = true;
  }
  
  return { improvedCode, hasChanges };
}

/**
 * Enhance code security
 */
function enhanceCodeSecurity(language: string, code: string): { improvedCode: string, hasChanges: boolean } {
  let improvedCode = code;
  let hasChanges = false;
  
  // Check for security issues
  if (code.includes('eval(') || code.includes('innerHTML =')) {
    improvedCode = improvedCode.replace(/eval\s*\(/g, '/* Security risk: avoid eval */ (');
    improvedCode = improvedCode.replace(/\.innerHTML\s*=/g, '/* Security risk: use textContent instead */ .textContent =');
    hasChanges = true;
  }
  
  return { improvedCode, hasChanges };
}

/**
 * Optimize code performance
 */
function optimizeCodePerformance(language: string, code: string): { improvedCode: string, hasChanges: boolean } {
  let improvedCode = code;
  let hasChanges = false;
  
  // Check for performance issues
  if (code.includes('for (') && code.includes('.concat(')) {
    improvedCode = improvedCode.replace(/\.concat\(/g, '/* Performance: consider using push instead */ .push(');
    hasChanges = true;
  }
  
  return { improvedCode, hasChanges };
}

/**
 * Improve code testability
 */
function improveTestability(language: string, code: string): { improvedCode: string, hasChanges: boolean } {
  let improvedCode = code;
  let hasChanges = false;
  
  // Check for testability
  if (code.includes('document.') || code.includes('window.')) {
    improvedCode = `// Consider dependency injection for better testability\n${improvedCode}`;
    hasChanges = true;
  }
  
  return { improvedCode, hasChanges };
}

/**
 * Improve code accessibility
 */
function improveAccessibility(language: string, code: string): { improvedCode: string, hasChanges: boolean } {
  let improvedCode = code;
  let hasChanges = false;
  
  // Check for accessibility issues
  if ((code.includes('<img') || code.includes('<Image')) && 
      !code.includes('alt=') && !code.includes('aria-hidden="true"')) {
    improvedCode = improvedCode.replace(/<img([^>]*)>/g, '<img$1 alt="[ACCESSIBILITY: Add descriptive alt text]">');
    improvedCode = improvedCode.replace(/<Image([^>]*)>/g, '<Image$1 alt="[ACCESSIBILITY: Add descriptive alt text]">');
    hasChanges = true;
  }
  
  return { improvedCode, hasChanges };
}

/**
 * Improve code maintainability
 */
function improveCodeMaintainability(language: string, code: string): { improvedCode: string, hasChanges: boolean } {
  let improvedCode = code;
  let hasChanges = false;
  
  // Check for maintainability
  const lines = code.split('\n');
  if (lines.length > 10 || code.length > 200) {
    improvedCode = `// Consider breaking down into smaller functions\n${improvedCode}`;
    hasChanges = true;
  }
  
  return { improvedCode, hasChanges };
}

// Export all rules as an array
export const rules = [
  errorHandlingRule,
  securityBestPracticesRule,
  performanceOptimizationRule,
  testabilityRule,
  accessibilityRule,
  maintainabilityRule
];

// Export helper functions for direct use in agent service
export {
  addErrorHandling,
  enhanceCodeSecurity,
  optimizeCodePerformance,
  improveTestability,
  improveAccessibility,
  improveCodeMaintainability
}; 