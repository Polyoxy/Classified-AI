// This script can be used to deploy Firebase rules
// Run with: node deploy-rules.js

const fs = require('fs');
const { execSync } = require('child_process');

console.log('Deploying Firebase rules...');

// Deploy Firestore rules
console.log('Deploying Firestore rules...');
try {
  execSync('firebase deploy --only firestore:rules', { stdio: 'inherit' });
  console.log('Firestore rules deployed successfully!');
} catch (error) {
  console.error('Error deploying Firestore rules:', error);
}

// Deploy Realtime Database rules
console.log('Deploying Realtime Database rules...');
try {
  execSync('firebase deploy --only database', { stdio: 'inherit' });
  console.log('Realtime Database rules deployed successfully!');
} catch (error) {
  console.error('Error deploying Realtime Database rules:', error);
}

// Deploy Storage rules
console.log('Deploying Storage rules...');
try {
  execSync('firebase deploy --only storage', { stdio: 'inherit' });
  console.log('Storage rules deployed successfully!');
} catch (error) {
  console.error('Error deploying Storage rules:', error);
}

console.log('All rules deployed!'); 