/**
 * Framework Commands
 * Handles all framework-related commands
 */

import * as ruleEngine from '../rule-engine/rule-engine';
import * as agentService from '../agent/agent-service';
import * as projectAnalyzer from './project-analyzer';

const AVAILABLE_COMMANDS = [
  'status',
  'help',
  'load',
  'unload',
  'reload',
  'list',
  'reset',
  'dashboard',
  'analyze',
  'report',
  'update-progress'
];

/**
 * Handle framework commands
 */
export async function handleFrameworkCommand(args: string[], env: any): Promise<{ status: string; message: string }> {
  try {
    const command = args[0];
    
    if (!AVAILABLE_COMMANDS.includes(command)) {
      return { 
        status: 'error', 
        message: `Unknown command: ${command}. Use "/framework help" for available commands.` 
      };
    }
    
    switch (command) {
      case 'status':
        return await handleStatusCommand(env);
      case 'help':
        return handleHelpCommand();
      case 'load':
        return await handleLoadCommand(args, env);
      case 'unload':
        return await handleUnloadCommand(args, env);
      case 'reload':
        return await handleReloadCommand(env);
      case 'list':
        return await handleListCommand(env);
      case 'reset':
        return await handleResetCommand(env);
      case 'dashboard':
        return await handleDashboardCommand(env);
      case 'analyze':
        return await handleAnalyzeCommand(env);
      case 'report':
        return await handleReportCommand(env);
      case 'update-progress':
        return await handleUpdateProgressCommand(args, env);
      default:
        return { 
          status: 'error', 
          message: `Command not implemented: ${command}` 
        };
    }
  } catch (error) {
    console.error('Error handling framework command:', error);
    return { 
      status: 'error', 
      message: `Error executing command: ${error instanceof Error ? error.message : String(error)}` 
    };
  }
}

/**
 * Handle status command
 */
async function handleStatusCommand(env: any): Promise<{ status: string; message: string }> {
  try {
    // Get active rules
    const activeRules = ruleEngine.getActiveRules();
    
    // Format rules by category
    const rulesByCategory = activeRules.reduce((acc, rule) => {
      const category = rule.id.split(':')[0] || 'unknown';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(rule.name);
      return acc;
    }, {} as Record<string, string[]>);
    
    // Format status message
    let message = `\n======================================\n`;
    message += `📊 AGENTIC FRAMEWORK STATUS 📊\n\n`;
    message += `Status: ✅ Active\n`;
    message += `Loaded Rules: ${activeRules.length}\n\n`;
    
    message += `Active Rules:\n`;
    Object.entries(rulesByCategory).forEach(([category, rules]) => {
      message += `- ${category.charAt(0).toUpperCase() + category.slice(1)} (${rules.length}):\n`;
      rules.forEach(rule => {
        message += `  - ${rule}\n`;
      });
    });
    
    message += `\n======================================`;
    
    return { status: 'success', message };
  } catch (error) {
    console.error('Error handling status command:', error);
    return { 
      status: 'error', 
      message: `Error getting framework status: ${error instanceof Error ? error.message : String(error)}` 
    };
  }
}

/**
 * Handle help command
 */
function handleHelpCommand(): { status: string; message: string } {
  const message = `
  Agentic Framework Commands:
  
  /framework status - Show current framework status
  /framework help   - Show this help message
  /framework load <rule-set> - Load a specific rule set
  /framework unload <rule-set> - Unload a specific rule set
  /framework reload - Reload all active rules
  /framework list   - List all available rule sets
  /framework reset  - Reset framework to default state
  /framework dashboard - Start the framework dashboard
  /framework analyze - Analyze project state
  /framework report - Generate project analysis report
  /framework update-progress - Update project components and tasks progress
  
  Direct Commands:
  /dashboard - Start the dashboard in persistent mode
  /stop-dashboard - Stop the dashboard
  
  Examples:
  /framework load code-quality-development
  /framework unload architectural-guidelines
  /framework update-progress component=API System:75 task=Implement REST API endpoints:80
  `;
  
  return { status: 'success', message };
}

