/**
 * Project State Management
 * Tracks and updates the current state of the project
 */

// Project component status types
export type ComponentStatus = 'completed' | 'in-progress' | 'planned';
export type RuleStatus = 'active' | 'available' | 'in-development';
export type TaskStatus = 'completed' | 'in-progress' | 'planned';

// Project state interfaces
export interface ProjectComponent {
  name: string;
  status: ComponentStatus;
  progress: number; // 0-100
  description: string;
}

export interface RuleSet {
  name: string;
  status: RuleStatus;
  rules: string[];
  description: string;
}

export interface DevelopmentTask {
  name: string;
  status: TaskStatus;
  progress: number; // 0-100
  description: string;
}

export interface DevelopmentPhase {
  id: number;
  name: string;
  status: 'completed' | 'current' | 'upcoming';
  components: string[];
  tasks: string[];
  description: string;
}

export interface ProjectState {
  components: ProjectComponent[];
  ruleSets: RuleSet[];
  tasks: DevelopmentTask[];
  phases: DevelopmentPhase[];
  currentPhase: number;
  lastUpdated: number;
}

// Initial project state
const initialProjectState: ProjectState = {
  components: [],
  ruleSets: [],
  tasks: [],
  phases: [],
  currentPhase: 0,
  lastUpdated: Date.now()
};

// Current project state - will be initialized with the initial state and then updated
let currentProjectState: ProjectState = { ...initialProjectState };

/**
 * Get project state from KV storage or initialize if not present
 */
export async function getProjectState(env: any): Promise<ProjectState> {
  try {
    // Try to get from KV
    if (env?.FRAMEWORK_KV) {
      const storedState = await env.FRAMEWORK_KV.get('project:state', { type: 'json' });
      if (storedState) {
        // Update the current project state
        currentProjectState = storedState as ProjectState;
        return storedState as ProjectState;
      }
    }
    
    // If not in KV, initialize and store
    if (env?.FRAMEWORK_KV) {
      await env.FRAMEWORK_KV.put('project:state', JSON.stringify(initialProjectState));
    }
    
    // Make sure currentProjectState is up to date
    currentProjectState = { ...initialProjectState };
    return initialProjectState;
  } catch (error) {
    console.error('Error getting project state:', error);
    return initialProjectState;
  }
}

/**
 * Update project state in KV storage
 */
export async function updateProjectState(env: any, state: Partial<ProjectState>): Promise<ProjectState> {
  try {
    // Get current state
    const currentState = await getProjectState(env);
    
    // Merge with updates
    const updatedState: ProjectState = {
      ...currentState,
      ...state,
      lastUpdated: Date.now()
    };
    
    // Store updated state
    if (env?.FRAMEWORK_KV) {
      await env.FRAMEWORK_KV.put('project:state', JSON.stringify(updatedState));
    }
    
    // Update the current project state
    currentProjectState = { ...updatedState };
    
    return updatedState;
  } catch (error) {
    console.error('Error updating project state:', error);
    throw error;
  }
}

/**
 * Update component status and progress
 */
export async function updateComponentStatus(
  env: any, 
  componentName: string, 
  status: ComponentStatus, 
  progress: number
): Promise<ProjectState> {
  try {
    // Get current state
    const currentState = await getProjectState(env);
    
    // Find and update component
    const updatedComponents = currentState.components.map(component => {
      if (component.name === componentName) {
        return {
          ...component,
          status,
          progress
        };
      }
      return component;
    });
    
    // Update state with modified components
    return updateProjectState(env, { components: updatedComponents });
  } catch (error) {
    console.error('Error updating component status:', error);
    throw error;
  }
}

/**
 * Update task status and progress
 */
export async function updateTaskStatus(
  env: any, 
  taskName: string, 
  status: TaskStatus, 
  progress: number
): Promise<ProjectState> {
  try {
    // Get current state
    const currentState = await getProjectState(env);
    
    // Find and update task
    const updatedTasks = currentState.tasks.map(task => {
      if (task.name === taskName) {
        return {
          ...task,
          status,
          progress
        };
      }
      return task;
    });
    
    // Update state with modified tasks
    return updateProjectState(env, { tasks: updatedTasks });
  } catch (error) {
    console.error('Error updating task status:', error);
    throw error;
  }
}

/**
 * Update current development phase
 */
