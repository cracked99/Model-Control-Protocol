/**
 * Dashboard Middleware
 * Ensures the dashboard is displayed at the top of each user interaction
 */

import * as agentService from './agent-service';
import * as ruleEngine from '../rule-engine/rule-engine';
import * as monitoringSystem from '../monitoring/monitoring-system';
import * as projectState from '../core/project-state';
import * as projectAnalyzer from '../core/project-analyzer';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Display dashboard status at the top of user interactions
 */
export async function displayDashboardStatus(env: any): Promise<string> {
  try {
    // Check if dashboard is active
    const statusStr = await env.FRAMEWORK_KV?.get('dashboard:status');
    const status = statusStr ? JSON.parse(statusStr) : { active: false };
    
    // If dashboard is not active, start it
    if (!status.active) {
      await agentService.startDashboard(env);
    }
    
    // Get current framework status
    const config = await (await import('../core/init-system')).getConfig(env);
    
    // Get active rules
    const activeRules = ruleEngine.getActiveRules();
    
    // Get system metrics
    const metrics = await monitoringSystem.collectSystemMetrics(env);
    
    // Format active rules list with rule category determination
    const rulesListFormatted = activeRules.map(rule => {
      // Determine category based on rule ID
      let category = 'unknown';
      if (rule.id.includes('core')) {
        category = 'core';
      } else if (rule.id.includes('enhancement')) {
        category = 'enhancement';
      } else if (rule.id.includes('feedback')) {
        category = 'feedback';
      } else if (rule.id.includes('code-quality')) {
        category = 'code-quality';
      }
      
      return `- ${rule.name} (${category})`;
    }).join('\n');
    
    // Check when the last analysis was performed
    const lastAnalysisStr = await env.FRAMEWORK_KV?.get('project:last_analysis');
    const lastAnalysis = lastAnalysisStr ? parseInt(lastAnalysisStr) : 0;
    const now = Date.now();
    
    // If it's been more than 30 minutes since the last analysis, run a new one
    if (now - lastAnalysis > 30 * 60 * 1000) {
      try {
        // Run project analysis asynchronously to update the state
        projectAnalyzer.analyzeAndUpdateProjectState(env).then(() => {
          // Update last analysis timestamp
          env.FRAMEWORK_KV?.put('project:last_analysis', now.toString());
        }).catch(error => {
          console.error('Error running project analysis in background:', error);
        });
      } catch (error) {
        console.error('Error scheduling project analysis:', error);
      }
    }
    
    // Check if project state is empty
    const state = await projectState.getProjectState(env);
    const isEmptyState = state.components.length === 0 && state.tasks.length === 0;
    
    // Get dynamic project overview
    const projectOverview = await generateDynamicProjectOverview(env);
    
    // Get current development phase
    const currentPhase = await generateCurrentPhaseInfo(env);
    
    // Check for custom sections from agents
    const customSections: Record<string, string> = {};
    try {
      // Load known custom sections
      const knownSections = ['agent-notes', 'next-milestones', 'custom-analysis'];
      
      for (const section of knownSections) {
        const sectionData = await getCustomDashboardSection(env, section);
        if (sectionData) {
          customSections[section] = sectionData;
        }
      }
    } catch (error) {
      console.error('Error loading custom dashboard sections:', error);
    }
    
    // Format dashboard output for the Cursor chat interface
    let dashboardOutput = `
📊 **AGENTIC FRAMEWORK STATUS**

**Status**: ${config?.enabled ? '✅ Active' : '❌ Inactive'}
**Loaded Rules**: ${activeRules.length}

**Active Rules**:
${rulesListFormatted}
    
**Performance Metrics**:
- Rule Calls: ${metrics.data.ruleCalls || 0}
- Avg Response Time: ${Math.round(metrics.data.responseTimes?.avg || 0)}ms
- Memory Usage: ${metrics.data.memory?.used || 0}MB`;

    // Add empty state notification if applicable
    if (isEmptyState) {
      dashboardOutput += `\n\n⚠️ **PROJECT STATE IS EMPTY**\nWaiting for Cursor AI Agent to analyze and populate project information.`;
    }

    dashboardOutput += `\n\n📋 **PROJECT OVERVIEW**

${projectOverview}

🔄 **CURRENT DEVELOPMENT PHASE**

${currentPhase}`;

    // Add custom sections if any
    if (Object.keys(customSections).length > 0) {
      for (const [name, content] of Object.entries(customSections)) {
        dashboardOutput += `\n\n📝 **${formatSectionName(name)}**\n\n${content}`;
      }
    }

    // Add update time and analysis info
    dashboardOutput += `\n\n⏱️ **Last Updated**: ${new Date().toLocaleString()}
📊 **AI Analysis**: ${lastAnalysis > 0 ? `Last analyzed ${formatTimeAgo(lastAnalysis)}` : 'Waiting for initial analysis...'}`;
    
    return dashboardOutput;
  } catch (error) {
    console.error('Error displaying dashboard status:', error);
    return `Error displaying dashboard status: ${error instanceof Error ? error.message : String(error)}`;
  }
}

