import { NextRequest, NextResponse } from 'next/server';
import { Message } from '@/types';

/**
 * Chat API to process messages
 */
export async function POST(request: NextRequest) {
  try {
    const { messages, model } = await request.json();
    
    // Process the messages and return a response
    // This is a simplified version with no search functionality
    return NextResponse.json({
      messages,
      model,
      processed: true
    });
    
  } catch (error) {
    console.error('[Chat API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to process chat request' },
      { status: 500 }
    );
  }
} 