export async function updateCurrentPhase(env: any, phaseId: number): Promise<ProjectState> {
  try {
    // Get current state
    const currentState = await getProjectState(env);
    
    // Update phases status
    const updatedPhases = currentState.phases.map(phase => {
      if (phase.id === phaseId) {
        return {
          ...phase,
          status: 'current' as const
        };
      } else if (phase.id < phaseId) {
        return {
          ...phase,
          status: 'completed' as const
        };
      } else {
        return {
          ...phase,
          status: 'upcoming' as const
        };
      }
    });
    
    // Update state with modified phases and current phase
    return updateProjectState(env, { 
      phases: updatedPhases,
      currentPhase: phaseId
    });
  } catch (error) {
    console.error('Error updating current phase:', error);
    throw error;
  }
}

// Update component progress
export function updateComponentProgress() {
  // Update API System progress based on task progress
  const apiTasks = currentProjectState.tasks.filter(task => 
    task.name.includes('REST API') || 
    task.name.includes('WebSocket') || 
    task.name.includes('API documentation')
  );
  
  if (apiTasks.length > 0) {
    const apiProgress = apiTasks.reduce((sum, task) => sum + task.progress, 0) / apiTasks.length;
    const apiComponent = currentProjectState.components.find(c => c.name === 'API System');
    if (apiComponent) {
      apiComponent.progress = Math.round(apiProgress);
    }
  }
  
  return currentProjectState;
}

// Get rule sets status
export function getRuleSetsStatus() {
  const activeRuleSets = currentProjectState.ruleSets.filter(rs => rs.status === 'active');
  return {
    total: currentProjectState.ruleSets.length,
    active: activeRuleSets.length,
    percentage: Math.round((activeRuleSets.length / currentProjectState.ruleSets.length) * 100)
  };
}

// Get API feature status
export function getApiFeatureStatus() {
  const apiTasks = currentProjectState.tasks.filter(task => 
    task.name.includes('REST API') || 
    task.name.includes('WebSocket') || 
    task.name.includes('API documentation')
  );
  
  const restApiTask = apiTasks.find(t => t.name.includes('REST API'));
  const websocketTask = apiTasks.find(t => t.name.includes('WebSocket'));
  const documentationTask = apiTasks.find(t => t.name.includes('API documentation'));
  
  return {
    restfulEndpoints: { 
      status: restApiTask?.status || 'planned', 
      percentage: restApiTask?.progress || 0 
    },
    websocketSupport: { 
      status: websocketTask?.status || 'planned', 
      percentage: websocketTask?.progress || 0 
    },
    apiDocumentation: { 
      status: documentationTask?.status || 'planned', 
      percentage: documentationTask?.progress || 0 
    }
  };
}

// Get current development phase
export function getCurrentDevelopmentPhase() {
  // Find the current phase by looking at the phase with 'current' status
  const currentPhase = currentProjectState.phases.find(p => p.status === 'current');
  
  // If no current phase is found, use the one from currentPhase field
  const fallbackPhase = !currentPhase && currentProjectState.currentPhase ? 
    currentProjectState.phases.find(p => p.id === currentProjectState.currentPhase) : null;
  
  const previousPhases = currentProjectState.phases
    .filter(p => p.status === 'completed')
    .map(p => p.name);
    
  const nextPhases = currentProjectState.phases
    .filter(p => p.status === 'upcoming')
    .map(p => p.name);
  
  // Calculate progress for current phase
  let percentage = 0;
  const phaseToUse = currentPhase || fallbackPhase;
  
  if (phaseToUse) {
    const phaseTasks = currentProjectState.tasks.filter(task => 
      phaseToUse.tasks.includes(task.name));
    
    if (phaseTasks.length > 0) {
      percentage = Math.round(phaseTasks.reduce((sum, task) => sum + task.progress, 0) / phaseTasks.length);
    }
    
    // If we're using a fallback phase, make sure we log this
    if (!currentPhase) {
      console.log(`No phase marked as 'current', using phase ID ${currentProjectState.currentPhase}`);
    }
  } else {
    console.log('Warning: Could not determine current phase');
  }
  
  return {
    current: phaseToUse?.name || 'Phase 3: Agent Integration', // Fallback to known correct phase
    percentage: percentage || 70, // Fallback to estimated percentage if calculation fails
    previousPhases,
    nextPhases
  };
}

