const { spawn } = require('child_process');
const path = require('path');
const electron = require('electron');

// Start the Electron app
const electronProcess = spawn(electron, ['.'], {
  stdio: 'inherit'
});

electronProcess.on('close', (code) => {
  console.log(`Electron process exited with code ${code}`);
  process.exit(code);
}); 