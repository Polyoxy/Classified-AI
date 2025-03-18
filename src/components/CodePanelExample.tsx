import React from 'react';
import CodeSnippet from './CodeSnippet';

// Example code for demonstration
const sampleCode = `// User Authentication Function
import { createUserWithEmailAndPassword } from 'firebase/auth';

/**
 * Creates a new user account with the given email and password
 * @param {string} email - The user's email address 
 * @param {string} password - The user's password
 * @returns {Promise<UserCredential>} Firebase user credential
 */
export async function createUserAccount(email, password) {
  try {
    // Validate inputs
    if (!email || !email.includes('@')) {
      throw new Error('Please provide a valid email address');
    }
    
    if (!password || password.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }
    
    // Create the user account in Firebase
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    
    // Return the user credential
    return userCredential;
  } catch (error) {
    console.error('Error creating user account:', error);
    throw error;
  }
}`;

const sampleCode2 = `// Database Connection Setup
import { MongoClient } from 'mongodb';

/**
 * Establishes a connection to the MongoDB database
 * @param {string} uri - MongoDB connection string
 * @returns {Promise<MongoClient>} Connected MongoDB client
 */
export async function connectToDatabase(uri) {
  if (!uri) {
    throw new Error('Database connection URI is required');
  }
  
  try {
    // Create a new MongoClient
    const client = new MongoClient(uri);
    
    // Connect to the MongoDB server
    await client.connect();
    
    // Verify connection
    await client.db('admin').command({ ping: 1 });
    console.log('Connected successfully to MongoDB server');
    
    return client;
  } catch (error) {
    console.error('Failed to connect to the database:', error);
    throw error;
  }
}`;

const CodePanelExample: React.FC = () => {
  return (
    <div style={{ padding: '2rem' }}>
      <h1>Code Panel Example</h1>
      <p>Click on any of the code snippets below to expand them into a panel:</p>
      
      <CodeSnippet 
        code={sampleCode}
        language="javascript"
        title="User Authentication Function"
      />
      
      <CodeSnippet 
        code={sampleCode2}
        language="javascript"
        title="Database Connection Setup"
      />
    </div>
  );
};

export default CodePanelExample; 