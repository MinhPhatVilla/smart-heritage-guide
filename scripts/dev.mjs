import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
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
const openWebOnly = args.has('--web-only');

const COLORS = {
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
};

function detectLanIp() {
  const interfaces = os.networkInterfaces();
  const virtualPattern = /vmware|vmnet|virtualbox|vbox|vethernet|wsl|hyper-v|zerotier|tailscale|wireguard|docker|hamachi|loopback|bluetooth/i;
  const preferredPattern = /wi-fi|wifi|wlan|en0|ethernet/i;

  const candidates = [];
  for (const [name, addrs] of Object.entries(interfaces)) {
    if (!addrs || virtualPattern.test(name)) continue;
    for (const info of addrs) {
      if (info.family !== 'IPv4' || info.internal) continue;
      if (info.address.startsWith('169.254.')) continue;
      const priority = preferredPattern.test(name) ? 0 : 1;
      candidates.push({ name, address: info.address, priority });
    }
  }
  candidates.sort((a, b) => a.priority - b.priority);
  return candidates[0]?.address ?? null;
}

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

const lanIp = detectLanIp();

console.log(`${COLORS.dim}======================================================${COLORS.reset}`);
console.log(`  Smart Heritage Guide — Dev Launcher`);
if (runMobile) {
  console.log(`  Expo Go (QR): ${COLORS.green}exp://${lanIp ?? 'localhost'}:8081${COLORS.reset}`);
  console.log(`  Mobile Web  : ${COLORS.green}http://localhost:8081${COLORS.reset}  (bấm phím 'w' để mở Web)`);
}
if (runBackend) {
  console.log(`  Backend API : ${COLORS.cyan}http://${lanIp ?? 'localhost'}:8000/docs${COLORS.reset}`);
}
console.log(`  Nhấn Ctrl + C để tắt cùng lúc cả Backend & Mobile.`);
console.log(`${COLORS.dim}======================================================${COLORS.reset}\n`);

if (runBackend) {
  const pythonBin = resolveBackendPython();
  const backendChild = spawn(
    pythonBin,
    ['-m', 'uvicorn', 'app.main:app', '--reload', '--host', '0.0.0.0', '--port', '8000'],
    {
      cwd: backendDir,
      env: process.env,
      stdio: ['ignore', 'pipe', 'pipe'],
    }
  );
  prefixStream(backendChild.stdout, 'backend', COLORS.cyan, process.stdout);
  prefixStream(backendChild.stderr, 'backend', COLORS.cyan, process.stderr);
  backendChild.on('exit', (code) => {
    if (!shuttingDown && code && code !== 0) {
      console.error(`${COLORS.red}[backend] đã dừng bất ngờ với mã lỗi ${code}.${COLORS.reset}`);
    }
  });
  children.push(backendChild);
}

if (runMobile) {
  const expoArgs = openWebOnly
    ? ['expo', 'start', '--web', '--port', '8081']
    : ['expo', 'start', '--port', '8081'];

  // Giữ nguyên TTY (stdio: 'inherit') để Expo hiển thị mã QR tương tác và phím tắt (w/a/i/r).
  // Tự gắn IP Wi-Fi thật (tránh VMware/WSL) để điện thoại quét QR gọi được cả Metro lẫn Backend API.
  const mobileEnv = {
    ...process.env,
    ...(lanIp
      ? {
          REACT_NATIVE_PACKAGER_HOSTNAME: lanIp,
          EXPO_PUBLIC_API_BASE_URL: `http://${lanIp}:8000`,
        }
      : {}),
  };

  const mobileChild = isWin
    ? spawn('cmd.exe', ['/c', 'npx', ...expoArgs], {
        cwd: mobileDir,
        env: mobileEnv,
        stdio: 'inherit',
      })
    : spawn('npx', expoArgs, {
        cwd: mobileDir,
        env: mobileEnv,
        stdio: 'inherit',
      });

  mobileChild.on('exit', (code) => {
    if (!shuttingDown) {
      shutdown(code ?? 0);
    }
  });
  children.push(mobileChild);
}
