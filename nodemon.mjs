import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { parseArgs } from 'node:util';

const { values, positionals } = parseArgs({
  options: {
    watch: {
      type: 'string',
      multiple: true,
      short: 'w',
    },
    exec: {
      type: 'string',
      short: 'e',
    },
    help: {
      type: 'boolean',
      short: 'h',
    },
  },
  allowPositionals: true,
});

if (values.help || (!values.exec && positionals.length === 0)) {
  console.log(`
Usage: node nodemon.mjs [options] [--exec command]

Options:
  --watch, -w <dir>  Directory or file to watch. Can be specified multiple times. Defaults to current directory.
  --exec, -e <cmd>   Command to execute. If not provided, positionals are used as the command.
  --help, -h         Show this help message.

Example:
  node nodemon.mjs --watch src --exec "node src/index.js"
  node nodemon.mjs --watch src node src/index.js
  `);
  process.exit(0);
}

const watchPaths = values.watch && values.watch.length > 0 ? values.watch : ['.'];
let commandToRun = values.exec;

if (!commandToRun && positionals.length > 0) {
  commandToRun = positionals.join(' ');
}

if (!commandToRun) {
  console.error('Error: No execution command specified.');
  process.exit(1);
}

let childProcess = null;
let debounceTimeout = null;

function killProcess(proc) {
  if (!proc) return;
  
  if (process.platform === 'win32') {
    // On Windows, killing the shell doesn't reliably kill children. taskkill /t kills the process tree.
    spawn('taskkill', ['/pid', proc.pid, '/f', '/t'], { stdio: 'ignore' });
  } else {
    proc.kill('SIGTERM');
  }
}

function startProcess() {
  if (childProcess) {
    killProcess(childProcess);
  }

  console.log(`[nodemon] starting \`${commandToRun}\``);
  childProcess = spawn(commandToRun, {
    stdio: 'inherit',
    shell: true,
  });

  childProcess.on('close', (code) => {
    // Only print if it was not killed intentionally by us (in which case code is usually null)
    if (code !== null && code !== 0) {
      console.log(`[nodemon] app crashed - waiting for file changes before starting...`);
    } else if (code === 0) {
      console.log(`[nodemon] clean exit - waiting for changes before restart`);
    }
  });
}

function restartProcess() {
  console.log(`[nodemon] restarting due to changes...`);
  startProcess();
}

function handleFileChange(eventType, filename) {
  if (debounceTimeout) {
    clearTimeout(debounceTimeout);
  }
  debounceTimeout = setTimeout(() => {
    restartProcess();
  }, 250); // 250ms debounce
}

// Set up watchers
for (const watchPath of watchPaths) {
  const resolvedPath = path.resolve(watchPath);
  try {
    const stat = fs.statSync(resolvedPath);
    if (stat.isDirectory()) {
      console.log(`[nodemon] watching dir: ${watchPath}`);
      fs.watch(resolvedPath, { recursive: true }, handleFileChange);
    } else {
      console.log(`[nodemon] watching file: ${watchPath}`);
      fs.watch(resolvedPath, handleFileChange);
    }
  } catch (err) {
    console.error(`[nodemon] Error watching ${watchPath}: ${err.message}`);
  }
}

// Start initially
startProcess();
