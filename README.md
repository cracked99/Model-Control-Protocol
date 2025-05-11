# Agentic Framework MCP Server

A production-ready implementation of the Agentic Framework on an MCP server, providing a comprehensive framework for developing agentic applications with rule-based behavior, monitoring, and API endpoints.

## Features

- **Core Framework Components**
  - Initialization system
  - Rule engine with dynamic rule loading
  - Context management with compression
  - Framework command system

- **Agent Service**
  - Request processing pipeline
  - Task queue management
  - Metrics collection

- **Monitoring System**
  - System metrics collection
  - Alert management
  - Performance tracking

- **API Endpoints**
  - Framework initialization and status
  - Rule management (load, unload, list)
  - Agent request processing
  - Monitoring metrics

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```

### Development

Start the development server:
```
npm run dev
```

### Production

Build for production:
```
npm run build
```

Deploy to Cloudflare Workers:
```
npm run deploy
```

## Framework Commands

The framework supports the following commands:

- `status` - Get the current status of the framework
- `help` - Display help information about available commands
- `load <ruleset>` - Load a specific rule set
- `unload <ruleset>` - Unload a specific rule set
- `reload` - Reload all active rule sets
- `list` - List all available rule sets
- `reset` - Reset the framework to its default state

## API Endpoints

### Framework API

- `POST /api/framework/initialize` - Initialize the framework
- `GET /api/framework/status` - Get framework status
- `POST /api/framework/rules/load` - Load specific rule sets
- `POST /api/framework/rules/unload` - Unload specific rule sets
- `GET /api/framework/rules/list` - List all available rule sets
- `POST /api/framework/reset` - Reset the framework

### Agent API

- `POST /api/agent/process` - Process a request through the agent
- `GET /api/agent/context` - Get the current agent context

### Monitoring API

- `GET /api/monitoring/metrics` - Get framework metrics

## Architecture

The Agentic Framework follows a modular architecture:

1. **Core** - Handles initialization, rule management, and framework commands
2. **Rule Engine** - Manages rule loading, execution, and prioritization
3. **Agent Service** - Processes requests and manages the task queue
4. **Monitoring** - Collects metrics and manages alerts
5. **API** - Provides HTTP endpoints for interacting with the framework

## License

MIT