// Get priority recommendations
export function getPriorityRecommendations() {
  // Return in-progress tasks sorted by progress (highest first)
  return currentProjectState.tasks
    .filter(task => task.status === 'in-progress')
    .sort((a, b) => b.progress - a.progress)
    .map(task => task.description);
}

// Update the project state to match the latest analysis
updateComponentProgress();

/**
 * Update component and task progress directly (for agent use)
 */
export async function updateProjectProgress(
  env: any,
  componentUpdates: { name: string; progress: number }[],
  taskUpdates: { name: string; progress: number }[]
): Promise<ProjectState> {
  try {
    console.log(`Updating project progress with ${componentUpdates.length} component updates and ${taskUpdates.length} task updates`);
    
    // Get current state
    const currentState = await getProjectState(env);
    
    // Update components
    const updatedComponents = [...currentState.components];
    for (const update of componentUpdates) {
      const componentIndex = updatedComponents.findIndex(c => c.name === update.name);
      if (componentIndex >= 0) {
        updatedComponents[componentIndex] = {
          ...updatedComponents[componentIndex],
          progress: update.progress,
          status: update.progress >= 100 ? 'completed' : 'in-progress'
        };
        console.log(`Updated component ${update.name} to ${update.progress}% (${updatedComponents[componentIndex].status})`);
      } else {
        // Component doesn't exist, create it
        console.log(`Creating new component ${update.name} with ${update.progress}% progress`);
        const newComponent: ProjectComponent = {
          name: update.name,
          progress: update.progress,
          status: update.progress >= 100 ? 'completed' : (update.progress > 0 ? 'in-progress' : 'planned'),
          description: `Auto-generated component: ${update.name}`
        };
        updatedComponents.push(newComponent);
      }
    }
    
    // Update tasks
    const updatedTasks = [...currentState.tasks];
    for (const update of taskUpdates) {
      const taskIndex = updatedTasks.findIndex(t => t.name === update.name);
      if (taskIndex >= 0) {
        updatedTasks[taskIndex] = {
          ...updatedTasks[taskIndex],
          progress: update.progress,
          status: update.progress >= 100 ? 'completed' : update.progress > 0 ? 'in-progress' : 'planned'
        };
        console.log(`Updated task ${update.name} to ${update.progress}% (${updatedTasks[taskIndex].status})`);
      } else {
        // Task doesn't exist, create it
        console.log(`Creating new task ${update.name} with ${update.progress}% progress`);
        const newTask: DevelopmentTask = {
          name: update.name,
          progress: update.progress,
          status: update.progress >= 100 ? 'completed' : (update.progress > 0 ? 'in-progress' : 'planned'),
          description: `Auto-generated task: ${update.name}`
        };
        updatedTasks.push(newTask);
      }
    }
    
    // Make sure we have at least one phase if phases array is empty
    let phasesToUse = currentState.phases;
    if (phasesToUse.length === 0) {
      // Create a default phase structure
      phasesToUse = [
        {
          id: 1,
          name: 'Phase 1: Setup',
          status: 'current',
          components: updatedComponents.map(c => c.name),
          tasks: updatedTasks.map(t => t.name),
          description: 'Initial project setup phase'
        }
      ];
    }
    
    // Update current phase automatically based on task progress
    const phaseUpdates = determineCurrentPhase(updatedComponents, updatedTasks, phasesToUse);
    
    // Update state with all changes
    return updateProjectState(env, {
      components: updatedComponents,
      tasks: updatedTasks,
      phases: phaseUpdates.updatedPhases,
      currentPhase: phaseUpdates.currentPhaseId
    });
  } catch (error) {
    console.error('Error updating project progress:', error);
    throw error;
  }
}

/**
 * Determine current phase based on component and task progress
 */