/**
 * Handle load command
 */
async function handleLoadCommand(args: string[], env: any): Promise<{ status: string; message: string }> {
  try {
    if (!args[1]) {
      return { 
        status: 'error', 
        message: 'No rule set specified. Usage: /framework load <rule-set>' 
      };
    }
    
    const ruleSetId = args[1];
    const result = await ruleEngine.loadRuleSet(env, ruleSetId);
    
    if (result) {
      return { 
        status: 'success', 
        message: `Rule set "${ruleSetId}" loaded successfully.` 
      };
    } else {
      return { 
        status: 'error', 
        message: `Failed to load rule set "${ruleSetId}".` 
      };
    }
  } catch (error) {
    console.error('Error handling load command:', error);
    return { 
      status: 'error', 
      message: `Error loading rule set: ${error instanceof Error ? error.message : String(error)}` 
    };
  }
}

/**
 * Handle unload command
 */
async function handleUnloadCommand(args: string[], env: any): Promise<{ status: string; message: string }> {
  try {
    if (!args[1]) {
      return { 
        status: 'error', 
        message: 'No rule set specified. Usage: /framework unload <rule-set>' 
      };
    }
    
    const ruleSetId = args[1];
    const result = await ruleEngine.unloadRuleSet(env, ruleSetId);
    
    if (result) {
      return { 
        status: 'success', 
        message: `Rule set "${ruleSetId}" unloaded successfully.` 
      };
    } else {
      return { 
        status: 'error', 
        message: `Failed to unload rule set "${ruleSetId}".` 
      };
    }
  } catch (error) {
    console.error('Error handling unload command:', error);
    return { 
      status: 'error', 
      message: `Error unloading rule set: ${error instanceof Error ? error.message : String(error)}` 
    };
  }
}

/**
 * Handle reload command
 */
async function handleReloadCommand(env: any): Promise<{ status: string; message: string }> {
  try {
    // Re-initialize the rule engine
    await ruleEngine.initialize(env);
    
    return { 
      status: 'success', 
      message: 'Rules reloaded successfully.' 
    };
  } catch (error) {
    console.error('Error handling reload command:', error);
    return { 
      status: 'error', 
      message: `Error reloading rules: ${error instanceof Error ? error.message : String(error)}` 
    };
  }
}

/**
 * Handle list command
 */
async function handleListCommand(env: any): Promise<{ status: string; message: string }> {
  try {
    // For a complete implementation, this would get available rule sets from storage
    
    // Simplified version for demo
    const ruleSetsList = [
      'core-agent-behavior',
      'rule-prioritization',
      'context-retention',
      'feedback-integration',
      'code-quality-development'
    ];
    
    // Format message
    let message = 'Available Rule Sets:\n\n';
    ruleSetsList.forEach(ruleSet => {
      message += `- ${ruleSet}\n`;
    });
    
    return { status: 'success', message };
  } catch (error) {
    console.error('Error handling list command:', error);
    return { 
      status: 'error', 
      message: `Error listing rule sets: ${error instanceof Error ? error.message : String(error)}` 
    };
  }
}

/**
 * Handle reset command
 */
async function handleResetCommand(env: any): Promise<{ status: string; message: string }> {
  try {
    // Re-initialize the rule engine
    await ruleEngine.initialize(env);
    
    return { 
      status: 'success', 
      message: 'Framework reset to default state.' 
    };
  } catch (error) {
    console.error('Error handling reset command:', error);
    return { 
      status: 'error', 
      message: `Error resetting framework: ${error instanceof Error ? error.message : String(error)}` 
    };
  }
}

/**
 * Handle dashboard command
 */
