import { McpAgent } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { Router } from "itty-router";

// Import framework components
import * as initSystem from "./framework/core/init-system";
import * as frameworkCommands from "./framework/core/framework-commands";
import * as frameworkApi from "./framework/api/framework-api";
import * as agentService from "./framework/agent/agent-service";
import * as ruleEngine from "./framework/rule-engine/rule-engine";
import { displayDashboardStatus, getChatDashboardStatus } from "./framework/agent/dashboard-middleware";
import * as projectAnalyzer from './framework/core/project-analyzer';

// Store env globally for framework access
let globalEnv: Env;
let dashboardActive = false;

// Define our MCP agent with tools
export class MyMCP extends McpAgent {
	server = new McpServer({
		name: "Agentic Framework MCP Server",
		version: "1.0.0",
	});

	async init() {
		// Initialize the Agentic Framework
		await initSystem.initializeFramework(globalEnv);
		
		// Auto-start dashboard if it was previously active
		try {
			const statusStr = await globalEnv.FRAMEWORK_KV?.get('dashboard:status');
			const status = statusStr ? JSON.parse(statusStr) : { active: false };
			
			if (status.active && status.persistent) {
				console.log("Auto-restoring persistent dashboard...");
				await agentService.startDashboard(globalEnv);
				dashboardActive = true;
			}
		} catch (error) {
			console.error("Error auto-starting dashboard:", error);
		}

		// Dashboard update tool - allows showing dashboard in the Cursor chat
		this.server.tool(
			"dashboard-update",
			{
				random_string: z.string().default("update").describe("Dummy parameter for the dashboard update")
			},
			async () => {
				try {
					// Make sure dashboard is active
					if (!dashboardActive) {
						const success = await agentService.startDashboard(globalEnv);
						dashboardActive = success;
					}
					
					// Get dashboard status for chat display
					const dashboardStatus = await getChatDashboardStatus(globalEnv);
					
					return {
						content: [{ type: "text", text: dashboardStatus }],
					};
				} catch (error) {
					console.error('Error updating dashboard in chat:', error);
					return {
						content: [{ 
							type: "text", 
							text: `Error updating dashboard: ${error instanceof Error ? error.message : String(error)}` 
						}],
					};
				}
			}
		);

		// Project Analyzer tool - runs analysis and returns results
		this.server.tool(
			"analyze-project",
			{
				generate_report: z.boolean().default(false).describe("Whether to generate a full detailed report or just basic analysis")
			},
			async ({ generate_report }) => {
				try {
					console.log('Running project analysis via MCP tool...');
					
					// Run the analysis
					const analysisResult = await projectAnalyzer.analyzeAndUpdateProjectState(globalEnv);
					
					// Update the last analysis timestamp
					await globalEnv.FRAMEWORK_KV?.put('project:last_analysis', Date.now().toString());
					
					// Generate detailed report if requested
					let resultText: string;
					if (generate_report) {
						resultText = await projectAnalyzer.generateProjectAnalysisReport(globalEnv);
					} else {
						// Basic analysis summary
						const completedComponents = analysisResult.components.filter(c => c.status === 'completed');
						const inProgressComponents = analysisResult.components.filter(c => c.status === 'in-progress');
						const completedTasks = analysisResult.tasks.filter(t => t.status === 'completed');
						const inProgressTasks = analysisResult.tasks.filter(t => t.status === 'in-progress');
						const currentPhase = analysisResult.phases.find(p => p.id === analysisResult.currentPhase);
						
						resultText = `## Project Analysis Results\n\n`;
						resultText += `Analysis completed at: ${new Date().toLocaleString()}\n\n`;
						resultText += `**Components**: ${completedComponents.length} completed, ${inProgressComponents.length} in progress\n`;
						resultText += `**Tasks**: ${completedTasks.length} completed, ${inProgressTasks.length} in progress\n`;
						resultText += `**Current Phase**: ${currentPhase?.name || 'Unknown'}\n\n`;
						
						// Show in-progress items
						if (inProgressComponents.length > 0) {
							resultText += `**In-Progress Components**:\n`;
							inProgressComponents.forEach(c => {
								resultText += `- ${c.name} (${c.progress}%)\n`;
							});
							resultText += `\n`;
						}
						
						if (inProgressTasks.length > 0) {
							resultText += `**In-Progress Tasks**:\n`;
							inProgressTasks.forEach(t => {
								resultText += `- ${t.name} (${t.progress}%)\n`;
							});
						}
					}
					
					// Get updated dashboard after analysis
					const dashboardStatus = await getChatDashboardStatus(globalEnv);
					
					return {
						content: [
							{ type: "text", text: resultText },
							{ type: "text", text: "\n\n" },
							{ type: "text", text: dashboardStatus }
						],
					};
				} catch (error) {
					console.error('Error analyzing project:', error);
					return {
						content: [{ 
							type: "text", 
							text: `Error analyzing project: ${error instanceof Error ? error.message : String(error)}` 
						}],
					};
				}
			}
		);

		// Code quality analysis tool
		this.server.tool(
			"analyzeCode",
			{
				code: z.string().describe("The code to analyze"),
				language: z.string().default("javascript").describe("The programming language of the code"),
			},
			async ({ code, language }) => {
				try {
					// Make sure code quality rules are loaded
					await ruleEngine.loadRuleSet(globalEnv, 'code-quality-development');
					
					// Create a request for the agent service
					const request = {
						id: `code_analysis_${Date.now()}`,
						sessionId: 'mcp_session',
						content: code,
						metadata: {
							type: 'code-quality',
							language
						}
					};
					
					// Process the request
					const response = await agentService.processRequest(globalEnv, request);
					
					return {
						content: [{ type: "text", text: response.content }],
					};
				} catch (error) {
					console.error('Error analyzing code:', error);
					return {
						content: [{ type: "text", text: `Error analyzing code: ${error instanceof Error ? error.message : String(error)}` }],
					};
				}
			}
		);



		// Framework command tool
		this.server.tool(
			"framework",
			{
				command: z.string().describe("The framework command to run"),
				args: z.array(z.string()).optional().describe("Optional arguments for the command"),
			},
			async ({ command, args = [] }) => {
				const result = await frameworkCommands.handleFrameworkCommand([command, ...args], globalEnv);
				
				// Track dashboard state when activated via framework command
				if (command === 'dashboard' && result.status === 'success') {
					dashboardActive = true;
				}
				
				return {
					content: [{ type: "text", text: result.message || "Command executed" }],
				};
			}
		);

		// Direct dashboard command tool
		this.server.tool(
			"dashboard",
			{
				random_string: z.string().default("dashboard").describe("Dummy parameter for no-parameter tools")
			},
			async () => {
				try {
					// Start the dashboard directly
					const success = await agentService.startDashboard(globalEnv);
					
					if (success) {
						dashboardActive = true;
					}
					
					// Get dashboard status for chat display
					const dashboardStatus = await getChatDashboardStatus(globalEnv);
					
					return {
						content: [
						    { type: "text", text: dashboardStatus },
						    { 
								type: "text", 
								text: "\n\nAgentic Framework dashboard is now active." 
							}
						],
					};
				} catch (error) {
					console.error('Error starting dashboard:', error);
					return {
						content: [{ 
							type: "text", 
							text: `Error starting dashboard: ${error instanceof Error ? error.message : String(error)}` 
						}],
					};
				}
			}
		);
		
		// Dashboard stop command tool
		this.server.tool(
			"stop-dashboard",
			{
				random_string: z.string().default("stop").describe("Dummy parameter for no-parameter tools")
			},
			async () => {
				try {
					// Stop the dashboard
					const success = await agentService.stopDashboard(globalEnv);
					
					if (success) {
						dashboardActive = false;
					}
					
					return {
						content: [{ 
							type: "text", 
							text: "Agentic Framework dashboard stopped successfully." 
						}],
					};
				} catch (error) {
					console.error('Error stopping dashboard:', error);
					return {
						content: [{ 
							type: "text", 
							text: `Error stopping dashboard: ${error instanceof Error ? error.message : String(error)}` 
						}],
					};
				}
			}
		);

		// Framework status command tool
		this.server.tool(
			"framework-status",
			{
				random_string: z.string().default("status").describe("Dummy parameter for no-parameter tools")
			},
			async () => {
				try {
					const result = await frameworkCommands.handleFrameworkCommand(['status'], globalEnv);
					return {
						content: [{ 
							type: "text", 
							text: result.message 
						}],
					};
				} catch (error) {
					console.error('Error getting framework status:', error);
					return {
						content: [{ 
							type: "text", 
							text: `Error getting framework status: ${error instanceof Error ? error.message : String(error)}` 
						}],
					};
				}
			}
		);

		// Framework help command tool
		this.server.tool(
			"framework-help",
			{
				random_string: z.string().default("help").describe("Dummy parameter for no-parameter tools")
			},
			async () => {
				try {
					const result = await frameworkCommands.handleFrameworkCommand(['help'], globalEnv);
					return {
						content: [{ 
							type: "text", 
							text: result.message 
						}],
					};
				} catch (error) {
					console.error('Error getting framework help:', error);
					return {
						content: [{ 
							type: "text", 
							text: `Error getting framework help: ${error instanceof Error ? error.message : String(error)}` 
						}],
					};
				}
			}
		);
		
		// Load rule set command tool
		this.server.tool(
			"load-rule-set",
			{
				ruleSetId: z.string().describe("ID of the rule set to load")
			},
			async ({ ruleSetId }) => {
				try {
					const result = await frameworkCommands.handleFrameworkCommand(['load', ruleSetId], globalEnv);
					return {
						content: [{ 
							type: "text", 
							text: result.message 
						}],
					};
				} catch (error) {
					console.error('Error loading rule set:', error);
					return {
						content: [{ 
							type: "text", 
							text: `Error loading rule set: ${error instanceof Error ? error.message : String(error)}` 
						}],
					};
				}
			}
		);
		
		// Unload rule set command tool
		this.server.tool(
			"unload-rule-set",
			{
				ruleSetId: z.string().describe("ID of the rule set to unload")
			},
			async ({ ruleSetId }) => {
				try {
					const result = await frameworkCommands.handleFrameworkCommand(['unload', ruleSetId], globalEnv);
					return {
						content: [{ 
							type: "text", 
							text: result.message 
						}],
					};
				} catch (error) {
					console.error('Error unloading rule set:', error);
					return {
						content: [{ 
							type: "text", 
							text: `Error unloading rule set: ${error instanceof Error ? error.message : String(error)}` 
						}],
					};
				}
			}
		);
		
		// Reload rules command tool
		this.server.tool(
			"reload-rules",
			{
				random_string: z.string().default("reload").describe("Dummy parameter for no-parameter tools")
			},
			async () => {
				try {
					const result = await frameworkCommands.handleFrameworkCommand(['reload'], globalEnv);
					return {
						content: [{ 
							type: "text", 
							text: result.message 
						}],
					};
				} catch (error) {
					console.error('Error reloading rules:', error);
					return {
						content: [{ 
							type: "text", 
							text: `Error reloading rules: ${error instanceof Error ? error.message : String(error)}` 
						}],
					};
				}
			}
		);
		
		// List rule sets command tool
		this.server.tool(
			"list-rule-sets",
			{
				random_string: z.string().default("list").describe("Dummy parameter for no-parameter tools")
			},
			async () => {
				try {
					const result = await frameworkCommands.handleFrameworkCommand(['list'], globalEnv);
					return {
						content: [{ 
							type: "text", 
							text: result.message 
						}],
					};
				} catch (error) {
					console.error('Error listing rule sets:', error);
					return {
						content: [{ 
							type: "text", 
							text: `Error listing rule sets: ${error instanceof Error ? error.message : String(error)}` 
						}],
					};
				}
			}
		);
		
		// Reset framework command tool
		this.server.tool(
			"reset-framework",
			{
				random_string: z.string().default("reset").describe("Dummy parameter for no-parameter tools")
			},
			async () => {
				try {
					const result = await frameworkCommands.handleFrameworkCommand(['reset'], globalEnv);
					return {
						content: [{ 
							type: "text", 
							text: result.message 
						}],
					};
				} catch (error) {
					console.error('Error resetting framework:', error);
					return {
						content: [{ 
							type: "text", 
							text: `Error resetting framework: ${error instanceof Error ? error.message : String(error)}` 
						}],
					};
				}
			}
		);
		

		// Update project progress tool for agents
		this.server.tool(
			"update-project-progress",
			{
				components: z.array(
					z.object({
						name: z.string().describe("Name of the component to update"),
						progress: z.number().min(0).max(100).describe("Progress percentage (0-100)")
					})
				).optional().describe("Components to update"),
				tasks: z.array(
					z.object({
						name: z.string().describe("Name of the task to update"),
						progress: z.number().min(0).max(100).describe("Progress percentage (0-100)")
					})
				).optional().describe("Tasks to update")
			},
			async ({ components = [], tasks = [] }) => {
				try {
					console.log(`Agent updating project progress: ${components.length} components, ${tasks.length} tasks`);
					
					// Import project state functions
					const { updateProjectProgress } = await import('./framework/core/project-state');
					
					// Update project progress
					const result = await updateProjectProgress(globalEnv, components, tasks);
					
					// Refresh the dashboard if active
					if (dashboardActive) {
						await agentService.refreshDashboard(globalEnv);
					}
					
					return {
						content: [{ 
							type: "text", 
							text: `Project progress updated successfully.\nUpdated ${components.length} components and ${tasks.length} tasks.\nCurrent phase: ${result.phases.find(p => p.status === 'current')?.name || 'Unknown'}`
						}],
					};
				} catch (error) {
					console.error('Error updating project progress:', error);
					return {
						content: [{ 
							type: "text", 
							text: `Error updating project progress: ${error instanceof Error ? error.message : String(error)}`
						}],
					};
				}
			}
		);
		
		// Update project phase tool for agents
		this.server.tool(
			"update-project-phase",
			{
				phaseId: z.number().int().min(1).max(4).describe("ID of the phase to set as current (1-4)")
			},
			async ({ phaseId }) => {
				try {
					console.log(`Agent updating current project phase to: ${phaseId}`);
					
					// Import project state functions
					const { updateCurrentPhase, getProjectState } = await import('./framework/core/project-state');
					
					// Update current phase
					const result = await updateCurrentPhase(globalEnv, phaseId);
					
					// Get updated phase info
					const currentPhase = result.phases.find(p => p.id === phaseId);
					
					// Refresh the dashboard if active
					if (dashboardActive) {
						await agentService.refreshDashboard(globalEnv);
					}
					
					return {
						content: [{ 
							type: "text", 
							text: `Project phase updated successfully.\nCurrent phase: ${currentPhase?.name || 'Unknown'} (Phase ${phaseId})\nComponents in this phase: ${currentPhase?.components.join(', ') || 'None'}`
						}],
					};
				} catch (error) {
					console.error('Error updating project phase:', error);
					return {
						content: [{ 
							type: "text", 
							text: `Error updating project phase: ${error instanceof Error ? error.message : String(error)}`
						}],
					};
				}
			}
		);
		
		// Custom dashboard data tool for agents
		this.server.tool(
			"update-dashboard-data",
			{
				section: z.string().describe("Dashboard section to update (project-overview, current-phase, next-steps)"),
				data: z.string().describe("New content to display in the specified section")
			},
			async ({ section, data }) => {
				try {
					console.log(`Agent updating dashboard section '${section}' with custom data`);
					
					// Import dashboard functions
					const { updateDashboardSection } = await import('./framework/agent/dashboard-middleware');
					
					// Update dashboard section
					const success = await updateDashboardSection(globalEnv, section, data);
					
					// Refresh the dashboard if active
					if (dashboardActive) {
						await agentService.refreshDashboard(globalEnv);
					}
					
					return {
						content: [{ 
							type: "text", 
							text: success 
								? `Dashboard section '${section}' updated successfully.` 
								: `Failed to update dashboard section '${section}'.`
						}],
					};
				} catch (error) {
					console.error('Error updating dashboard data:', error);
					return {
						content: [{ 
							type: "text", 
							text: `Error updating dashboard data: ${error instanceof Error ? error.message : String(error)}`
						}],
					};
				}
			}
		);
	}
}

