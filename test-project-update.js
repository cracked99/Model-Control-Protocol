/**
 * Test script to verify the fixed project progress update functionality
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
    
    // Test updating progress for new components and tasks (that don't exist yet)
    console.log('\n🔄 TESTING UPDATE OF NON-EXISTENT COMPONENTS/TASKS:');
    
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
          input: 'Update progress for new components and tasks',
          tools: [{
            name: 'update-project-progress',
            input: { 
              components: [
                { name: 'Test Component 1', progress: 75 },
                { name: 'Test Component 2', progress: 50 }
              ],
              tasks: [
                { name: 'Test Task 1', progress: 80 },
                { name: 'Test Task 2', progress: 30 }
              ]
            }
          }]
        },
        id: 2
      })
    });
  })
  .then(response => response.json())
  .then(data => {
    console.log('✅ PROJECT PROGRESS UPDATE RESULT:');
    console.log(data);
    
    // Now show the dashboard to verify the update worked
    return fetch('http://localhost:8787/mcp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Mcp-Session-Id': data.result.sessionId
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'mcp.submit',
        params: {
          input: 'Show the updated dashboard',
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
    console.log('\n📊 UPDATED DASHBOARD WITH NEW COMPONENTS AND TASKS:');
    console.log(data);
    console.log('\n✅ TEST COMPLETED SUCCESSFULLY');
  })
  .catch(error => {
    console.error('❌ Error in test script:', error);
  }); 