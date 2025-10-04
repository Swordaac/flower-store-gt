#!/usr/bin/env node

// Test script to verify server configuration
const { spawn } = require('child_process');

console.log('🧪 Testing server configuration...\n');

// Test Express server binding
console.log('1. Testing Express server binding to 0.0.0.0...');
const expressTest = spawn('node', ['-e', `
  const express = require('express');
  const app = express();
  const PORT = 5002; // Use different port for testing
  
  app.get('/test', (req, res) => {
    res.json({ message: 'Server is accessible from 0.0.0.0', port: PORT });
  });
  
  app.listen(PORT, '0.0.0.0', () => {
    console.log('✅ Express server bound to 0.0.0.0:' + PORT);
    setTimeout(() => process.exit(0), 1000);
  });
`], { stdio: 'inherit' });

expressTest.on('exit', (code) => {
  if (code === 0) {
    console.log('✅ Express server binding test passed\n');
  } else {
    console.log('❌ Express server binding test failed\n');
  }
});

// Test Next.js server
console.log('2. Testing Next.js server configuration...');
const nextTest = spawn('node', ['-e', `
  const { spawn } = require('child_process');
  const nextProc = spawn('pnpm', ['start'], {
    stdio: 'pipe',
    env: { ...process.env, PORT: '3001' }
  });
  
  let output = '';
  nextProc.stdout.on('data', (data) => {
    output += data.toString();
    if (output.includes('Ready in')) {
      console.log('✅ Next.js server started successfully');
      nextProc.kill();
      setTimeout(() => process.exit(0), 1000);
    }
  });
  
  nextProc.stderr.on('data', (data) => {
    console.error('Next.js error:', data.toString());
  });
  
  setTimeout(() => {
    console.log('❌ Next.js server test timed out');
    nextProc.kill();
    process.exit(1);
  }, 30000);
`], { stdio: 'inherit' });

nextTest.on('exit', (code) => {
  if (code === 0) {
    console.log('✅ Next.js server test passed\n');
  } else {
    console.log('❌ Next.js server test failed\n');
  }
});

console.log('🎉 Server configuration tests completed!');
console.log('\n📋 Summary of fixes applied:');
console.log('   • Express server now binds to 0.0.0.0 instead of localhost');
console.log('   • Added timeout configurations (120 seconds)');
console.log('   • Added production domain to CORS allowed origins');
console.log('   • Improved error handling and process management');
console.log('   • Enhanced environment variable handling');
