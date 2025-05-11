# Automatic Project Analysis Guide for Cursor AI

This guide explains how the Cursor AI system prompt automatically analyzes and updates the project state in the Agentic Framework MCP dashboard.

## Overview

The system prompt has been enhanced to automatically call the `analyze-and-update-project-state` tool in specific scenarios, ensuring the dashboard always reflects an accurate representation of the project.

## Automatic State Reset

The framework now automatically resets the project state when a new chat session begins:

1. **Fresh Start**: Each new conversation begins with an empty project state to ensure consistency
2. **Automatic Analysis**: Shortly after the reset, auto-analysis runs to populate the state with current information
3. **Session Persistence**: Project state changes persist only during the current chat session
4. **Configurable Behavior**: The auto-analysis after reset can be disabled via the settings API

To control automatic reset behavior, use the settings API:

```
// Disable auto-analysis after reset
curl -X POST http://localhost:8787/api/framework/settings \
  -H "Content-Type: application/json" \
  -d '{"autoReset":{"skipAutoAnalysis":true}}'

// Re-enable auto-analysis after reset
curl -X POST http://localhost:8787/api/framework/settings \
  -H "Content-Type: application/json" \
  -d '{"autoReset":{"skipAutoAnalysis":false}}'
```

## Key System Prompt Additions

The following functionality has been added to the Cursor AI system prompt:

1. **Auto-Analysis on Conversation Start**: When a new conversation begins, the system prompt automatically triggers project analysis and updates the dashboard state.

2. **Analysis on Project Structure Inquiries**: When you ask about the project structure, architecture, or components, the system prompt initiates analysis before responding.

3. **Post-Implementation Analysis**: After significant code changes or implementation tasks, the system prompt updates the project state to reflect progress.

4. **Empty State Detection**: If the system detects the "PROJECT STATE IS EMPTY" message, it automatically triggers analysis to populate the dashboard.

## Empty State Handling

The framework now handles empty project states gracefully:

1. **Component Creation**: When updating progress for a component that doesn't exist, the system automatically creates it with appropriate default values
   
2. **Task Creation**: Similar to components, non-existent tasks are created automatically when referenced
   
3. **Default Phase**: If no phases exist, a default "Phase 1: Setup" is created and populated with any components and tasks
   
4. **Error Prevention**: Previous "Cannot set properties of undefined" errors have been fixed by adding proper null checking

This ensures that even if starting from a completely empty project state, agents can still update progress and track development without errors.

## How It Works

The system prompt includes logic similar to:

```javascript
// At the beginning of a conversation or after significant analysis
if (isNewConversation || hasCompletedCodebaseAnalysis) {
  await callMcpTool("analyze-and-update-project-state", { auto_update: true });
  
  // Optional: Add custom analysis summary to dashboard
  await callMcpTool("update-dashboard-data", { 
    section: "custom-analysis", 
    data: "## AI Analysis Results\n\n[Analysis findings here]" 
  });
}
```

## Key Scenarios That Trigger Analysis

The system prompt will automatically trigger project analysis when:

1. A new conversation begins
2. You ask questions like:
   - "What's the project structure?"
   - "Explain the architecture of this codebase"
   - "How is this project organized?"
   - "What components are in this project?"
3. The dashboard shows "PROJECT STATE IS EMPTY"
4. After implementing or modifying significant code

## Testing This Functionality

You can test this functionality by:

1. Starting a new conversation with Cursor AI (automatic reset happens)
2. Asking about the project structure
3. Observing the dashboard getting populated automatically
4. Making changes to the project state during your session
5. Starting a new session and seeing that it resets to a fresh state

## Customizing The Analysis Behavior

To customize how analysis occurs:

1. Edit `agentic-framework-system-prompt.md` to modify when analysis is triggered
2. Modify `system-prompt-addition.txt` for a minimal instruction set
3. Edit `index.ts` in the MCP server if you need to change how the tool functions
4. Use the settings API to control auto-analysis after reset

## Benefits of Automatic Analysis

- Dashboard is always up-to-date with the current project state
- No manual intervention needed to keep project state accurate
- AI responses about the project are more accurate because they're based on fresh analysis
- Transitions between conversations maintain project context
- Progress updates work even on an empty project state
- Each new conversation starts fresh with current information 