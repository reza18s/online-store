import { spawn, type ChildProcess } from 'node:child_process';
import { readdirSync, statSync, watch, type FSWatcher } from 'node:fs';
import { join, resolve } from 'node:path';

const apiRoot = resolve(__dirname, '..');
const sourceRoot = join(apiRoot, 'src');
const bunExecutable = process.execPath;
const watchers = new Set<FSWatcher>();
const watchedDirectories = new Set<string>();

let server: ChildProcess | undefined;
let restartTimer: ReturnType<typeof setTimeout> | undefined;
let buildInProgress = false;
let restartQueued = false;
let shuttingDown = false;

function watchSourceTree(directory: string): void {
  if (watchedDirectories.has(directory)) return;
  watchedDirectories.add(directory);

  const watcher = watch(directory, (_eventType, filename) => {
    if (!filename || shuttingDown) return;
    const changedPath = join(directory, filename.toString());
    try {
      if (statSync(changedPath).isDirectory()) watchSourceTree(changedPath);
    } catch {
      // The path may have been removed; the parent watcher remains active.
    }
    scheduleRestart();
  });
  watchers.add(watcher);

  const entries = readdirSync(directory, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) watchSourceTree(join(directory, entry.name));
  }
}

function runBun(args: string[]): Promise<number> {
  return new Promise((resolveProcess, reject) => {
    const child = spawn(bunExecutable, args, {
      cwd: apiRoot,
      stdio: 'inherit',
      windowsHide: true,
    });
    child.once('error', reject);
    child.once('exit', (code, signal) => resolveProcess(code ?? (signal ? 1 : 0)));
  });
}

function startServer(): void {
  const child = spawn(bunExecutable, ['dist/main.js'], {
    cwd: apiRoot,
    stdio: 'inherit',
    windowsHide: true,
  });
  server = child;
  child.once('error', (error) => {
    console.error(`[api:dev] server failed to start: ${error.message}`);
  });
  child.once('exit', (code, signal) => {
    if (server === child) server = undefined;
    if (!shuttingDown && (code !== 0 || signal)) {
      console.error(`[api:dev] server stopped (${signal ?? `exit ${code ?? 0}`})`);
    }
  });
}

async function stopServer(): Promise<void> {
  const child = server;
  if (!child) return;
  server = undefined;

  await new Promise<void>((resolveProcess) => {
    let resolved = false;
    const finish = () => {
      if (resolved) return;
      resolved = true;
      resolveProcess();
    };

    child.once('exit', finish);
    child.kill('SIGTERM');
    setTimeout(() => {
      if (!resolved) child.kill('SIGKILL');
      finish();
    }, 2_000).unref();
  });
}

async function rebuildAndRestart(): Promise<void> {
  if (shuttingDown) return;
  if (buildInProgress) {
    restartQueued = true;
    return;
  }

  buildInProgress = true;
  try {
    const exitCode = await runBun(['run', 'build']);
    if (exitCode !== 0) {
      console.error('[api:dev] build failed; keeping the current server running');
      return;
    }

    await stopServer();
    if (!shuttingDown) startServer();
  } catch (error) {
    console.error(
      `[api:dev] build process failed; keeping the current server running: ${error instanceof Error ? error.message : 'unknown error'}`,
    );
  } finally {
    buildInProgress = false;
    if (restartQueued) {
      restartQueued = false;
      scheduleRestart();
    }
  }
}

function scheduleRestart(): void {
  if (restartTimer) clearTimeout(restartTimer);
  restartTimer = setTimeout(() => {
    restartTimer = undefined;
    void rebuildAndRestart();
  }, 150);
}

async function shutdown(): Promise<void> {
  if (shuttingDown) return;
  shuttingDown = true;
  if (restartTimer) clearTimeout(restartTimer);
  for (const watcher of watchers) watcher.close();
  watchers.clear();
  watchedDirectories.clear();
  await stopServer();
  process.exit(0);
}

process.once('SIGINT', () => void shutdown());
process.once('SIGTERM', () => void shutdown());

watchSourceTree(sourceRoot);
startServer();
