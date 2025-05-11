// @ts-ignore
import blessed from 'blessed';
// @ts-ignore
import fetch from 'node-fetch';

// Types for framework status and metrics (simplified for scaffold)
type FrameworkStatus = {
  enabled: boolean;
  config: any;
  metrics: any;
};
type Metrics = {
  ruleCalls: number;
  responseTimeAvg: number;
  responseTimeMin: number;
  responseTimeMax: number;
  memoryUsage: string;
  cpuUsage: string;
  activeRules: number;
  requestRate: number;
};

type Alert = {
  type: string;
  message: string;
  severity: 'critical' | 'warning' | 'info';
};

// API endpoints
const API_BASE = 'http://localhost:8787/api';

// Helper to fetch framework status
async function fetchFrameworkStatus(): Promise<FrameworkStatus | null> {
  try {
    const res = await fetch(`${API_BASE}/framework/status`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.data;
  } catch (e) {
    return null;
  }
}

// Helper to fetch metrics
async function fetchMetrics(): Promise<Metrics | null> {
  try {
    const res = await fetch(`${API_BASE}/monitoring/metrics`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.data.metrics;
  } catch (e) {
    return null;
  }
}

// Helper to fetch alerts (TODO: implement real endpoint)
async function fetchAlerts(): Promise<Alert[]> {
  // Placeholder: return empty array
  return [];
}

// Helper to fetch next steps (from README or static)
async function fetchNextSteps(): Promise<string[]> {
  // TODO: Parse from README or load from static file
  return [
    'Implement enhanced error handling',
    'Add WebSocket support for real-time updates',
    'Develop additional specialized rule sets',
    'Configure production environment',
    'Complete API documentation',
  ];
}

// Session/command history (in-memory for now)
const sessionHistory: string[] = [
  'Welcome to the Agentic Framework CLI Dashboard!',
  'Type q to quit, r to refresh manually.',
];

// Create blessed screen
const screen = blessed.screen({
  smartCSR: true,
  title: 'Agentic Framework CLI Dashboard',
});

// Framework state indicator (top bar)
const stateBar = blessed.box({
  top: 0,
  left: 0,
  width: '100%',
  height: 3,
  tags: true,
  style: { fg: 'white', bg: 'blue' },
  content: 'Loading framework state...'
});
screen.append(stateBar);

// Project canvas (main area)
const projectCanvas = blessed.box({
  top: 3,
  left: 0,
  width: '70%',
  height: '80%-3',
  label: ' Project Canvas ',
  border: { type: 'line' },
  style: { border: { fg: 'cyan' } },
  tags: true,
  content: 'Loading project overview...'
});
screen.append(projectCanvas);

// Alerts panel (right side)
const alertsPanel = blessed.box({
  top: 3,
  left: '70%',
  width: '30%',
  height: '40%',
  label: ' Alerts ',
  border: { type: 'line' },
  style: { border: { fg: 'red' } },
  tags: true,
  content: 'No alerts.'
});
screen.append(alertsPanel);

// Next steps panel (right bottom)
const nextStepsPanel = blessed.box({
  top: '43%',
  left: '70%',
  width: '30%',
  height: '40%',
  label: ' Next Steps ',
  border: { type: 'line' },
  style: { border: { fg: 'yellow' } },
  tags: true,
  content: 'Loading next steps...'
});
screen.append(nextStepsPanel);

// Session/command history (bottom)
const historyPanel = blessed.box({
  bottom: 0,
  left: 0,
  width: '100%',
  height: 6,
  label: ' Session / Command History ',
  border: { type: 'line' },
  style: { border: { fg: 'green' } },
  tags: true,
  content: sessionHistory.join('\n')
});
screen.append(historyPanel);

// Add command input box
const commandInput = blessed.textbox({
  bottom: 0,
  left: 'center',
  width: '100%',
  height: 3,
  inputOnFocus: true,
  border: { type: 'line' },
  style: { border: { fg: 'magenta' } },
  label: ' Command Input (Press Enter to submit, q to quit) ',
  tags: true,
});
screen.append(commandInput);

// Move history panel up to make room for input
historyPanel.height = 5;
historyPanel.bottom = 3;

// Focus management
screen.key([':'], () => {
  commandInput.focus();
});
commandInput.key('escape', () => {
  screen.focusPop();
});

// Command handler
async function handleCommand(cmd: string) {
  sessionHistory.push(`> ${cmd}`);
  // Parse and route command
  const parts = cmd.trim().split(/\s+/);
  if (parts[0] === '/framework') {
    // Framework command
    const fwCmd = parts[1] || 'status';
    const args = parts.slice(2);
    try {
      const res = await fetch('http://localhost:8787/mcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: `Framework command: ${fwCmd} ${args.join(' ')}`,
          tools: [
            {
              name: 'framework',
              input: { command: fwCmd, args },
            },
          ],
        }),
      });
      if (!res.ok) {
        sessionHistory.push(`[error] Command failed: ${res.statusText}`);
      } else {
        const data = await res.json();
        sessionHistory.push(`[result] ${JSON.stringify(data)}`);
      }
    } catch (e) {
      sessionHistory.push(`[error] ${e}`);
    }
    refreshDashboard();
  } else {
    sessionHistory.push('[error] Unknown command. Only /framework commands are supported for now.');
    refreshDashboard();
  }
}