/**
 * Format time ago from timestamp
 */
function formatTimeAgo(timestamp: number): string {
  const now = Date.now();
  const seconds = Math.floor((now - timestamp) / 1000);
  
  if (seconds < 60) {
    return `${seconds} seconds ago`;
  }
  
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  }
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  }
  
  const days = Math.floor(hours / 24);
  return `${days} day${days !== 1 ? 's' : ''} ago`;
}

/**
 * Generate dynamic project overview based on current project state
 */
async function generateDynamicProjectOverview(env: any): Promise<string> {
  try {
    // Check for custom project overview data
    const customOverview = await getCustomDashboardSection(env, 'project-overview');
    if (customOverview) {
      console.log('Using custom project overview data');
      return customOverview;
    }
    
    // Get current project state
    const state = await projectState.getProjectState(env);
    
    // Check if the project state is empty (no components defined yet)
    if (state.components.length === 0) {
      return 'Project state is currently empty. Waiting for AI Agent to analyze and provide project information.';
    }
    
    let overview = '**Implementation Status**:\n';
    
    // Count completed and in-progress components
    const completedComponents = state.components.filter(c => c.status === 'completed');
    const inProgressComponents = state.components.filter(c => c.status === 'in-progress');
    
    overview += `- Completed: ${completedComponents.length} components (${completedComponents.map(c => c.name).join(', ')})\n`;
    overview += `- In Progress: ${inProgressComponents.length} component${inProgressComponents.length !== 1 ? 's' : ''} (${inProgressComponents.map(c => `${c.name} ${c.progress}%`).join(', ')})\n`;
    overview += `- Rule Sets Implemented: ${state.ruleSets.length} (${state.ruleSets.map(rs => rs.name).join(', ')})\n`;
    
    // Add code quality module info if available
    const codeQualityRuleSet = state.ruleSets.find(rs => rs.name === 'Code Quality Development');
    if (codeQualityRuleSet) {
      overview += '\n**Code Quality Module**:\n';
      overview += `- Implemented Rules: ${codeQualityRuleSet.rules.join(', ')}\n`;
    }
    
    // Add features section
    overview += '\n**Features Complete**:\n';
    completedComponents.forEach(component => {
      overview += `- ${component.description}\n`;
    });
    
    // Add next steps from in-progress and planned tasks
    const inProgressTasks = state.tasks.filter(t => t.status === 'in-progress');
    const plannedTasks = state.tasks.filter(t => t.status === 'planned');
    
    if (inProgressTasks.length > 0 || plannedTasks.length > 0) {
      overview += '\n**Next Steps**:\n';
      
      // Add in-progress tasks first
      inProgressTasks.forEach((task, index) => {
        overview += `${index + 1}. ${task.name} - ${task.description} (${task.progress}% complete)\n`;
      });
      
      // Then add planned tasks
      plannedTasks.forEach((task, index) => {
        overview += `${inProgressTasks.length + index + 1}. ${task.name} - ${task.description}\n`;
      });
    }
    
    // Add project health status
    const projectHealth = getProjectHealth(state);
    overview += `\n**Project Health**: ${projectHealth.icon} ${projectHealth.status}`;
    
    return overview;
  } catch (error) {
    console.error('Error generating dynamic project overview:', error);
    
    // Return empty state message instead of hardcoded fallback
    return 'Project overview unavailable. Waiting for AI Agent to analyze the project.';
  }
}

/**
 * Generate current phase information
 */
async function generateCurrentPhaseInfo(env: any): Promise<string> {
  try {
    // Check for custom current phase data
    const customPhaseInfo = await getCustomDashboardSection(env, 'current-phase');
    if (customPhaseInfo) {
      console.log('Using custom current phase data');
      return customPhaseInfo;
    }
    
    // Get current project state
    const state = await projectState.getProjectState(env);
    
    // Check if the project state is empty (no phases defined yet)
    if (state.phases.length === 0) {
      return 'No development phases defined yet. Waiting for AI Agent to analyze project structure.';
    }
    
    // Find current phase
    const currentPhase = state.phases.find(p => p.status === 'current');
    if (!currentPhase) {
      return 'No current phase defined. Waiting for phase assignment.';
    }
    
    // Get completed components for this phase
    const phaseComponents = state.components.filter(c => currentPhase.components.includes(c.name));
    const completedComponents = phaseComponents.filter(c => c.status === 'completed');
    
    // Get in-progress tasks for this phase
    const phaseTasks = state.tasks.filter(t => currentPhase.tasks.includes(t.name));
    const inProgressTasks = phaseTasks.filter(t => t.status === 'in-progress');
    
    // Calculate phase progress
    const phaseProgress = calculatePhaseProgress(currentPhase, phaseComponents, phaseTasks);
    
    // Format output
    let info = `**${currentPhase.name}** (${phaseProgress}% complete)\n`;
    
    // Add completed components
    completedComponents.forEach(component => {
      info += `- ${component.name} ✅ \n`;
    });
    
    // Add in-progress tasks section
    if (inProgressTasks.length > 0) {
      info += '\n**Current Tasks:**\n';
      inProgressTasks.forEach(task => {
        info += `- ${task.name} (${task.progress}% complete)\n`;
      });
    }
    
    return info;
  } catch (error) {
    console.error('Error generating current phase info:', error);
    
    // Return empty state message instead of hardcoded fallback
    return 'Development phase information unavailable. Waiting for AI Agent analysis.';
  }
}

