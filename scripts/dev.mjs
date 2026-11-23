import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const backendDir = path.join(rootDir, 'backend');
const mobileDir = path.join(rootDir, 'mobile');

const args = new Set(process.argv.slice(2));
const isWin = process.platform === 'win32';
const runBackend = !args.has('--web-only');
const runMobile = !args.has('--backend-only');
const useQrMode = args.has('--qr');

const COLORS = {
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
};

function resolveBackendPython() {
  const candidates = isWin
    ? [
        path.join(backendDir, '.venv', 'Scripts', 'python.exe'),
        path.join(backendDir, 'venv', 'Scripts', 'python.exe'),
        'python',
      ]
    : [
        path.join(backendDir, '.venv', 'bin', 'python'),
        path.join(backendDir, 'venv', 'bin', 'python'),
        'python3',
        'python',
      ];

  for (const candidate of candidates) {
    if (!candidate.includes(path.sep) || fs.existsSync(candidate)) {
      return candidate;
    }
  }
  return isWin ? 'python' : 'python3';
}

function prefixStream(stream, tag, color, target) {
  let buffer = '';
  stream.on('data', (chunk) => {
    buffer += chunk.toString();
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      target.write(`${color}[${tag}]${COLORS.reset} ${line}\n`);
    }
  });
  stream.on('end', () => {
    if (buffer.length > 0) {
      target.write(`${color}[${tag}]${COLORS.reset} ${buffer}\n`);
    }
  });
}

const children = [];
let shuttingDown = false;

function killTree(child) {
  if (!child || child.exitCode !== null || !child.pid) return;
  if (isWin) {
    spawn('taskkill', ['/pid', String(child.pid), '/T', '/F'], {
      stdio: 'ignore',
      windowsHide: true,
    });
  } else {
    try {
      child.kill('SIGTERM');
    } catch {
      // ignore if already exited
    }
  }
}

function shutdown(exitCode = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`\n${COLORS.yellow}Đang dừng toàn bộ tiến trình Smart Heritage Guide...${COLORS.reset}`);
  for (const child of children) {
    killTree(child);
  }
  setTimeout(() => process.exit(exitCode), 400);
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

function launch(tag, color, command, commandArgs, cwd, extraOptions = {}) {
  const child = spawn(command, commandArgs, {
    cwd,
    env: process.env,
    stdio: ['inherit', 'pipe', 'pipe'],
    ...extraOptions,
  });

  prefixStream(child.stdout, tag, color, process.stdout);
  prefixStream(child.stderr, tag, color, process.stderr);

  child.on('exit', (code) => {
    if (!shuttingDown && code && code !== 0) {
      console.error(
        `${COLORS.red}[${tag}] đã dừng bất ngờ với mã lỗi ${code}.${COLORS.reset}`
      );
    }
  });

  children.push(child);
  return child;
}

console.log(`${COLORS.dim}======================================================${COLORS.reset}`);
console.log(`  Smart Heritage Guide — Dev Launcher`);
if (runMobile) {
  console.log(`  Mobile Web : ${COLORS.green}http://localhost:8081${COLORS.reset}`);
}
if (runBackend) {
  console.log(`  Backend API: ${COLORS.cyan}http://localhost:8000/docs${COLORS.reset}`);
}
console.log(`  Nhấn Ctrl + C để tắt cùng lúc cả Backend & Mobile.`);
console.log(`${COLORS.dim}======================================================${COLORS.reset}\n`);

if (runBackend) {
  const pythonBin = resolveBackendPython();
  launch(
    'backend',
    COLORS.cyan,
    pythonBin,
    ['-m', 'uvicorn', 'app.main:app', '--reload', '--host', '0.0.0.0', '--port', '8000'],
    backendDir
  );
}

if (runMobile) {
  const npmArgs = useQrMode
    ? ['expo', 'start', '--port', '8081']
    : ['expo', 'start', '--web', '--port', '8081'];

  if (isWin) {
    launch('mobile', COLORS.green, 'cmd.exe', ['/c', 'npx', ...npmArgs], mobileDir);
  } else {
    launch('mobile', COLORS.green, 'npx', npmArgs, mobileDir);
  }
}