// Command input submit handler
commandInput.on('submit', (value: string) => {
  if (value.trim()) {
    handleCommand(value.trim());
  }
  commandInput.clearValue();
  screen.render();
  screen.focusPop();
});

// Keyboard shortcuts
screen.key(['q', 'C-c'], () => {
  clearInterval(pollInterval);
  // If you see a type error here, run: npm install --save-dev @types/node
  // and add 'node' to the types array in your tsconfig.json
  return process.exit(0);
});
screen.key(['r'], () => {
  sessionHistory.push('Manual refresh triggered.');
  refreshDashboard();
});
screen.key([':'], () => {
  commandInput.focus();
});

// Refresh dashboard data
async function refreshDashboard() {
  // Fetch all data in parallel
  const [fwStatus, metrics, alerts, nextSteps] = await Promise.all([
    fetchFrameworkStatus(),
    fetchMetrics(),
    fetchAlerts(),
    fetchNextSteps(),
  ]);

  // Update state bar
  if (fwStatus) {
    const status = fwStatus.enabled ? '{green-fg}ACTIVE{/green-fg}' : '{red-fg}INACTIVE{/red-fg}';
    const ruleCount = fwStatus.config?.rules?.length || 0;
    stateBar.setContent(` {bold}Framework State:{/bold} ${status} | {bold}Active Rules:{/bold} ${ruleCount}`);
    stateBar.style.bg = fwStatus.enabled ? 'blue' : 'red';
  } else {
    stateBar.setContent(' {red-fg}Error loading framework state{/red-fg}');
    stateBar.style.bg = 'red';
  }

  // Update project canvas
  projectCanvas.setContent(
    [
      `{bold}Core Components:{/bold}`,
      `- Core Framework: {green-fg}Ready{/green-fg}`,
      `- Rule Engine: {green-fg}Ready{/green-fg}`,
      `- Agent Service: {green-fg}Ready{/green-fg}`,
      `- Monitoring: {green-fg}Ready{/green-fg}`,
      `- Context Management: {green-fg}Ready{/green-fg}`,
      `- API System: {green-fg}Ready{/green-fg}`,
      '',
      `{bold}Recent Metrics:{/bold}`,
      metrics
        ? [
            `- Rule Calls: ${metrics.ruleCalls}`,
            `- Response Time (avg): ${metrics.responseTimeAvg}ms`,
            `- Memory Usage: ${metrics.memoryUsage}`,
            `- CPU Usage: ${metrics.cpuUsage}`,
            `- Active Rules: ${metrics.activeRules}`,
            `- Request Rate: ${metrics.requestRate}`,
          ].join('\n')
        : 'Loading metrics...',
      '',
      `{bold}Active Rule Sets:{/bold}`,
      fwStatus?.config?.rules
        ? fwStatus.config.rules.map((r: any) => `- ${r.name} (${r.status})`).join('\n')
        : 'Loading rules...'
    ].join('\n')
  );

  // Update alerts panel
  if (alerts && alerts.length > 0) {
    alertsPanel.setContent(alerts.map(a => `{${a.severity}-fg}${a.type}:{/} ${a.message}`).join('\n'));
  } else {
    alertsPanel.setContent('No alerts.');
  }

  // Update next steps panel
  nextStepsPanel.setContent(nextSteps.map((s, i) => `${i + 1}. ${s}`).join('\n'));

  // Update history panel
  historyPanel.setContent(sessionHistory.slice(-5).join('\n'));

  screen.render();
}

// Poll for updates every 2 seconds
const pollInterval = setInterval(refreshDashboard, 2000);

// Initial render
refreshDashboard();

// TODOs:
// - Add interactive rule set management (list, activate, deactivate)
// - Add alert acknowledgment/resolution actions
// - Add agent/monitoring command routing
// - Add live logs/event streaming panel
// - Keyboard navigation between panels
// - Persist session/command history
// - Parse next steps dynamically from README or a TODO file
// - Show more detailed rule/component/project info
