import { McpAgent } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { Router } from "itty-router";

// Import framework components
import * as initSystem from "./framework/core/init-system";
import * as frameworkCommands from "./framework/core/framework-commands";
import * as frameworkApi from "./framework/api/framework-api";

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
					content: [{ type: "text", text: result.message }],
				};
			}
		);
	}
}

// Create a router for handling API requests
const router = Router();

// Add framework API routes
router.all('/api/framework/*', (request, env, ctx) => frameworkApi.handleRequest(request, env));

// Default handler for non-API routes
router.all('*', (request, env, ctx) => {
	const url = new URL(request.url);

	if (url.pathname === "/sse" || url.pathname === "/sse/message") {
		// @ts-ignore
		return MyMCP.serveSSE("/sse").fetch(request, env, ctx);
	}

	if (url.pathname === "/mcp") {
		// @ts-ignore
		return MyMCP.serve("/mcp").fetch(request, env, ctx);
	}

	// Serve API routes
	if (url.pathname.startsWith('/api/')) {
		return router.handle(request, env, ctx);
	}

	return new Response("Not found", { status: 404 });
});

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext) {
		// Store env globally for framework access
		globalEnv = env;
		
		// Initialize framework API
		await frameworkApi.initialize();
		
		// Handle the request using the router
		return router.handle(request, env, ctx);
	},
};

// Define Env interface for TypeScript
interface Env {
	FRAMEWORK_KV: KVNamespace;
}
