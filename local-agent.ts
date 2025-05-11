import express from 'express';
import { spawn, execSync } from 'child_process';

const app = express();
const PORT = 8788;

app.use(express.json());

// POST /activate-dashboard: Launch dashboard if not running
app.post('/activate-dashboard', (req, res) => {
  try {
    // Check if dashboard is already running
    let alreadyRunning = false;
    try {
      const result = execSync("pgrep -f 'ts-node src/cli-dashboard.ts'", { stdio: 'pipe' }).toString();
      if (result && result.trim().length > 0) alreadyRunning = true;
    } catch (e) {
      alreadyRunning = false;
    }
    if (alreadyRunning) {
      return res.json({ status: 'already_running', message: '[Dashboard] Dashboard is already running.' });
    } else {
      spawn('npm', ['run', 'dashboard'], {
        detached: true,
        stdio: 'ignore',
        cwd: process.cwd(),
      }).unref();
      return res.json({ status: 'started', message: '[Dashboard] Agentic Framework dashboard is now active in your terminal.' });
    }
  } catch (error) {
    return res.status(500).json({ status: 'error', message: `[Dashboard] Error starting dashboard: ${error instanceof Error ? error.message : String(error)}` });
  }
});

app.listen(PORT, () => {
  console.log(`[Local Agent] Listening on http://localhost:${PORT}`);
}); 