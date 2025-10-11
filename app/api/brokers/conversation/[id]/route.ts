import { NextRequest, NextResponse } from 'next/server';
import { getBrokerForConversation } from '@/lib/ai/broker-assignment';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const conversationId = parseInt(params.id);
    
    if (isNaN(conversationId)) {
      return NextResponse.json(
        { error: 'Invalid conversation ID' },
        { status: 400 }
      );
    }

    const broker = await getBrokerForConversation(conversationId);
    
    if (!broker) {
      return NextResponse.json(
        { error: 'No broker assigned to this conversation' },
        { status: 404 }
      );
    }

    // Ensure we use the correct file extension for broker photos
    const photoUrl = broker.photo_url 
      ? broker.photo_url.replace(/\.(jpg|jpeg|png)$/i, '.svg') 
      : `/images/brokers/${broker.slug}.svg`;
    
    return NextResponse.json({
      broker: {
        id: broker.id,
        name: broker.name,
        photoUrl: photoUrl,
        role: broker.role,
        personalityType: broker.personality_type,
        isOnline: true
      }
    });
  } catch (error) {
    console.error('Error fetching broker:', error);
    return NextResponse.json(
      { error: 'Failed to fetch broker details' },
      { status: 500 }
    );
  }
}