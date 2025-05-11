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

// Store env globally for framework access
let globalEnv: Env;

// Define our MCP agent with tools
export class MyMCP extends McpAgent {
	server = new McpServer({
		name: "Agentic Framework MCP Server",
		version: "1.0.0",
	});

	async init() {
		// Initialize the Agentic Framework
		await initSystem.initializeFramework(globalEnv);

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

		// Basic calculator tools
		this.server.tool(
			"add",
			{ a: z.number(), b: z.number() },
			async ({ a, b }) => ({
				content: [{ type: "text", text: String(a + b) }],
			})
		);

		this.server.tool(
			"calculate",
			{
				operation: z.enum(["add", "subtract", "multiply", "divide"]),
				a: z.number(),
				b: z.number(),
			},
			async ({ operation, a, b }) => {
				let result: number;
				switch (operation) {
					case "add":
						result = a + b;
						break;
					case "subtract":
						result = a - b;
						break;
					case "multiply":
						result = a * b;
						break;
					case "divide":
						if (b === 0)
							return {
								content: [
									{
										type: "text",
										text: "Error: Cannot divide by zero",
									},
								],
							};
						result = a / b;
						break;
				}
				return { content: [{ type: "text", text: String(result) }] };
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
				return {
					content: [{ type: "text", text: result.message || "Command executed" }],
				};
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
