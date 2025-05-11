/**
 * Test script for the Agentic Framework MCP Server
 * 
 * This script tests the basic functionality of the framework by making API calls
 * to the server and verifying the responses.
 */

// Run this script with: node test-framework.js

const API_BASE = 'http://localhost:8787';
const fetch = require('node-fetch');

// MCP server URL
const MCP_URL = 'http://localhost:8787/mcp';
// Session ID
const SESSION_ID = 'cursor_session';

// Execute a framework command
async function executeFrameworkCommand(command, args = []) {
  try {
    const response = await fetch(MCP_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Mcp-Session-Id': SESSION_ID
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'mcp.execute',
        params: {
          name: 'framework',
          input: {
            command,
            args
          }
        },
        id: Date.now()
      })
    });
    
    const result = await response.json();
    
    if (result.error) {
      console.error('Error executing framework command:', result.error);
      return null;
    }
    
    return result.result.content[0].text;
  } catch (error) {
    console.error('Error executing framework command:', error);
    return null;
  }
}

// Call a direct framework tool command
async function executeDirectFrameworkTool(toolName, params = {}) {
  try {
    const response = await fetch(MCP_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Mcp-Session-Id': SESSION_ID
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'mcp.execute',
        params: {
          name: toolName,
          input: params
        },
        id: Date.now()
      })
    });
    
    const result = await response.json();
    
    if (result.error) {
      console.error(`Error executing ${toolName}:`, result.error);
      return null;
    }
    
    return result.result.content[0].text;
  } catch (error) {
    console.error(`Error executing ${toolName}:`, error);
    return null;
  }
}

// Update dashboard data
async function updateDashboardData(section, data) {
  try {
    const response = await fetch(MCP_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Mcp-Session-Id': SESSION_ID
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'mcp.execute',
        params: {
          name: 'update-dashboard-data',
          input: {
            section,
            data
          }
        },
        id: Date.now()
      })
    });
    
    const result = await response.json();
    
    if (result.error) {
      console.error('Error updating dashboard data:', result.error);
      return null;
    }
    
    return result.result.content[0].text;
  } catch (error) {
    console.error('Error updating dashboard data:', error);
    return null;
  }
}

// Create a session
async function createSession() {
  try {
    const response = await fetch(MCP_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'mcp.createSession',
        params: {},
        id: Date.now()
      })
    });
    
    const result = await response.json();
    
    if (result.error) {
      console.error('Error creating session:', result.error);
      return null;
    }
    
    return result.result.sessionId;
  } catch (error) {
    console.error('Error creating session:', error);
    return null;
  }
}

// Update project progress
async function updateProjectProgress(components = [], tasks = []) {
  try {
    const response = await fetch(MCP_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Mcp-Session-Id': SESSION_ID
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'mcp.execute',
        params: {
          name: 'update-project-progress',
          input: { components, tasks }
        },
        id: Date.now()
      })
    });
    
    const result = await response.json();
    
    if (result.error) {
      console.error('Error updating project progress:', result.error);
      return null;
    }
    
    return result.result.content[0].text;
  } catch (error) {
    console.error('Error updating project progress:', error);
    return null;
  }
}

// Start dashboard via dashboard tool
async function startDashboard() {
  try {
    const response = await fetch(MCP_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Mcp-Session-Id': SESSION_ID
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'mcp.execute',
        params: {
          name: 'dashboard',
          input: { random_string: 'dashboard' }
        },
        id: Date.now()
      })
    });
    
    const result = await response.json();
    
    if (result.error) {
      console.error('Error starting dashboard:', result.error);
      return null;
    }
    
    console.log('Dashboard started successfully');
    return true;
  } catch (error) {
    console.error('Error starting dashboard:', error);
    return null;
  }
}

// Test direct framework tool commands
async function testDirectFrameworkTools() {
  console.log('\nTesting direct framework tool commands...');
  
  // Test framework status direct tool
  console.log('\nGetting framework status using direct tool...');
  const statusResult = await executeDirectFrameworkTool('framework-status');
  console.log(statusResult);
  
  // Test framework help direct tool
  console.log('\nGetting framework help using direct tool...');
  const helpResult = await executeDirectFrameworkTool('framework-help');
  console.log(helpResult);
  
  // Test list rule sets direct tool
  console.log('\nListing rule sets using direct tool...');
  const listResult = await executeDirectFrameworkTool('list-rule-sets');
  console.log(listResult);
  
  // Generate a project report
  console.log('\nGenerating project report using direct tool...');
  const reportResult = await executeDirectFrameworkTool('generate-project-report');
  console.log(reportResult);
  
  return true;
}

// Main function to run tests
async function main() {
  // Create a session first
  console.log('Creating session...');
  const sessionId = await createSession();
  console.log('Session created:', sessionId);
  
  // Start the dashboard
  console.log('Starting dashboard...');
  await startDashboard();
  
  // Test framework commands
  console.log('\nTesting framework commands...');
  
  // Test framework status command
  console.log('\nGetting framework status...');
  const statusResult = await executeFrameworkCommand('status');
  console.log(statusResult);
  
  // Test updating project progress
  console.log('\nUpdating project progress...');
  const components = [
    { name: 'API System', progress: 70 }
  ];
  const tasks = [
    { name: 'Implement REST API endpoints', progress: 70 },
    { name: 'Add WebSocket support', progress: 40 },
    { name: 'Complete API documentation', progress: 30 }
  ];
  const progressResult = await updateProjectProgress(components, tasks);
  console.log(progressResult);
  
  // Test updating dashboard data
  console.log('\nUpdating dashboard data...');
  const agentNotes = 
`* Dashboard now dynamically shows data from agents
* API implementation is on track (70% complete)
* WebSocket support is being implemented (40%)
* Next milestone: Complete REST API endpoints by next week`;
  
  const dataResult = await updateDashboardData('agent-notes', agentNotes);
  console.log(dataResult);
  
  // Test direct framework tool commands
  await testDirectFrameworkTools();
  
  console.log('\nTests completed successfully');
}

// Run the tests
main().catch(error => {
  console.error('Error running tests:', error);
}); 