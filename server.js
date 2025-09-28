// Start Next.js and Express concurrently in a single Render service
const { spawn } = require('child_process');

// Use the platform-provided port for Next.js
const nextPort = process.env.PORT || '3000';
// Run Express on an internal port distinct from Next.js
const expressPort = process.env.BACKEND_PORT || '5001';

console.log(`Starting Next.js on PORT=${nextPort}`);
const nextProc = spawn('pnpm', ['start'], {
  stdio: 'inherit',
  env: { ...process.env, PORT: String(nextPort) }
});

console.log(`Starting Express backend on PORT=${expressPort}`);
const expressProc = spawn('node', ['backend/app.js'], {
  stdio: 'inherit',
  env: { ...process.env, PORT: String(expressPort) }
});

const shutdown = (signal) => {
  console.log(`Received ${signal}. Shutting down...`);
  try { nextProc.kill(); } catch {}
  try { expressProc.kill(); } catch {}
  process.exit(0);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

nextProc.on('exit', (code) => {
  console.log(`Next.js process exited with code ${code}`);
});

expressProc.on('exit', (code) => {
  console.log(`Express process exited with code ${code}`);
});


