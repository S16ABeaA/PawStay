const { execSync } = require('node:child_process');

const port = process.argv[2] || process.env.PORT || '5001';

function freePortOnWindows(targetPort) {
  let output = '';
  try {
    output = execSync(`netstat -ano | findstr :${targetPort}`, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
  } catch {
    return;
  }

  const pids = new Set(
    output
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && line.includes('LISTENING'))
      .map((line) => line.split(/\s+/).pop())
      .filter(Boolean)
  );

  for (const pid of pids) {
    try {
      execSync(`taskkill /PID ${pid} /T /F`, { stdio: 'ignore' });
      console.log(`[free-port] Killed PID ${pid} on port ${targetPort}`);
    } catch {
      console.log(`[free-port] Failed to kill PID ${pid}; continuing`);
    }
  }
}

function freePortOnUnix(targetPort) {
  let output = '';
  try {
    output = execSync(`lsof -ti :${targetPort}`, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
  } catch {
    return;
  }

  const pids = output
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  for (const pid of pids) {
    try {
      execSync(`kill -9 ${pid}`, { stdio: 'ignore' });
      console.log(`[free-port] Killed PID ${pid} on port ${targetPort}`);
    } catch {
      console.log(`[free-port] Failed to kill PID ${pid}; continuing`);
    }
  }
}

if (process.platform === 'win32') {
  freePortOnWindows(port);
} else {
  freePortOnUnix(port);
}
