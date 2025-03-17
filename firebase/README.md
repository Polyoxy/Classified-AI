# Firebase Configuration for Classified AI (Free Tier)

This directory contains configuration files for Firebase services utilized in the Classified AI application, optimized for the Firebase free tier.

## Setup

1. **Firebase Project**: The application uses the "classified-ai" Firebase project
2. **Services**: We're using the following Firebase services:
   - Authentication (Email/Password)
   - Realtime Database (instead of Firestore, for better free tier limits)

## Database Rules

The file `database.rules.json` contains security rules for the Realtime Database. These rules:

- Ensure users can only access their own data
- Limit message sizes to prevent excessive database usage
- Set limits on conversation sizes (max 100 messages per conversation)
- Establish proper indexing for efficient querying

## Free Tier Optimizations

The implementation includes several optimizations for Firebase free tier:

1. **Client-Side Caching**: We use memory caching to reduce database reads
2. **Batch Updates**: Updates are batched to reduce write operations
3. **Pagination**: Conversations are loaded with pagination (20 at a time)
4. **Debouncing**: Saves are debounced to reduce write frequency
5. **Targeted Updates**: Only changed data is written to the database
6. **RTDB vs Firestore**: Realtime Database is used instead of Firestore for better free tier limits

## Deployment

To deploy the database rules:

```bash
firebase deploy --only database
```

## Environment Configuration

The Firebase configuration is stored in `src/lib/firebase.ts`. For security in production, consider moving API keys to environment variables.

## Usage Limits (Free Tier)

- Realtime Database: 1GB storage, 10GB/month downloads
- Authentication: 50K/month authentications
- Hosting: 10GB/month data transfer

Monitor your usage in the Firebase Console to avoid unexpected charges. 