/**
 * Test script for the Agentic Framework MCP Server
 * 
 * This script tests the basic functionality of the framework by making API calls
 * to the server and verifying the responses.
 */

// Run this script with: node test-framework.js

const API_BASE = 'http://localhost:8787';

async function testFramework() {
  console.log('Testing Agentic Framework MCP Server...');
  
  try {
    // Test 1: Initialize the framework
    console.log('\n1. Testing framework initialization...');
    const initResponse = await fetch(`${API_BASE}/api/framework/initialize`, {
      method: 'POST'
    });
    
    if (!initResponse.ok) {
      console.error(`Initialization failed with status ${initResponse.status}: ${initResponse.statusText}`);
      const text = await initResponse.text();
      console.error('Response body:', text);
    } else {
      const initData = await initResponse.json();
      console.log('Initialization response:', initData);
    }
    
    // Test 2: Get framework status
    console.log('\n2. Testing framework status...');
    const statusResponse = await fetch(`${API_BASE}/api/framework/status`);
    
    if (!statusResponse.ok) {
      console.error(`Status request failed with status ${statusResponse.status}: ${statusResponse.statusText}`);
      const text = await statusResponse.text();
      console.error('Response body:', text);
    } else {
      const statusData = await statusResponse.json();
      console.log('Status response:', statusData);
    }
    
    // Test 3: List available rules
    console.log('\n3. Testing rule listing...');
    const rulesResponse = await fetch(`${API_BASE}/api/framework/rules/list`);
    
    if (!rulesResponse.ok) {
      console.error(`Rules listing failed with status ${rulesResponse.status}: ${rulesResponse.statusText}`);
      const text = await rulesResponse.text();
      console.error('Response body:', text);
    } else {
      const rulesData = await rulesResponse.json();
      console.log('Rules response:', rulesData);
    }
    
    // Test 4: Process a request through the agent
    console.log('\n4. Testing agent request processing...');
    const agentResponse = await fetch(`${API_BASE}/api/agent/process`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        id: 'test-request-1',
        sessionId: 'test-session-1',
        content: 'Hello, agent!',
        metadata: {
          source: 'test-script'
        }
      })
    });
    
    if (!agentResponse.ok) {
      console.error(`Agent request failed with status ${agentResponse.status}: ${agentResponse.statusText}`);
      const text = await agentResponse.text();
      console.error('Response body:', text);
    } else {
      const agentData = await agentResponse.json();
      console.log('Agent response:', agentData);
    }
    
    // Test 5: Get monitoring metrics
    console.log('\n5. Testing monitoring metrics...');
    const metricsResponse = await fetch(`${API_BASE}/api/monitoring/metrics`);
    
    if (!metricsResponse.ok) {
      console.error(`Metrics request failed with status ${metricsResponse.status}: ${metricsResponse.statusText}`);
      const text = await metricsResponse.text();
      console.error('Response body:', text);
    } else {
      const metricsData = await metricsResponse.json();
      console.log('Metrics response:', metricsData);
    }
    
    // Test 6: Use the framework command tool
    console.log('\n6. Testing framework command tool...');
    const commandResponse = await fetch(`${API_BASE}/mcp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        input: 'Use the framework tool to get status',
        tools: [
          {
            name: 'framework',
            input: {
              command: 'status',
              args: []
            }
          }
        ]
      })
    });
    
    if (!commandResponse.ok) {
      console.error(`Command request failed with status ${commandResponse.status}: ${commandResponse.statusText}`);
      const text = await commandResponse.text();
      console.error('Response body:', text);
    } else {
      const commandData = await commandResponse.json();
      console.log('Command response:', commandData);
    }
    
    console.log('\nAll tests completed!');
  } catch (error) {
    console.error('Error during tests:', error);
  }
}

// Run the tests
testFramework(); 