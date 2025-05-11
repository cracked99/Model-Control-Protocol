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
    return request.command.includes('code') || 
           request.command.includes('function') ||
           request.command.includes('class');
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
    return request.command.includes('code') || 
           request.command.includes('function') ||
           request.command.includes('class');
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
    return request.command.includes('code') || 
           request.command.includes('function') ||
           request.command.includes('class');
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
    return request.command.includes('code') || 
           request.command.includes('function') ||
           request.command.includes('class');
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
    return request.command.includes('code') || 
           request.command.includes('component') ||
           request.command.includes('html') ||
           request.command.includes('ui') ||
           request.command.includes('interface');
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
 * Improve code accessibility
 */
function improveAccessibility(language: string, code: string): { improvedCode: string, hasChanges: boolean } {
  let improvedCode = code;
  let hasChanges = false;
  
  switch (language) {
    case 'html':
    case 'jsx':
    case 'tsx':
      // Check for images without alt text
      if ((code.includes('<img') || code.includes('<Image')) && 
          !code.includes('alt=') && !code.includes('aria-hidden="true"')) {
        improvedCode = improvedCode.replace(/<img([^>]*)>/g, '<img$1 alt="[ACCESSIBILITY: Add descriptive alt text]">');
        improvedCode = improvedCode.replace(/<Image([^>]*)>/g, '<Image$1 alt="[ACCESSIBILITY: Add descriptive alt text]">');
        hasChanges = true;
      }
      
      // Check for buttons without accessible names
      if (code.includes('<button') && !code.includes('aria-label') && 
          !/(>[\s\S]*?[a-zA-Z]+[\s\S]*?<\/button>)/.test(code)) {
        improvedCode = improvedCode.replace(/<button([^>]*)>(\s*)<\/button>/g, 
          '<button$1 aria-label="[ACCESSIBILITY: Add descriptive label]">$2</button>');
        hasChanges = true;
      }
      
      // Check for form inputs without labels
      if (code.includes('<input') && !code.includes('<label') && !code.includes('aria-label')) {
        improvedCode = `<!-- ACCESSIBILITY: Each form input should have an associated label -->
<!-- Example: <label for="inputId">Label text</label><input id="inputId" /> -->
<!-- Or use aria-label: <input aria-label="Description" /> -->
${improvedCode}`;
        hasChanges = true;
      }
      
      // Check for missing heading hierarchy
      if (code.includes('<h1') && (code.includes('<h3') || code.includes('<h4')) && !code.includes('<h2')) {
        improvedCode = `<!-- ACCESSIBILITY: Maintain proper heading hierarchy (h1 > h2 > h3 > h4) -->
<!-- Skipping heading levels can confuse screen reader users -->
${improvedCode}`;
        hasChanges = true;
      }
      
      // Check for color contrast indicators (not perfect, but can flag potential issues)
      if (code.includes('color:') || code.includes('background-color:') || 
          code.includes('color=') || code.includes('backgroundColor=')) {
        improvedCode = `<!-- ACCESSIBILITY: Ensure sufficient color contrast (WCAG AA requires 4.5:1 for normal text) -->
<!-- Use tools like WebAIM's Contrast Checker to verify contrast ratios -->
${improvedCode}`;
        hasChanges = true;
      }
      
      // Check for missing ARIA roles in interactive elements
      if ((code.includes('onClick') || code.includes('onclick') || code.includes('@click')) && 
          !code.includes('role=') && !code.includes('<button') && !code.includes('<a')) {
        improvedCode = `<!-- ACCESSIBILITY: Non-standard interactive elements need ARIA roles -->
<!-- Example: <div role="button" tabIndex={0} onKeyDown={handleKeyDown} onClick={handleClick}> -->
${improvedCode}`;
        hasChanges = true;
      }
      
      // Check for keyboard accessibility in custom components
      if ((code.includes('onClick') || code.includes('onclick')) && 
          !code.includes('onKeyDown') && !code.includes('onkeydown') && 
          !code.includes('<button') && !code.includes('<a')) {
        improvedCode = `<!-- ACCESSIBILITY: Custom interactive elements need keyboard event handlers -->
<!-- Example: add onKeyDown={handleKeyDown} and tabIndex={0} for keyboard accessibility -->
${improvedCode}`;
        hasChanges = true;
      }
      
      // Check for proper use of ARIA landmarks
      if (code.includes('<div') && (code.includes('class="nav') || code.includes('className="nav')) && 
          !code.includes('role="navigation"')) {
        improvedCode = improvedCode.replace(/<div([^>]*)(class|className)="nav([^>]*)>/g, 
          '<div$1$2="nav$3 role="navigation">');
        hasChanges = true;
      }
      
      // Check for semantic HTML
      if (code.includes('<div class="header"') || code.includes('<div className="header"')) {
        improvedCode = `<!-- ACCESSIBILITY: Use semantic HTML elements instead of divs with classes -->
<!-- Example: <header> instead of <div class="header"> -->
${improvedCode}`;
        hasChanges = true;
      }
      break;
      
    case 'js':
    case 'ts':
      // Check for keyboard event handlers in React components
      if (code.includes('React') && code.includes('onClick') && !code.includes('onKeyDown')) {
        improvedCode = `// ACCESSIBILITY: Add keyboard event handlers for interactive elements
// Example: add onKeyDown handler alongside onClick for keyboard accessibility
${improvedCode}`;
        hasChanges = true;
      }
      
      // Check for proper focus management in React components
      if (code.includes('React') && 
          (code.includes('modal') || code.includes('dialog') || code.includes('popup')) && 
          !code.includes('useRef') && !code.includes('focus')) {
        improvedCode = `// ACCESSIBILITY: Implement proper focus management for modals/dialogs
// Use useRef and focus() to trap and manage focus within modal components
${improvedCode}`;
        hasChanges = true;
      }
      
      // Check for aria-live regions in dynamic content
      if ((code.includes('setState') || code.includes('useState')) && 
          (code.includes('alert') || code.includes('notification') || code.includes('message')) && 
          !code.includes('aria-live')) {
        improvedCode = `// ACCESSIBILITY: Use aria-live regions for dynamic content that should be announced
// Example: <div aria-live="polite" aria-atomic="true">{message}</div>
${improvedCode}`;
        hasChanges = true;
      }
      
      // Check for proper error handling in forms
      if (code.includes('form') && code.includes('error') && !code.includes('aria-invalid')) {
        improvedCode = `// ACCESSIBILITY: Use aria-invalid and aria-describedby for form error states
// Example: <input aria-invalid={hasError} aria-describedby="error-message" />
// <div id="error-message">{errorMessage}</div>
${improvedCode}`;
        hasChanges = true;
      }
      break;
  }
  
  return { improvedCode, hasChanges };
}

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
    return request.command.includes('code') || 
           request.command.includes('function') ||
           request.command.includes('class');
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
  
  // Language-specific error handling improvements
  switch (language.toLowerCase()) {
    case 'javascript':
    case 'js':
    case 'typescript':
    case 'ts':
      // Check for async functions without try/catch
      if (code.includes('async') && code.includes('await') && !code.includes('try {')) {
        // Simple heuristic: wrap await statements in try/catch
        const asyncFunctionRegex = /async\s+\w+\s*\([^)]*\)\s*{([^}]*)}/g;
        improvedCode = code.replace(asyncFunctionRegex, (match, functionBody) => {
          if (!functionBody.includes('try {')) {
            hasChanges = true;
            return match.replace(functionBody, `\n  try {\n    ${functionBody.trim()}\n  } catch (error) {\n    console.error('Error:', error);\n    throw error;\n  }\n`);
          }
          return match;
        });
      }
      break;
      
    case 'python':
    case 'py':
      // Check for functions without try/except
      if (!code.includes('try:') && (code.includes('def ') || code.includes('async def '))) {
        // Simple heuristic for Python functions
        const pythonFunctionRegex = /(def|async def)\s+\w+\s*\([^)]*\):\s*\n((\s{4}|\t).*\n)+/g;
        improvedCode = code.replace(pythonFunctionRegex, (match) => {
          if (!match.includes('try:')) {
            hasChanges = true;
            const indentation = match.match(/\n(\s+)/)?.[1] || '    ';
            const lines = match.split('\n');
            const signature = lines[0];
            const body = lines.slice(1).join('\n');
            
            return `${signature}\n${indentation}try:\n${body.split('\n').map(line => `${indentation}${line}`).join('\n')}\n${indentation}except Exception as e:\n${indentation}${indentation}print(f"Error: {e}")\n${indentation}${indentation}raise\n`;
          }
          return match;
        });
      }
      break;
  }
  
  return { improvedCode, hasChanges };
}

