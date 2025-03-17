// Reset all conversations in Firebase for a specific user
// This script removes all conversations from Firebase Realtime Database using Admin SDK

// Import Firebase Admin SDK
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://classified-ai-b1337-default-rtdb.firebaseio.com'
});

// Function to clear conversations for a user
async function resetConversations(userId) {
  if (!userId) {
    console.error('Error: User ID is required');
    return false;
  }

  try {
    // Reference to the user's conversations
    const db = admin.database();
    const conversationsRef = db.ref(`users/${userId}/conversations`);
    
    // Delete all conversations by setting to null
    console.log(`Deleting all conversations for user ${userId}...`);
    await conversationsRef.set(null);
    
    console.log('All conversations have been deleted successfully!');
    return true;
  } catch (error) {
    console.error('Error deleting conversations:', error.message);
    return false;
  }
}

// Get userId from command line arguments
const args = process.argv.slice(2);
const userId = args[0];

if (!userId) {
  console.log('Usage: node resetConversations.js <userId>');
  process.exit(1);
}

// Execute the reset
resetConversations(userId)
  .then(success => {
    if (success) {
      console.log('Operation completed successfully.');
    } else {
      console.log('Operation failed.');
    }
    process.exit(0);
  })
  .catch(error => {
    console.error('Unexpected error:', error);
    process.exit(1);
  }); 