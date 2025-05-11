# Agentic Framework MCP Server

The Agentic Framework MCP (Model Control Protocol) Server is a comprehensive system designed to enhance AI agent capabilities through rule-based processing, monitoring, and context management.

## Implementation Status (Updated)

The MCP Server is now highly functional, with the following components:

- **Core Framework**: Basic framework structure with initialization system ✅
- **Rule Engine**: Rule processing, loading, and execution mechanisms ✅
- **Agent Service**: Agent request handling and response processing ✅
- **Monitoring System**: Performance metrics collection and analysis ✅
- **Context Management**: Agent context retention and processing ✅
- **API System**: RESTful API endpoints for external communication ✅ (Core endpoints implemented; see below)
- **WebSocket/Event Streaming**: ❌ Not yet implemented (planned for future release)

### Rule Sets Implemented

- **Core Agent Behavior**: Fundamental agent behavior rules ✅
- **Rule Prioritization**: Rules for prioritizing rule execution ✅
- **Context Retention**: Rules for managing context retention ✅
- **Code Quality Development**: Rules for ensuring high-quality code development ✅
- **Feedback Integration**: Rules for integrating user feedback ✅
- **Enhancement Rules**: General enhancement rules ✅

## Getting Started

### Prerequisites

- Node.js 16+
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Run the development server:

```bash
npm run dev
```

## Integration with Cursor IDE

To integrate the MCP Server with Cursor IDE, follow these steps:

1. **Start the MCP Server**:
   ```bash
   npm run dev
   ```

2. **Create an MCP Session**:
   ```bash
   curl -X POST http://localhost:8787/mcp \
     -H "Content-Type: application/json" \
     -H "Accept: application/json" \
     -d '{"jsonrpc":"2.0","method":"mcp.createSession","params":{},"id":1}'
   ```
   This will return a session ID that you'll need for subsequent requests.

3. **Configure Cursor IDE**:
   - Open Cursor IDE
   - Go to Settings:
     - On Windows/Linux: File > Settings
     - On macOS: Cursor > Settings
   - Navigate to the AI settings section:
     - Search for "Model Context Protocol" or "MCP"
   - Configure the MCP settings:
     - **MCP Endpoint**: `http://localhost:8787/mcp`
     - **Session ID**: Paste the session ID you received in Step 2
     - **Enable MCP**: Check this option

     Alternatively, you can use the provided `mcp.json` file:
     - In Cursor IDE, go to Settings > AI > Model Context Protocol
     - Click "Import Configuration"
     - Select the `mcp.json` file from this repository
     - The configuration will be automatically loaded
     - You'll still need to add your session ID manually
   - Save the settings

4. **Use Code Quality Analysis**:
   The framework provides code quality analysis through the `analyzeCode` tool. You can test it with:
   ```bash
   curl -X POST http://localhost:8787/mcp \
     -H "Content-Type: application/json" \
     -H "Accept: application/json, text/event-stream" \
     -H "Mcp-Session-Id: YOUR_SESSION_ID" \
     -d '{"jsonrpc":"2.0","method":"mcp.submit","params":{"input":"Analyze this code","tools":[{"name":"analyzeCode","input":{"code":"function add(a, b) { return a+b; }","language":"javascript"}}]},"id":2}'
   ```

5. **Framework Commands**:
   You can use framework commands through the MCP protocol:
   ```bash
   curl -X POST http://localhost:8787/mcp \
     -H "Content-Type: application/json" \
     -H "Accept: application/json, text/event-stream" \
     -H "Mcp-Session-Id: YOUR_SESSION_ID" \
     -d '{"jsonrpc":"2.0","method":"mcp.submit","params":{"input":"Check framework status","tools":[{"name":"framework","input":{"command":"status","args":[]}}]},"id":3}'
   ```

## API Endpoints (Current Coverage)

### Framework Management

- `POST /api/framework/initialize` - Initialize the framework
- `GET /api/framework/status` - Get current framework status
- `POST /api/framework/rules/load` - Load specific rule sets
- `POST /api/framework/rules/unload` - Unload specific rule sets
- `GET /api/framework/rules/list` - List all available rule sets
- `POST /api/framework/reset` - Reset framework to default state

### Agent API

- `POST /api/agent/process` - Process a request through the agent
- `GET /api/agent/context` - Get current agent context
- `POST /api/agent/feedback` - Submit feedback for the agent

### Monitoring API

- `GET /api/monitoring/metrics` - Get framework metrics
- `GET /api/monitoring/performance` - Get performance metrics
- `GET /api/monitoring/alerts` - Get active alerts

> **Note:** WebSocket and event streaming endpoints are not yet implemented. These are planned for a future release.

## Framework Commands

The framework includes a command system for managing the MCP server:

- `/framework status`: Shows current framework status
- `/framework help`: Displays help information
- `/framework load <rule-set>`: Loads a specific rule set
- `/framework unload <rule-set>`: Unloads a specific rule set
- `/framework reload`: Reloads all active rules
- `/framework list`: Lists all available rule sets
- `/framework reset`: Resets framework to default state

## Testing & Integration Status

A test script is provided to verify the core framework functionality and API endpoints:

```bash
node test-framework.js
```

The test script covers:
- Framework initialization
- Status endpoint
- Rule listing
- Agent request processing
- Monitoring metrics
- Framework command tool via MCP endpoint

> **Integration Status:**
> - All core API endpoints are tested and functional.
> - Rule engine, agent service, and monitoring are fully integrated.
> - WebSocket/event streaming and advanced rule sets are not yet covered by tests (planned).

## Next Steps

1. **Enhanced Error Handling**
   - Implement more robust error handling throughout the application
   - Add detailed error logging and reporting

2. **WebSocket Support**
   - Add WebSocket support for real-time updates
   - Implement event streaming for monitoring

3. **Advanced Rule Sets**
   - Develop additional specialized rule sets
   - Implement rule dependency resolution

4. **Production Deployment**
   - Configure production environment
   - Set up CI/CD pipeline
   - Implement monitoring and alerting

5. **Documentation**
   - Complete API documentation
   - Create developer guides
   - Document rule creation process

## License

This project is licensed under the MIT License - see the LICENSE file for details.
