/**
 * Test script to demonstrate the agentic framework functionality
 * 
 * This script shows how an AI agent can analyze a project and 
 * dynamically populate the project state in the MCP dashboard.
 */

const SESSION_ID = 'test_session_' + Date.now();

// First, reset the project state to empty
fetch('http://localhost:8787/api/framework/reset-project-state')
  .then(response => response.json())
  .then(data => {
    console.log('Project state reset:', data);
    
    // Create a session first
    return fetch('http://localhost:8787/mcp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'mcp.createSession',
        params: {},
        id: 1
      })
    });
  })
  .then(response => response.json())
  .then(data => {
    console.log('Session created:', data);
    
    if (!data.result || !data.result.sessionId) {
      throw new Error('Failed to get session ID');
    }
    
    // Store the session ID for all subsequent requests
    const sessionId = data.result.sessionId;
    console.log('Using session ID:', sessionId);
    
    // Now simulate an AI agent analyzing the project and populating state
    return runWithSession(sessionId);
  })
  .catch(error => {
    console.error('Error in test script:', error);
  });

// Run all API calls with the same session
function runWithSession(sessionId) {
  // First populate project state
  return fetch('http://localhost:8787/mcp', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Mcp-Session-Id': sessionId
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'mcp.submit',
      params: {
        input: 'Initialize project state',
        tools: [{
          name: 'initialize-project-state',
          input: {
            components: [
              {
                name: 'Core Framework',
                status: 'completed',
                progress: 100,
                description: 'Basic framework structure with initialization system'
              },
              {
                name: 'Rule Engine',
                status: 'completed',
                progress: 100,
                description: 'Rule processing, loading, and execution mechanisms'
              },
              {
                name: 'Agent Service',
                status: 'in-progress',
                progress: 75,
                description: 'Agent request handling and response processing'
              },
              {
                name: 'Monitoring System',
                status: 'in-progress',
                progress: 60,
                description: 'Performance metrics collection and analysis'
              }
            ],
            ruleSets: [
              {
                name: 'Core Agent Behavior',
                status: 'active',
                rules: ['Conciseness', 'Helpfulness', 'Accuracy'],
                description: 'Fundamental agent behavior rules'
              },
              {
                name: 'Enhancement Rules',
                status: 'active',
                rules: ['Code Formatting', 'Explanation Clarity'],
                description: 'General enhancement rules'
              }
            ],
            tasks: [
              {
                name: 'Implement Core Framework',
                status: 'completed',
                progress: 100,
                description: 'Create the basic framework structure'
              },
              {
                name: 'Create Rule Engine',
                status: 'completed',
                progress: 100,
                description: 'Implement rule processing engine'
              },
              {
                name: 'Develop Agent Communication',
                status: 'in-progress',
                progress: 75,
                description: 'Create agent communication protocol'
              },
              {
                name: 'Set Up Monitoring',
                status: 'in-progress',
                progress: 60,
                description: 'Implement performance monitoring'
              },
              {
                name: 'Add API Integration',
                status: 'planned',
                progress: 0,
                description: 'Implement API connections'
              }
            ],
            phases: [
              {
                id: 1,
                name: 'Core Infrastructure Setup',
                status: 'completed',
                components: ['Core Framework'],
                tasks: ['Implement Core Framework'],
                description: 'Setting up the core infrastructure for the Agentic Framework'
              },
              {
                id: 2,
                name: 'Rule System Implementation',
                status: 'completed',
                components: ['Rule Engine'],
                tasks: ['Create Rule Engine'],
                description: 'Implementing the rule system and context management'
              },
              {
                id: 3,
                name: 'Agent Integration',
                status: 'current',
                components: ['Agent Service'],
                tasks: ['Develop Agent Communication'],
                description: 'Integrating agent services and creating API endpoints'
              },
              {
                id: 4,
                name: 'Monitoring & Optimization',
                status: 'upcoming',
                components: ['Monitoring System'],
                tasks: ['Set Up Monitoring', 'Add API Integration'],
                description: 'Optimizing performance and preparing for deployment'
              }
            ],
            currentPhase: 3
          }
        }]
      },
      id: 2
    })
  })
  .then(response => response.json())
  .then(data => {
    console.log('AI Agent populated project state:', data);
    
    // Now add a custom section to the dashboard
    return fetch('http://localhost:8787/mcp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Mcp-Session-Id': sessionId
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'mcp.submit',
        params: {
          input: 'Update dashboard with custom analysis',
          tools: [{
            name: 'update-dashboard-data',
            input: {
              section: 'custom-analysis',
              data: `## AI Agent Project Analysis

Based on my examination of the codebase, I've identified several key implementation patterns:

1. The project uses a modular architecture with clear separation of concerns
2. The rule system is well-designed but could benefit from additional rule categories
3. Agent communication appears robust but needs additional error handling
4. Monitoring is partially implemented with good foundational metrics collection

**Recommendations**:
- Enhance error handling in agent communication flows
- Add more comprehensive monitoring for rule execution
- Consider implementing a caching layer for improved performance`
            }
          }]
        },
        id: 3
      })
    });
  })
  .then(response => response.json())
  .then(data => {
    console.log('Added custom dashboard section:', data);
    
    // Display final dashboard
    return fetch('http://localhost:8787/mcp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Mcp-Session-Id': sessionId
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'mcp.submit',
        params: {
          input: 'Update dashboard',
          tools: [{
            name: 'dashboard-update',
            input: {
              random_string: 'update'
            }
          }]
        },
        id: 4
      })
    });
  })
  .then(response => response.json())
  .then(data => {
    console.log('Final dashboard state:', data);
    return data;
  });
} 