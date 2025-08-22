import { NextResponse } from 'next/server';

/**
 * API route to fetch active rooms from the Colyseus server
 * GET /api/rooms/active - Returns list of available public rooms
 */
export async function GET(): Promise<NextResponse> {
  try {
    // Get the Colyseus server URL from environment or default to localhost
    const serverUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:2567';
    
    // Remove 'ws://' or 'wss://' and replace with 'http://' or 'https://'
    const httpServerUrl = serverUrl
      .replace(/^ws:\/\//, 'http://')
      .replace(/^wss:\/\//, 'https://');
    
    const apiUrl = `${httpServerUrl}/api/rooms/active`;
    
    // Fetch active rooms from the Colyseus server
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // Add a timeout to prevent hanging requests
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });
    
    if (!response.ok) {
      console.error(`❌ Server responded with ${response.status}: ${response.statusText}`);
      return NextResponse.json(
        { 
          error: 'Failed to fetch active rooms from server',
          status: response.status,
          statusText: response.statusText,
          success: false
        },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    
    // Return the data from the Colyseus server
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('❌ Error fetching active rooms:', error);
    
    // Handle different types of errors
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return NextResponse.json(
          { 
            error: 'Request timeout - server took too long to respond',
            success: false
          },
          { status: 504 }
        );
      }
      
      if (error.message.includes('ECONNREFUSED')) {
        return NextResponse.json(
          { 
            error: 'Cannot connect to game server - server may be down',
            success: false
          },
          { status: 503 }
        );
      }
    }
    
    return NextResponse.json(
      { 
        error: 'Internal server error while fetching active rooms',
        success: false
      },
      { status: 500 }
    );
  }
} 