async function handleDashboardCommand(env: any): Promise<{ status: string; message: string }> {
  try {
    console.log('Generating dynamic dashboard...');
    
    const { analyzeProject } = await import('./project-analyzer');
    console.log('Calling analyzeProject to gather dynamic project data...');
    const analysis = await analyzeProject();
    
    // Log analysis data to verify content
    console.log('Analysis complete with data:');
    console.log(`- Components: ${analysis.componentsStatus.completed}/${analysis.componentsStatus.total} complete`);
    console.log(`- Current phase: ${analysis.developmentPhase.current} (${analysis.developmentPhase.percentage}%)`);
    
    const ruleEngine = await import('../rule-engine/rule-engine');
    const monitoringSystem = await import('../monitoring/monitoring-system');
    
    const activeRules = ruleEngine.getActiveRules();
    const metrics = await monitoringSystem.getMetrics(env);
    
    // Format the dashboard output
    const dashboard = `
📊 **AGENTIC FRAMEWORK STATUS**

**Status**: ✅ Active
**Loaded Rules**: ${activeRules.length}

**Active Rules**:
${activeRules.map((rule: any) => `- ${rule.name} (${rule.category || 'unknown'})`).join('\n')}
    
**Performance Metrics**:
- Rule Calls: ${metrics.ruleCalls || 0}
- Avg Response Time: ${metrics.responseTimeAvg || 0}ms
- Memory Usage: ${metrics.memoryUsage || 0}MB

📋 **PROJECT OVERVIEW**

**Implementation Status**:
- Completed: ${analysis.componentsStatus.completed} components (${analysis.completedComponents.join(', ')})
- In Progress: ${analysis.inProgressComponents.length} component${analysis.inProgressComponents.length !== 1 ? 's' : ''} (${analysis.inProgressComponents.map(c => `${c.name} ${c.percentage}%`).join(', ')})
- Rule Sets Implemented: ${analysis.ruleSetsStatus.active} (${activeRules.map((r: any) => r.category).filter((v: any, i: number, a: any[]) => a.indexOf(v) === i).join(', ')})

**Code Quality Module**:
- Implemented Rules: Testability, Security, Performance, Error Handling, Accessibility, Maintainability

**Features Complete**:
- Basic framework structure with initialization system
- Rule processing, loading, and execution mechanisms
- Agent request handling and response processing
- Performance metrics collection and analysis
- Agent context retention and processing

**Next Steps**:
${analysis.priorityRecommendations.map((rec, i) => `${i + 1}. ${rec}`).join('\n')}

**Project Health**: ✅ ${analysis.projectHealth === 'good' ? 'Progressing Well' : 'Excellent'}

🔄 **CURRENT DEVELOPMENT PHASE**

**${analysis.developmentPhase.current}** (${analysis.developmentPhase.percentage}% complete)
- ${analysis.completedComponents[0]} ✅ 

**Current Tasks:**
${analysis.inProgressComponents.map(c => `- ${c.name} (${c.percentage}% complete)`).join('\n')}


⏱️ **Last Updated**: ${new Date().toLocaleString()}
📊 **AI Analysis**: Last analyzed ${Math.floor((Date.now() - (env.lastAnalysis || Date.now())) / 1000)} seconds ago`;

    // Store last analysis time
    env.lastAnalysis = Date.now();
    console.log('Dashboard generated successfully with dynamic data');
    
    return { status: 'success', message: dashboard };
  } catch (error) {
    console.error('Error in dashboard command:', error);
    return { status: 'error', message: `Failed to generate dashboard: ${error instanceof Error ? error.message : String(error)}` };
  }
}

/**
 * Handle analyze command to analyze project state
 */
