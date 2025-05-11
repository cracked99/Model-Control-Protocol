/**
 * Test script to demonstrate automatic project analysis and state updates
 * 
 * This simulates how the system prompt would trigger automatic analysis
 * and update the project state in the MCP dashboard.
 */

// First, reset the project state to empty
fetch('http://localhost:8787/api/framework/reset-project-state')
  .then(response => response.json())
  .then(data => {
    console.log('✅ Project state reset:', data);
    
    // Create a session
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
    
    if (!data.result || !data.result.sessionId) {
      throw new Error('Failed to get session ID');
    }
    
    const sessionId = data.result.sessionId;
    console.log('Using session ID:', sessionId);
    
    // Show the empty dashboard first
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
          input: 'Show current dashboard',
          tools: [{
            name: 'dashboard-update',
            input: { random_string: 'update' }
          }]
        },
        id: 2
      })
    })
    .then(response => response.json())
    .then(data => {
      console.log('📊 EMPTY DASHBOARD STATE:');
      console.log(data);
      
      // Now simulate a system prompt triggering automatic analysis and update
      console.log('\n🔍 PERFORMING AUTO-ANALYSIS (simulating system prompt behavior)...\n');
      
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
            input: 'Analyze project and update state',
            tools: [{
              name: 'analyze-and-update-project-state',
              input: { auto_update: true }
            }]
          },
          id: 3
        })
      });
    });
  })
  .then(response => response.json())
  .then(data => {
    console.log('✅ AUTO-ANALYSIS AND STATE UPDATE COMPLETE:');
    console.log(data);
    
    // Now show the updated dashboard with the populated state
    console.log('\n📊 UPDATED DASHBOARD (automatically populated by analysis):\n');
    
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
          input: 'Show updated dashboard',
          tools: [{
            name: 'dashboard-update',
            input: { random_string: 'update' }
          }]
        },
        id: 4
      })
    });
  })
  .then(response => response.json())
  .then(data => {
    console.log(data);
    console.log('\n✅ TEST COMPLETED SUCCESSFULLY');
  })
  .catch(error => {
    console.error('❌ Error in test script:', error);
  }); 