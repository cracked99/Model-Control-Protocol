# System Prompt Instructions for Agentic Framework

Include these instructions in the Cursor AI system prompt to ensure automatic project state updates after in-depth analysis.

## Project Analysis and State Management

```
// Project Analysis and State Management
// This section must be included in the system prompt 

async function performProjectAnalysis() {
  // Call the analyze-and-update-project-state tool to automatically update project state
  const result = await callFrameworkTool("analyze-and-update-project-state", {
    auto_update: true
  });
  
  // Log analysis completion
  console.log("Project analysis and state update complete");
  
  // Return the result for potential further processing
  return result;
}

// Add hooks for when to perform analysis:

// 1. On initial conversation start with a new user
async function onConversationStart() {
  await performProjectAnalysis();
  console.log("Initial project analysis complete");
}

// 2. After significant code changes detected
async function onSignificantCodeChanges(changedFiles) {
  // Only run analysis if certain important files changed
  const shouldRunAnalysis = changedFiles.some(file => {
    return file.includes('src/') || file.includes('package.json');
  });
  
  if (shouldRunAnalysis) {
    await performProjectAnalysis();
    console.log("Project analysis after code changes complete");
  }
}

// 3. After user explicitly asks for project analysis
async function onAnalysisRequested() {
  await performProjectAnalysis();
  console.log("User-requested project analysis complete");
}

// Register the last function as a command handler
registerCommand("analyze-project", onAnalysisRequested);
```

## Integration with Conversation Flow

When the agent detects any of these scenarios, it should automatically trigger project analysis and state updates:

1. **Initial Conversation**: When a user first starts a conversation with the agent
2. **Code Understanding**: When the user asks about the project structure or codebase
3. **After Significant Changes**: After the agent or user has made substantial code changes
4. **Explicit Request**: When the user specifically asks for analysis

## Sample Command Handling

```
// Example of handling user commands related to project analysis

async function handleUserMessage(message) {
  // Check for direct requests for analysis
  if (message.includes("analyze") && (message.includes("project") || message.includes("codebase"))) {
    await onAnalysisRequested();
    return;
  }
  
  // Check for project understanding requests
  if (
    (message.includes("understand") || message.includes("explain")) && 
    (message.includes("project") || message.includes("codebase") || message.includes("structure"))
  ) {
    await performProjectAnalysis();
    return;
  }
  
  // Handle other message types
  processNormalMessage(message);
}
```

## Example System Prompt Addition

Add this block to your existing system prompt:

```
You are an AI agent that helps manage the Agentic Framework project. After any in-depth analysis of the codebase, you MUST update the project state by calling the analyze-and-update-project-state tool with auto_update set to true.

You should automatically perform project analysis and state updates in these scenarios:
1. At the beginning of a new conversation 
2. After significant code changes
3. When the user asks about project structure
4. When explicitly requested to analyze the project

Always maintain an up-to-date representation of the project in the dashboard. Never leave the project state empty after you've analyzed the code.
``` 