/**
 * Calculate phase progress based on components and tasks
 */
function calculatePhaseProgress(
  phase: projectState.DevelopmentPhase,
  components: projectState.ProjectComponent[],
  tasks: projectState.DevelopmentTask[]
): number {
  // Check for empty arrays to avoid division by zero
  if (components.length === 0 && tasks.length === 0) {
    return 0;
  }
  
  // Calculate component completion
  const componentProgress = components.length > 0
    ? components.reduce((sum, c) => sum + c.progress, 0) / components.length
    : 0;
  
  // Calculate task completion
  const taskProgress = tasks.length > 0
    ? tasks.reduce((sum, t) => sum + t.progress, 0) / tasks.length
    : 0;
  
  // If we have only components or only tasks, don't use the weighted average
  if (components.length === 0) {
    return Math.round(taskProgress);
  }
  
  if (tasks.length === 0) {
    return Math.round(componentProgress);
  }
  
  // Weighted average with more weight on tasks
  return Math.round((componentProgress * 0.4) + (taskProgress * 0.6));
}

/**
 * Calculate project health based on the project state
 */
function getProjectHealth(state: projectState.ProjectState): { status: string; icon: string } {
  // Check if the project state is empty
  if (state.components.length === 0 || state.tasks.length === 0) {
    return { status: 'Not Available - Awaiting Analysis', icon: '⏳' };
  }

  // Calculate total progress across all components
  const totalProgress = state.components.reduce((sum, component) => sum + component.progress, 0);
  const averageProgress = totalProgress / state.components.length;
  
  // Calculate task progress
  const inProgressTasks = state.tasks.filter(t => t.status === 'in-progress');
  const taskProgressSum = inProgressTasks.reduce((sum, task) => sum + task.progress, 0);
  const averageTaskProgress = inProgressTasks.length > 0 ? taskProgressSum / inProgressTasks.length : 0;
  
  // Check for overdue tasks based on lastUpdated timestamp
  const now = Date.now();
  const daysSinceUpdate = (now - state.lastUpdated) / (1000 * 60 * 60 * 24);
  
  if (daysSinceUpdate > 14 && inProgressTasks.length > 0) {
    return { status: 'At Risk - No Recent Updates', icon: '🔴' };
  }
  
  if (averageProgress > 75 && averageTaskProgress > 50) {
    return { status: 'On Track', icon: '✅' };
  }
  
  if (averageProgress > 50 && averageTaskProgress > 30) {
    return { status: 'Progressing Well', icon: '✅' };
  }
  
  if (averageProgress < 30 || averageTaskProgress < 20) {
    return { status: 'Behind Schedule', icon: '🟠' };
  }
  
  return { status: 'On Track', icon: '✅' };
}

/**
 * Get formatted dashboard status as a string
 * This version can be called directly from the chat interface
 */
export async function getChatDashboardStatus(env: any): Promise<string> {
  return displayDashboardStatus(env);
}

/**
 * Middleware to inject dashboard status into responses
 */
export function dashboardMiddleware(env: any) {
  return {
    processRequest: async (request: any, next: () => Promise<any>) => {
      // Display dashboard status first
      await displayDashboardStatus(env);
      
      // Continue with request processing
      return next();
    }
  };
}

/**
 * Update a specific dashboard section with custom data
 * @param env The environment object
 * @param section The dashboard section to update (project-overview, current-phase, next-steps)
 * @param data The new content to display in the section
 * @returns True if the update was successful, false otherwise
 */
export async function updateDashboardSection(env: any, section: string, data: string): Promise<boolean> {
  try {
    console.log(`Updating dashboard section '${section}' with ${data.length} characters of data`);
    
    // Store custom section data in KV
    if (env?.FRAMEWORK_KV) {
      const key = `dashboard:custom:${section}`;
      await env.FRAMEWORK_KV.put(key, data);
      console.log(`Stored custom data for dashboard section '${section}'`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`Error updating dashboard section '${section}':`, error);
    return false;
  }
}

/**
 * Get custom dashboard section data if available
 * @param env The environment object
 * @param section The dashboard section to retrieve
 * @returns The custom section data or null if not found
 */
export async function getCustomDashboardSection(env: any, section: string): Promise<string | null> {
  try {
    if (env?.FRAMEWORK_KV) {
      const key = `dashboard:custom:${section}`;
      const data = await env.FRAMEWORK_KV.get(key);
      return data;
    }
    
    return null;
  } catch (error) {
    console.error(`Error getting custom dashboard section '${section}':`, error);
    return null;
  }
}

/**
 * Format section name for display
 */
function formatSectionName(name: string): string {
  return name
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
} 