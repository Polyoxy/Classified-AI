import { NextRequest, NextResponse } from 'next/server';
import { rtdb } from '@/lib/firebase';
import { ref, set } from 'firebase/database';

export async function POST(request: NextRequest) {
  try {
    // Get userId and token from the request
    const { userId, token } = await request.json();

    // Simple validation
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Reference to the user's conversations
    const conversationsRef = ref(rtdb, `users/${userId}/conversations`);
    
    // Delete all conversations by setting to null
    await set(conversationsRef, null);
    
    return NextResponse.json(
      { success: true, message: 'All conversations deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error resetting conversations:', error);
    return NextResponse.json(
      { error: 'Failed to delete conversations', details: (error as Error).message },
      { status: 500 }
    );
  }
} 