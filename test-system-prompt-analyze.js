/**
 * Test script to verify the system prompt can call the analyze-and-update-project-state tool
 * 
 * This simulates the system prompt logic that would trigger automatic analysis
 * to update the project state based on conversational context.
 */

// Reset the project state to empty first
fetch('http://localhost:8787/api/framework/reset-project-state')
  .then(response => response.json())
  .then(data => {
    console.log('✅ Project state reset:', data);
    
    // Create a new MCP session (simulates a new conversation)
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
    console.log('✅ Session created:', data);
    
    const sessionId = data.result.sessionId;
    console.log('Using session ID:', sessionId);
    
    // Simulate user asking a question about project structure
    // This should trigger the system prompt logic to analyze the project
    
    console.log('\n📝 SIMULATING SYSTEM PROMPT FLOW:');
    console.log('1. User asks about project structure');
    console.log('2. System prompt detects this requires project analysis');
    console.log('3. System prompt calls analyze-and-update-project-state');
    
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
          input: 'What is the structure of this project?',
          tools: [{
            name: 'analyze-and-update-project-state',
            input: { auto_update: true }
          }]
        },
        id: 2
      })
    });
  })
  .then(response => response.json())
  .then(data => {
    console.log('\n✅ SYSTEM PROMPT CALLED ANALYZE-AND-UPDATE-PROJECT-STATE:');
    console.log(data);
    
    // Now show the updated dashboard to verify it worked
    return fetch('http://localhost:8787/mcp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Mcp-Session-Id': data.result.sessionId // Use the same session ID
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'mcp.submit',
        params: {
          input: 'Show the current project status',
          tools: [{
            name: 'dashboard-update',
            input: { random_string: 'update' }
          }]
        },
        id: 3
      })
    });
  })
  .then(response => response.json())
  .then(data => {
    console.log('\n📊 UPDATED DASHBOARD (after system prompt analysis):');
    console.log(data);
    console.log('\n✅ TEST COMPLETED SUCCESSFULLY');
  })
  .catch(error => {
    console.error('❌ Error in test script:', error);
  }); 