async function handleAnalyzeCommand(env: any): Promise<{ status: string; message: string }> {
  try {
    // Start analysis
    console.log('Starting in-depth project analysis...');
    
    // Perform analysis
    const result = await projectAnalyzer.analyzeAndUpdateProjectState(env);
    
    return { 
      status: 'success', 
      message: `Project analysis complete. Found ${result.components.length} components and ${result.tasks.length} tasks. Current phase: ${result.currentPhase}.` 
    };
  } catch (error) {
    console.error('Error handling analyze command:', error);
    return { 
      status: 'error', 
      message: `Error analyzing project: ${error instanceof Error ? error.message : String(error)}` 
    };
  }
}

/**
 * Handle report command to generate project report
 */
async function handleReportCommand(env: any): Promise<{ status: string; message: string }> {
  try {
    // Generate project report
    console.log('Generating project analysis report...');
    
    // Generate report
    const report = await projectAnalyzer.generateProjectAnalysisReport(env);
    
    return { 
      status: 'success', 
      message: report
    };
  } catch (error) {
    console.error('Error handling report command:', error);
    return { 
      status: 'error', 
      message: `Error generating project report: ${error instanceof Error ? error.message : String(error)}` 
    };
  }
}

/**
 * Handle framework progress update command
 * Format: /framework update-progress component=Component Name:progress,... task=Task Name:progress,...
 * or: /framework update-progress phase=3
 */
async function handleUpdateProgressCommand(args: string[], env: any): Promise<{ status: string; message: string }> {
  try {
    const { updateProjectProgress, updateCurrentPhase } = await import('./project-state');
    
    // Check for phase update
    const phaseArg = args.find(arg => arg.startsWith('phase='));
    if (phaseArg) {
      const phaseId = parseInt(phaseArg.substring('phase='.length), 10);
      if (!isNaN(phaseId) && phaseId >= 1 && phaseId <= 4) {
        console.log(`Updating current phase to ${phaseId}`);
        const result = await updateCurrentPhase(env, phaseId);
        const currentPhase = result.phases.find(p => p.id === phaseId);
        
        return {
          status: 'success',
          message: `Project phase updated successfully.\nCurrent phase: ${currentPhase?.name || 'Unknown'} (Phase ${phaseId})`
        };
      }
    }
    
    // Parse components and tasks from args
    const componentUpdates: { name: string; progress: number }[] = [];
    const taskUpdates: { name: string; progress: number }[] = [];
    
    // Skip the first arg which is the command name
    for (let i = 1; i < args.length; i++) {
      const arg = args[i];
      
      if (arg.startsWith('component=')) {
        // Format: component=ComponentName:progress
        const componentData = arg.substring('component='.length);
        const [name, progressStr] = componentData.split(':');
        if (name && progressStr) {
          const progress = parseInt(progressStr, 10);
          if (!isNaN(progress) && progress >= 0 && progress <= 100) {
            componentUpdates.push({ name, progress });
          }
        }
      } else if (arg.startsWith('task=')) {
        // Format: task=TaskName:progress
        const taskData = arg.substring('task='.length);
        const [name, progressStr] = taskData.split(':');
        if (name && progressStr) {
          const progress = parseInt(progressStr, 10);
          if (!isNaN(progress) && progress >= 0 && progress <= 100) {
            taskUpdates.push({ name, progress });
          }
        }
      }
    }
    
    // Validate that we have updates to make
    if (componentUpdates.length === 0 && taskUpdates.length === 0) {
      return {
        status: 'error',
        message: 'No valid component or task updates provided. Format: /framework update-progress component=Component Name:progress task=Task Name:progress'
      };
    }
    
    // Update project progress
    const result = await updateProjectProgress(env, componentUpdates, taskUpdates);
    
    return {
      status: 'success',
      message: `Project progress updated successfully.\nUpdated ${componentUpdates.length} components and ${taskUpdates.length} tasks.\nCurrent phase: ${result.phases.find(p => p.status === 'current')?.name || 'Unknown'}`
    };
  } catch (error) {
    console.error('Error handling update-progress command:', error);
    return {
      status: 'error',
      message: `Error updating project progress: ${error instanceof Error ? error.message : String(error)}`
    };
  }
} 