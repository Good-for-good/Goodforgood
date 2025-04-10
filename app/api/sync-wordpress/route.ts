import { NextResponse } from 'next/server';
import { syncWordPressData } from '@/app/utils/wordpress-sync';

export async function POST(request: Request) {
  try {
    const { wpUrl, apiKey } = await request.json();

    // Validate API key (you should implement proper authentication)
    if (apiKey !== process.env.SYNC_API_KEY) {
      return NextResponse.json(
        { success: false, error: 'Invalid API key' },
        { status: 401 }
      );
    }

    const result = await syncWordPressData(wpUrl);
    
    if (result.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json(result, { status: 500 });
    }
  } catch (error) {
    console.error('Sync API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process sync request' },
      { status: 500 }
    );
  }
} 