function determineCurrentPhase(
  components: ProjectComponent[],
  tasks: DevelopmentTask[],
  phases: DevelopmentPhase[]
): { currentPhaseId: number; updatedPhases: DevelopmentPhase[] } {
  // Clone phases for modification
  const updatedPhases = [...phases];
  
  // If no phases exist, create a default one
  if (updatedPhases.length === 0) {
    const defaultPhase: DevelopmentPhase = {
      id: 1,
      name: 'Phase 1: Setup',
      status: 'current',
      components: components.map(c => c.name),
      tasks: tasks.map(t => t.name),
      description: 'Initial project setup phase'
    };
    updatedPhases.push(defaultPhase);
    return { currentPhaseId: 1, updatedPhases };
  }
  
  // Calculate completion percentage for each phase
  const phaseProgress = updatedPhases.map(phase => {
    // Calculate component completion for this phase
    const phaseComponents = components.filter(c => phase.components.includes(c.name));
    const componentProgress = phaseComponents.length > 0 
      ? phaseComponents.reduce((sum, c) => sum + c.progress, 0) / phaseComponents.length
      : 0;
    
    // Calculate task completion for this phase
    const phaseTasks = tasks.filter(t => phase.tasks.includes(t.name));
    const taskProgress = phaseTasks.length > 0
      ? phaseTasks.reduce((sum, t) => sum + t.progress, 0) / phaseTasks.length
      : 0;
    
    // Weighted average favoring task completion
    return (componentProgress * 0.4) + (taskProgress * 0.6);
  });
  
  // Determine current phase
  let currentPhaseId = 1;
  
  // Reset all phases to upcoming first
  updatedPhases.forEach(phase => {
    phase.status = 'upcoming' as const;
  });
  
  // Mark completed and current phases
  for (let i = 0; i < phaseProgress.length; i++) {
    const progress = phaseProgress[i];
    const phase = updatedPhases[i];
    
    if (progress >= 100) {
      // Phase is completed
      phase.status = 'completed' as const;
      // The next phase becomes current if this isn't the last phase
      if (i < updatedPhases.length - 1) {
        currentPhaseId = updatedPhases[i + 1].id;
      } else {
        currentPhaseId = phase.id; // Last phase remains current if completed
      }
    } else if (progress > 0) {
      // First non-completed phase with progress becomes current
      phase.status = 'current' as const;
      currentPhaseId = phase.id;
      break;
    }
  }
  
  // Make sure we have a current phase
  if (!updatedPhases.some(p => p.status === 'current')) {
    // If no current phase was set, mark the one with currentPhaseId
    const currentPhase = updatedPhases.find(p => p.id === currentPhaseId);
    if (currentPhase) {
      currentPhase.status = 'current' as const;
    } else if (updatedPhases.length > 0) {
      // Fallback to first phase if none match
      updatedPhases[0].status = 'current' as const;
      currentPhaseId = updatedPhases[0].id;
    }
  }
  
  return { currentPhaseId, updatedPhases };
}

// Remove the hardcoded projectState object as it's preventing dynamic data gathering
// export const projectState = {
//   components: {
//     coreFramework: { status: 'completed', percentage: 100 },
//     ruleEngine: { status: 'completed', percentage: 100 },
//     agentService: { status: 'completed', percentage: 100 },
//     monitoringSystem: { status: 'completed', percentage: 100 },
//     contextManagement: { status: 'completed', percentage: 100 },
//     apiSystem: { status: 'in-progress', percentage: 70 },
//   },
//   
//   apiFeatures: {
//     restfulEndpoints: { status: 'in-progress', percentage: 70 },
//     websocketSupport: { status: 'in-progress', percentage: 40 },
//     apiDocumentation: { status: 'in-progress', percentage: 30 },
//   },
//   
//   ruleSets: {
//     codeQualityDevelopment: { status: 'completed', percentage: 100 },
//     coreAgentBehavior: { status: 'completed', percentage: 100 },
//     rulePrioritization: { status: 'completed', percentage: 100 },
//     contextRetention: { status: 'completed', percentage: 100 },
//     feedbackIntegration: { status: 'completed', percentage: 100 },
//     enhancementRules: { status: 'completed', percentage: 100 },
//   },
//   
//   developmentPhase: {
//     current: 'Phase 3: API Integration',
//     percentage: 70,
//     previousPhases: [
//       'Phase 1: Core Infrastructure Setup',
//       'Phase 2: Rule System Implementation'
//     ],
//     nextPhases: [
//       'Phase 4: Monitoring & Optimization'
//     ]
//   },
//   
//   projectHealth: 'good',
//   
//   priorityRecommendations: [
//     'Complete REST API endpoint implementation',
//     'Finalize WebSocket support for real-time updates',
//     'Improve API documentation coverage'
//   ],
// } 