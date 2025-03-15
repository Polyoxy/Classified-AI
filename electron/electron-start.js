const { spawn } = require('child_process');
const { createServer } = require('http');
const path = require('path');
const waitOn = require('wait-on');

async function checkPort(port) {
  return new Promise((resolve) => {
    const server = createServer();
    server.on('error', () => {
      resolve(false); // Port is in use
    });
    
    server.on('listening', () => {
      server.close();
      resolve(true); // Port is available
    });
    
    server.listen(port);
  });
}

async function startElectron() {
  console.log('Starting Next.js development server...');
  
  // Start Next.js development server
  const nextProcess = spawn('npm', ['run', 'dev'], { 
    shell: true,
    stdio: 'inherit',
    env: {
      ...process.env,
      FORCE_COLOR: '1', // Enable colors in output
    }
  });
  
  // Check if port 3000 is available, if not try 3001
  let port = 3000;
  const port3000Available = await checkPort(3000);
  
  if (!port3000Available) {
    console.log('Port 3000 is not available, trying port 3001');
    port = 3001;
  }
  
  console.log(`Waiting for Next.js server on port ${port}...`);
  
  try {
    // Wait for the server to be ready
    await waitOn({
      resources: [`http://localhost:${port}`],
      timeout: 30000, // 30 seconds
      interval: 100,
    });
    
    console.log(`Next.js server is running on port ${port}`);
    
    // Set the environment variable for the Electron process
    process.env.PORT = port.toString();
    
    // Start Electron app
    console.log('Starting Electron app...');
    const electronProcess = spawn('electron', ['.'], {
      shell: true,
      stdio: 'inherit',
      env: {
        ...process.env,
        PORT: port.toString(),
      }
    });
    
    // Handle Electron exit
    electronProcess.on('close', (code) => {
      console.log(`Electron app exited with code ${code}`);
      nextProcess.kill();
      process.exit(code);
    });
    
    // Handle process termination
    process.on('SIGINT', () => {
      electronProcess.kill();
      nextProcess.kill();
      process.exit(0);
    });
    
  } catch (error) {
    console.error('Error waiting for Next.js server:', error);
    nextProcess.kill();
    process.exit(1);
  }
}

startElectron().catch(err => {
  console.error('Failed to start:', err);
  process.exit(1);
}); 