// Create a router for handling API requests
const router = Router();

// Add framework API routes
router.all('/api/framework/*', (request, env, ctx) => frameworkApi.handleRequest(request, env));
router.all('/api/agent/*', (request, env, ctx) => frameworkApi.handleRequest(request, env));
router.all('/api/monitoring/*', (request, env, ctx) => frameworkApi.handleRequest(request, env));

// Default handler for non-API routes
router.all('*', (request, env, ctx) => {
	const url = new URL(request.url);

	if (url.pathname === "/sse" || url.pathname === "/sse/message") {
		// @ts-ignore
		return MyMCP.serveSSE("/sse").fetch(request, env, ctx);
	}

	if (url.pathname === "/mcp") {
		// Handle GET /mcp for SSE compatibility
		if (request.method === 'GET') {
			return new Response('MCP server is running', { status: 200 });
		}
		// Create MCP handler with proper headers handling
		const mcpHandler = MyMCP.serve("/mcp");
		
		// Check if this is a session creation request
		if (request.method === 'POST') {
			// Handle the request asynchronously
			return (async () => {
				// Clone the request to read the body
				const requestClone = request.clone();
				
				try {
					// Try to parse the JSON body
					const body = await requestClone.json() as { 
						method: string; 
						id: string | number;
						params?: { sessionId?: string } 
					};
					
					if (body.method === 'mcp.createSession') {
						// Generate a session ID
						const sessionId = `session_${Date.now()}`;
						
						// Return a successful session creation response
						return new Response(JSON.stringify({
							jsonrpc: '2.0',
							result: { sessionId },
							id: body.id
						}), {
							headers: {
								'Content-Type': 'application/json',
								'Mcp-Session-Id': sessionId
							}
						});
					}
					
					// For other MCP requests
					const clonedRequest = new Request(request.url, {
						method: request.method,
						headers: new Headers(request.headers),
						body: JSON.stringify(body),
						redirect: request.redirect,
					});
					
					// Add the required headers
					clonedRequest.headers.set('Accept', 'application/json, text/event-stream');
					
					// Add the session ID header if missing
					if (!clonedRequest.headers.has('Mcp-Session-Id') && body.params?.sessionId) {
						clonedRequest.headers.set('Mcp-Session-Id', body.params.sessionId);
					}
					
					// @ts-ignore
					return mcpHandler.fetch(clonedRequest, env, ctx);
				} catch (error) {
					console.error('Error parsing JSON:', error);
					return new Response(JSON.stringify({
						jsonrpc: '2.0',
						error: { code: -32700, message: 'Parse error: Invalid JSON' },
						id: null
					}), {
						status: 400,
						headers: { 'Content-Type': 'application/json' }
					});
				}
			})();
		}
		
		// @ts-ignore
		return mcpHandler.fetch(request, env, ctx);
	}

	// Return 404 for unknown routes
	return new Response("Not found", { status: 404 });
});

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext) {
		// Store env globally for framework access
		globalEnv = env;
		
		// Initialize framework API
		await frameworkApi.initialize(env);
		
		// Handle the request using the router
		return router.handle(request, env, ctx);
	},
};

// Define Env interface for TypeScript
interface Env {
	FRAMEWORK_KV: KVNamespace;
}