/**
 * Enhance code security
 */
function enhanceCodeSecurity(language: string, code: string): { improvedCode: string, hasChanges: boolean } {
  let improvedCode = code;
  let hasChanges = false;
  
  // Language-specific security improvements
  switch (language.toLowerCase()) {
    case 'javascript':
    case 'js':
    case 'typescript':
    case 'ts':
      // Check for eval usage (code injection risk)
      if (code.includes('eval(')) {
        improvedCode = improvedCode.replace(/eval\s*\(/g, '// SECURITY: Avoid using eval - it creates code injection vulnerabilities\n// Consider using a safer alternative like JSON.parse for data or Function constructor if absolutely necessary\n// eval(');
        hasChanges = true;
      }
      
      // Check for innerHTML usage (XSS risk)
      if (code.includes('.innerHTML =')) {
        improvedCode = improvedCode.replace(/\.innerHTML\s*=/g, '// SECURITY: innerHTML creates XSS vulnerabilities\n// Consider using textContent (for text) or insertAdjacentHTML with sanitization\n// .innerHTML =');
        hasChanges = true;
      }
      
      // Check for document.write (XSS risk)
      if (code.includes('document.write(')) {
        improvedCode = improvedCode.replace(/document\.write\s*\(/g, '// SECURITY: document.write creates XSS vulnerabilities\n// Consider creating DOM elements with document.createElement instead\n// document.write(');
        hasChanges = true;
      }
      
      // Check for localStorage without validation (client-side data tampering risk)
      if ((code.includes('localStorage.getItem(') || code.includes('localStorage.setItem(')) && 
          !code.includes('try {') && !code.includes('validate')) {
        improvedCode = `// SECURITY: Always validate localStorage data, as it can be tampered with by users
// Consider using try/catch blocks and validating the structure of the data
${improvedCode}`;
        hasChanges = true;
      }
      
      // Check for SQL Injection in Node.js
      if (code.includes('sql') && code.includes('query(') && 
          (code.includes('`') || code.includes("'") || code.includes('"')) && 
          !code.includes('parameterized') && !code.includes('prepared')) {
        improvedCode = `// SECURITY: Potential SQL injection vulnerability detected
// Always use parameterized queries or prepared statements
// Example: db.query('SELECT * FROM users WHERE id = ?', [userId])
${improvedCode}`;
        hasChanges = true;
      }
      
      // Check for JWT without verification
      if (code.includes('jwt') && !code.includes('verify') && 
          (code.includes('decode') || code.includes('parse'))) {
        improvedCode = `// SECURITY: JWT tokens should always be verified, not just decoded
// Use the verify method to check the signature
${improvedCode}`;
        hasChanges = true;
      }
      
      // Check for CORS issues
      if (code.includes('Access-Control-Allow-Origin') && 
          code.includes('*') && !code.includes('development')) {
        improvedCode = `// SECURITY: Avoid using '*' in Access-Control-Allow-Origin in production
// Specify exact allowed origins instead
${improvedCode}`;
        hasChanges = true;
      }
      break;
      
    case 'python':
    case 'py':
      // Check for exec usage (code injection risk)
      if (code.includes('exec(')) {
        improvedCode = improvedCode.replace(/exec\s*\(/g, '# SECURITY: Avoid using exec - it creates code injection vulnerabilities\n# Consider using a safer alternative like JSON loads or ast.literal_eval\n# exec(');
        hasChanges = true;
      }
      
      // Check for shell=True in subprocess (command injection risk)
      if (code.includes('subprocess') && code.includes('shell=True')) {
        improvedCode = improvedCode.replace(/shell\s*=\s*True/g, '# SECURITY: shell=True creates command injection vulnerabilities\n# Use shell=False (default) and pass command as a list of arguments\nshell=False');
        hasChanges = true;
      }
      
      // Check for SQL Injection
      if ((code.includes('execute(') || code.includes('executemany(')) && 
          (code.includes('f"') || code.includes("f'") || code.includes('format(')) && 
          !code.includes('parameterized') && !code.includes('%s')) {
        improvedCode = `# SECURITY: Potential SQL injection vulnerability detected
# Use parameterized queries with placeholders
# Example: cursor.execute("SELECT * FROM users WHERE id = %s", (user_id,))
${improvedCode}`;
        hasChanges = true;
      }
      
      // Check for pickle (deserialization vulnerabilities)
      if (code.includes('pickle') && code.includes('load')) {
        improvedCode = `# SECURITY: Pickle deserialization can execute arbitrary code
# Never unpickle data from untrusted sources, consider using JSON instead
${improvedCode}`;
        hasChanges = true;
      }
      
      // Check for yaml.load (deserialization vulnerabilities)
      if (code.includes('yaml') && code.includes('yaml.load(') && 
          !code.includes('yaml.safe_load(')) {
        improvedCode = improvedCode.replace(/yaml\.load\(/g, '# SECURITY: yaml.load() is vulnerable to code execution\n# Use yaml.safe_load() instead\nyaml.safe_load(');
        hasChanges = true;
      }
      
      // Check for weak cryptography
      if (code.includes('hashlib') && 
          (code.includes('md5') || code.includes('sha1'))) {
        improvedCode = `# SECURITY: MD5 and SHA1 are cryptographically broken
# Use SHA-256 or SHA-512 instead, or better yet, use high-level libraries like passlib
${improvedCode}`;
        hasChanges = true;
      }
      break;
      
    case 'java':
      // Check for potential XXE vulnerabilities
      if (code.includes('DocumentBuilder') || code.includes('SAXParser')) {
        improvedCode = `// SECURITY: XML processing can be vulnerable to XXE attacks
// Set 'disallow-doctype-decl' feature to true and disable external entities
${improvedCode}`;
        hasChanges = true;
      }
      
      // Check for potential deserialization vulnerabilities
      if (code.includes('ObjectInputStream') && code.includes('readObject()')) {
        improvedCode = `// SECURITY: Java deserialization can lead to remote code execution
// Consider validating objects or using safer alternatives like JSON
${improvedCode}`;
        hasChanges = true;
      }
      
      // Check for SQL Injection
      if (code.includes('Statement') && 
          code.includes('executeQuery') && 
          !code.includes('PreparedStatement')) {
        improvedCode = `// SECURITY: Using Statement with string concatenation creates SQL injection risks
// Use PreparedStatement with parameterized queries instead
${improvedCode}`;
        hasChanges = true;
      }
      break;
  }
  
  // Check for hardcoded credentials
  const credentialPatterns = [
    /api[-_]?key\s*=\s*['"][^'"]{8,}['"]/, 
    /password\s*=\s*['"][^'"]{3,}['"]/, 
    /auth[-_]?token\s*=\s*['"][^'"]{8,}['"]/, 
    /secret\s*=\s*['"][^'"]{8,}['"]/
  ];
  
  for (const pattern of credentialPatterns) {
    if (pattern.test(code)) {
      improvedCode = `// SECURITY: Potential hardcoded credentials detected
// Store sensitive values in environment variables or a secure configuration system
${improvedCode}`;
      hasChanges = true;
      break;
    }
  }
  
  return { improvedCode, hasChanges };
}

/**
 * Optimize code performance
 */
function optimizeCodePerformance(language: string, code: string): { improvedCode: string, hasChanges: boolean } {
  let improvedCode = code;
  let hasChanges = false;
  
  // Language-specific performance improvements
  switch (language.toLowerCase()) {
    case 'javascript':
    case 'js':
    case 'typescript':
    case 'ts':
      // Check for array concatenation in loops
      if (code.includes('for (') && code.includes('.concat(')) {
        improvedCode = improvedCode.replace(/\.concat\(/g, '// PERFORMANCE: Consider using push instead of concat for better performance in loops\n// .concat(');
        hasChanges = true;
      }
      
      // Check for multiple DOM queries
      if ((code.includes('document.querySelector') || code.includes('document.getElementById')) && 
          (code.match(/(document\.querySelector|document\.getElementById)/g)?.length ?? 0) > 3) {
        improvedCode = `// PERFORMANCE: Consider caching DOM queries for better performance
// Example: const element = document.querySelector('.selector'); then reuse element
${improvedCode}`;
        hasChanges = true;
      }
      
      // Check for inefficient DOM updates
      if (code.includes('appendChild') && code.includes('for (')) {
        improvedCode = `// PERFORMANCE: Consider using DocumentFragment for batch DOM updates
// Example: const fragment = document.createDocumentFragment(); /* add elements to fragment */; parent.appendChild(fragment);
${improvedCode}`;
        hasChanges = true;
      }
      
      // Check for repeated object creation in loops
      const newInLoopRegex = /for\s*\([^{]+\{[^}]*new\s+\w+/;
      if (newInLoopRegex.test(code)) {
        improvedCode = `// PERFORMANCE: Creating objects inside loops can cause memory churn
// Consider moving object creation outside the loop if possible
${improvedCode}`;
        hasChanges = true;
      }
      
      // Check for array methods that could cause N^2 operations
      if (code.includes('splice') && 
          (code.includes('for (') || code.includes('forEach') || code.includes('.map(')) && 
          !code.includes('reverse')) {
        improvedCode = `// PERFORMANCE: Using splice in loops can lead to O(n²) operations
// Consider collecting indices to remove and process them in reverse order, or build a new array
${improvedCode}`;
        hasChanges = true;
      }
      
      // Check for direct property access instead of destructuring in loops
      if ((code.includes('for (') || code.includes('forEach') || code.includes('.map(')) && 
          /\.\w+\.\w+\.\w+/.test(code) && !code.includes('const {')) {
        improvedCode = `// PERFORMANCE: Consider using destructuring to avoid repeated deep property access
// Example: const { prop1, prop2 } = obj; instead of obj.prop1, obj.prop2
${improvedCode}`;
        hasChanges = true;
      }
      
      // Check for inefficient React patterns
      if (code.includes('React') && code.includes('function') && 
          code.includes('useState') && !code.includes('useMemo') && 
          (code.includes('.filter(') || code.includes('.map(') || code.includes('.reduce('))) {
        improvedCode = `// PERFORMANCE: Consider using useMemo for expensive calculations in React components
// Example: const filteredItems = useMemo(() => items.filter(...), [items]);
${improvedCode}`;
        hasChanges = true;
      }
      break;
      
    case 'python':
    case 'py':
      // Check for string concatenation in loops
      if (code.includes('for ') && code.includes(' + ')) {
        improvedCode = `# PERFORMANCE: Consider using join() instead of + for string concatenation in loops
# Example: ''.join(items) instead of building a string with +=
${improvedCode}`;
        hasChanges = true;
      }
      
      // Check for inefficient list operations
      if (code.includes('for ') && code.includes('.append')) {
        const listComprehensionComment = `# PERFORMANCE: Consider using list comprehensions instead of for-loops with append
# Example: [x for x in items if condition] instead of a loop that builds a list
`;
        if (!code.includes('[') || !code.includes('for') || !code.includes('in')) {
          improvedCode = listComprehensionComment + improvedCode;
          hasChanges = true;
        }
      }
      
      // Check for inefficient dict operations
      if (code.includes('for ') && code.includes('[') && code.includes('] = ')) {
        improvedCode = `# PERFORMANCE: Consider using dict comprehensions for building dictionaries
# Example: {k: v for k, v in items} instead of a loop that builds a dict
${improvedCode}`;
        hasChanges = true;
      }
      
      // Check for repeated method lookups in loops
      if (code.includes('for ') && /\.\w+\(\).*\.\w+\(\)/.test(code)) {
        improvedCode = `# PERFORMANCE: Consider caching method lookups in tight loops
# Example: method = obj.method; method() instead of obj.method()
${improvedCode}`;
        hasChanges = true;
      }
      
      // Check for inefficient database access patterns
      if (code.includes('for ') && (code.includes('cursor.execute') || code.includes('query'))) {
        improvedCode = `# PERFORMANCE: Consider batching database operations instead of querying in a loop
# Example: executemany() or bulk operations instead of execute() in a loop
${improvedCode}`;
        hasChanges = true;
      }
      
      // Check for inefficient file I/O
      if (code.includes('for ') && (code.includes('open(') || code.includes('close()'))) {
        improvedCode = `# PERFORMANCE: Consider using 'with' statement for file operations and reading files in chunks
# Example: with open(...) as f: for chunk in f: process(chunk)
${improvedCode}`;
        hasChanges = true;
      }
      break;
      
    case 'java':
      // Check for inefficient string concatenation
      if (code.includes('for ') && code.includes(' + ') && !code.includes('StringBuilder')) {
        improvedCode = `// PERFORMANCE: Use StringBuilder for string concatenation in loops
// Example: StringBuilder sb = new StringBuilder(); sb.append(...); instead of string + string
${improvedCode}`;
        hasChanges = true;
      }
      
      // Check for inefficient collection usage
      if (code.includes('ArrayList') && code.includes('contains(') && code.includes('for ')) {
        improvedCode = `// PERFORMANCE: ArrayList.contains() is O(n), consider HashSet for membership testing
// Example: HashSet<Type> set = new HashSet<>(list); set.contains(...) is O(1)
${improvedCode}`;
        hasChanges = true;
      }
      
      // Check for inefficient Map usage
      if (code.includes('Map') && code.includes('keySet()') && code.includes('get(')) {
        improvedCode = `// PERFORMANCE: Consider using entrySet() instead of keySet() to avoid additional map lookups
// Example: for (Map.Entry<K, V> entry : map.entrySet()) { ... entry.getKey(), entry.getValue() ... }
${improvedCode}`;
        hasChanges = true;
      }
      break;
  }
  
  // Generic performance improvements for all languages
  
  // Check for nested loops (potential N²)
  const nestedLoopRegex = /for\s*\([^{]+\{[^}]*for\s*\(/;
  if (nestedLoopRegex.test(code)) {
    improvedCode = `// PERFORMANCE: Nested loops detected - these have O(n²) time complexity
// Consider if there's a more efficient algorithm or data structure that could reduce complexity
${improvedCode}`;
    hasChanges = true;
  }
  
  // Check for code that looks like it could benefit from caching
  const cacheablePatterns = [
    /(\w+)\([^)]+\).*\1\([^)]+\)/,  // Same function called multiple times with capturing group
    /Math\.(pow|sqrt|sin|cos)/     // Expensive math operations
  ];
  
  for (const pattern of cacheablePatterns) {
    if (pattern.test(code)) {
      improvedCode = `// PERFORMANCE: Consider caching the results of expensive operations that are used multiple times
${improvedCode}`;
      hasChanges = true;
      break;
    }
  }
  
  return { improvedCode, hasChanges };
}

/**
 * Improve code testability
 */
function improveTestability(language: string, code: string): { improvedCode: string, hasChanges: boolean } {
  let improvedCode = code;
  let hasChanges = false;
  
  // Language-specific testability improvements
  switch (language.toLowerCase()) {
    case 'javascript':
    case 'js':
    case 'typescript':
    case 'ts':
      // Check for direct DOM manipulation without abstraction
      if ((code.includes('document.querySelector') || code.includes('document.getElementById')) && 
          !code.includes('export function') && !code.includes('export const')) {
        improvedCode = `// TESTABILITY: Consider extracting DOM operations into separate, exportable functions for easier testing
${improvedCode}`;
        hasChanges = true;
      }
      
      // Check for hardcoded dependencies
      if (code.includes('new ') && !code.includes('constructor(') && !code.includes('dependency injection')) {
        // Look for class instantiations inside functions/methods
        const classInstantiationRegex = /function\s+\w+\s*\([^)]*\)\s*{[^}]*new\s+\w+\s*\(/g;
        if (classInstantiationRegex.test(code)) {
          improvedCode = `// TESTABILITY: Consider using dependency injection instead of creating instances inside functions
// Example: function process(service) { ... } instead of function process() { const service = new Service(); ... }
${improvedCode}`;
          hasChanges = true;
        }
      }
      
      // Check for missing exports (makes testing difficult)
      if (!code.includes('export ') && (code.includes('function ') || code.includes('class '))) {
        improvedCode = `// TESTABILITY: Consider exporting functions and classes to make them testable
${improvedCode}`;
        hasChanges = true;
      }
      
      // Check for large functions (hard to test)
      const functionLines = code.split('\n').length;
      if (functionLines > 30 && (code.includes('function ') || code.includes('=>'))) {
        improvedCode = `// TESTABILITY: Consider breaking down large functions into smaller, more testable units
${improvedCode}`;
        hasChanges = true;
      }
      
      // Check for pure vs impure functions
      if ((code.includes('Math.random') || code.includes('new Date()') || code.includes('Date.now()')) && 
          code.includes('function ') && !code.includes('// impure')) {
        improvedCode = `// TESTABILITY: This function has side effects or non-deterministic behavior (Math.random, Date)
// Consider extracting the non-deterministic parts to make the core logic pure and testable
${improvedCode}`;
        hasChanges = true;
      }
      break;
      
    case 'python':
    case 'py':
      // Check for missing function isolation
      if (code.includes('def ') && !code.includes('if __name__ == "__main__"') && 
          (code.includes('print(') || code.includes('input('))) {
        improvedCode = `# TESTABILITY: Consider using if __name__ == "__main__" to separate executable code from importable functions
${improvedCode}`;
        hasChanges = true;
      }
      
      // Check for hardcoded dependencies
      if (code.includes('def ') && code.includes('= ') && !code.includes('def __init__') && 
          !code.includes('dependency injection')) {
        const classInstantiationRegex = /def\s+\w+\s*\([^)]*\):\s*[\s\S]*?\s+\w+\s*=\s*\w+\(/g;
        if (classInstantiationRegex.test(code)) {
          improvedCode = `# TESTABILITY: Consider using dependency injection instead of creating instances inside functions
# Example: def process(service): ... instead of def process(): service = Service(); ...
${improvedCode}`;
          hasChanges = true;
        }
      }
      
      // Check for global state
      if (code.includes('global ')) {
        improvedCode = `# TESTABILITY: Global state makes testing difficult. Consider passing state as parameters
${improvedCode}`;
        hasChanges = true;
      }
      
      // Check for large functions
      const pythonFunctionLines = code.split('\n').length;
      if (pythonFunctionLines > 30 && code.includes('def ')) {
        improvedCode = `# TESTABILITY: Consider breaking down large functions into smaller, more testable units
${improvedCode}`;
        hasChanges = true;
      }
      break;
      
    case 'java':
      // Check for static methods that could be instance methods
      if (code.includes('static ') && !code.includes('static void main') && 
          !code.includes('interface ') && !code.includes('@Test')) {
        improvedCode = `// TESTABILITY: Consider making non-utility static methods into instance methods for better testing
${improvedCode}`;
        hasChanges = true;
      }
      
      // Check for missing interfaces
      if (code.includes('class ') && !code.includes('interface ') && 
          !code.includes('extends ') && code.includes('public ')) {
        improvedCode = `// TESTABILITY: Consider using interfaces for better testability through mocking
${improvedCode}`;
        hasChanges = true;
      }
      break;
  }
  
  // Generic testability improvements for all languages
  
  // Check for commented out tests
  if (code.includes('// test') || code.includes('// Test') || 
      code.includes('# test') || code.includes('# Test')) {
    improvedCode = `// TESTABILITY: Commented test code detected. Consider implementing proper unit tests
${improvedCode}`;
    hasChanges = true;
  }
  
  // Check for TODOs related to testing
  if (code.includes('TODO') && (code.includes('test') || code.includes('Test'))) {
    improvedCode = `// TESTABILITY: TODO related to testing detected. Consider implementing tests now rather than later
${improvedCode}`;
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
  
  // Language-specific maintainability improvements
  switch (language.toLowerCase()) {
    case 'javascript':
    case 'js':
    case 'typescript':
    case 'ts':
      // Check for long functions (more than 30 lines)
      const jsLines = code.split('\n');
      let functionLineCount = 0;
      let inFunction = false;
      let braceCount = 0;

      for (let i = 0; i < jsLines.length; i++) {
        const line = jsLines[i].trim();
        
        // Detect function start
        if ((line.includes('function') || line.includes('=>')) && line.includes('{')) {
          inFunction = true;
          braceCount = 1;
          functionLineCount = 1;
        }
        
        // Count braces in function
        if (inFunction) {
          functionLineCount++;
          
          // Count opening braces
          for (let j = 0; j < line.length; j++) {
            if (line[j] === '{') braceCount++;
            if (line[j] === '}') braceCount--;
          }
          
          // Function end
          if (braceCount === 0) {
            inFunction = false;
            if (functionLineCount > 30) {
              improvedCode = `// MAINTAINABILITY: Consider breaking down functions longer than 30 lines
// This function is ${functionLineCount} lines long
${improvedCode}`;
              hasChanges = true;
              break;
            }
          }
        }
      }
      
      // Check for excessive nesting (more than 3 levels)
      let maxIndent = 0;
      let currentIndent = 0;
      
      for (const line of jsLines) {
        for (let i = 0; i < line.length; i++) {
          if (line[i] === '{') {
            currentIndent++;
            maxIndent = Math.max(maxIndent, currentIndent);
          } else if (line[i] === '}') {
            currentIndent--;
          }
        }
      }
      
      if (maxIndent > 3) {
        improvedCode = `// MAINTAINABILITY: Consider refactoring to reduce nesting (${maxIndent} levels detected)
// Extract nested logic into separate functions with descriptive names
${improvedCode}`;
        hasChanges = true;
      }
      
      // Check for magic numbers
      const magicNumberRegex = /(?<![a-zA-Z0-9_])[0-9]+(?![a-zA-Z0-9_])/g;
      const magicNumbers = code.match(magicNumberRegex);
      
      if (magicNumbers && magicNumbers.length > 5) {
        improvedCode = `// MAINTAINABILITY: Consider replacing magic numbers with named constants
// Example: const MAX_RETRIES = 3; instead of hardcoding 3
${improvedCode}`;
        hasChanges = true;
      }
      
      // Check for commented out code
      let commentedCodeLines = 0;
      for (const line of jsLines) {
        if ((line.trim().startsWith('//') && 
            (line.includes('function') || line.includes('if') || line.includes('for') || line.includes('const'))) || 
            line.trim().startsWith('/*') && line.includes('{')) {
          commentedCodeLines++;
        }
      }
      
      if (commentedCodeLines > 3) {
        improvedCode = `// MAINTAINABILITY: Remove commented-out code blocks
// Use version control instead of keeping old code in comments
${improvedCode}`;
        hasChanges = true;
      }
      
      // Check for inconsistent naming conventions
      const camelCaseVars = code.match(/\blet\s+([a-z][a-zA-Z0-9]*)/g);
      const snake_case_vars = code.match(/\blet\s+([a-z][a-z0-9_]*_[a-z0-9_]*)/g);
      
      if (camelCaseVars && snake_case_vars && camelCaseVars.length > 0 && snake_case_vars.length > 0) {
        improvedCode = `// MAINTAINABILITY: Use consistent naming conventions
// Mixing camelCase and snake_case makes code harder to read
${improvedCode}`;
        hasChanges = true;
      }
      break;
      
    case 'python':
    case 'py':
      // Check for long functions
      const pyLines = code.split('\n');
      let pyFunctionLineCount = 0;
      let pyInFunction = false;
      let pyIndentLevel = 0;
      
      for (let i = 0; i < pyLines.length; i++) {
        const line = pyLines[i];
        const trimmedLine = line.trim();
        
        // Detect function start
        if (trimmedLine.startsWith('def ') && trimmedLine.includes(':')) {
          pyInFunction = true;
          pyFunctionLineCount = 1;
          pyIndentLevel = line.search(/\S/);
        }
        
        // Count lines in function
        if (pyInFunction) {
          pyFunctionLineCount++;
          
          // Function end (when indentation returns to original level or lower)
          if (i < pyLines.length - 1) {
            const nextLine = pyLines[i + 1];
            if (nextLine.trim() !== '' && nextLine.search(/\S/) <= pyIndentLevel) {
              pyInFunction = false;
              if (pyFunctionLineCount > 30) {
                improvedCode = `# MAINTAINABILITY: Consider breaking down functions longer than 30 lines
# This function is ${pyFunctionLineCount} lines long
${improvedCode}`;
                hasChanges = true;
                break;
              }
            }
          }
        }
      }
      
      // Check for excessive nesting
      let pyMaxIndent = 0;
      
      for (const line of pyLines) {
        if (line.trim() === '') continue;
        const indent = line.search(/\S/);
        pyMaxIndent = Math.max(pyMaxIndent, indent);
      }
      
      // Python uses 4 spaces per indent level typically
      const pyIndentLevels = Math.floor(pyMaxIndent / 4);
      if (pyIndentLevels > 3) {
        improvedCode = `# MAINTAINABILITY: Consider refactoring to reduce nesting (${pyIndentLevels} levels detected)
# Extract nested logic into separate functions with descriptive names
${improvedCode}`;
        hasChanges = true;
      }
      
      // Check for inconsistent naming conventions
      const pySnakeCaseVars = code.match(/\b([a-z][a-z0-9_]*)\s*=/g);
      const pyCamelCaseVars = code.match(/\b([a-z][a-zA-Z0-9]*[A-Z][a-zA-Z0-9]*)\s*=/g);
      
      if (pySnakeCaseVars && pyCamelCaseVars && pySnakeCaseVars.length > 0 && pyCamelCaseVars.length > 0) {
        improvedCode = `# MAINTAINABILITY: Use consistent naming conventions (PEP8 recommends snake_case)
# Mixing camelCase and snake_case makes code harder to read
${improvedCode}`;
        hasChanges = true;
      }
      break;
      
    case 'java':
      // Check for long methods
      if (code.split('\n').length > 50) {
        improvedCode = `// MAINTAINABILITY: Consider breaking down methods longer than 50 lines
// Extract related functionality into helper methods with descriptive names
${improvedCode}`;
        hasChanges = true;
      }
      
      // Check for large classes
      if (code.includes('class ') && code.split('\n').length > 300) {
        improvedCode = `// MAINTAINABILITY: Consider breaking down large classes
// This class is over 300 lines long. Consider using the Single Responsibility Principle
${improvedCode}`;
        hasChanges = true;
      }
      
      // Check for long parameter lists
      const longParamListRegex = /\([^)]{80,}\)/;
      if (longParamListRegex.test(code)) {
        improvedCode = `// MAINTAINABILITY: Methods with many parameters are hard to use
// Consider using parameter objects or builder pattern
${improvedCode}`;
        hasChanges = true;
      }
      break;
  }
  
  // Generic maintainability improvements for all languages
  
  // Check for duplicate code blocks
  const lines = code.split('\n');
  const blockSize = 5; // Look for duplicated blocks of 5 lines
  const blocks = new Map<string, number>();
  
  if (lines.length > blockSize * 2) {
    for (let i = 0; i <= lines.length - blockSize; i++) {
      const block = lines.slice(i, i + blockSize).join('\n');
      blocks.set(block, (blocks.get(block) || 0) + 1);
    }
    
    let hasDuplicates = false;
    blocks.forEach((count, block) => {
      if (count > 1 && block.trim().length > 50) { // Only consider substantial blocks
        hasDuplicates = true;
      }
    });
    
    if (hasDuplicates) {
      improvedCode = `// MAINTAINABILITY: Potential duplicate code blocks detected
// Consider extracting repeated logic into reusable functions
${improvedCode}`;
      hasChanges = true;
    }
  }
  
  // Check for TODO comments
  if (code.includes('TODO') || code.includes('FIXME')) {
    improvedCode = `// MAINTAINABILITY: TODO/FIXME comments should be addressed or tracked in issue system
// These comments indicate incomplete or potentially problematic code
${improvedCode}`;
    hasChanges = true;
  }
  
  return { improvedCode, hasChanges };
}

// Export all rules as a collection
export const rules: Rule[] = [
  errorHandlingRule,
  securityBestPracticesRule,
  performanceOptimizationRule,
  testabilityRule,
  accessibilityRule,
  maintainabilityRule
];

// Export default rule set metadata
export default {
  id: 'code-quality-development',
  name: 'Code Quality Development',
  description: 'Rules for ensuring high-quality code development',
  version: '1.0.0',
  rules
}; 