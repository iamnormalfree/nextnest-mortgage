import { NextResponse } from 'next/server'
import { initializeWorker, getWorkerStatus } from '@/lib/queue/worker-manager'

// Force dynamic rendering - needs runtime environment variables for BullMQ/Redis
export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    console.log('🚀 Manual worker initialization requested...')

    await initializeWorker()

    const status = getWorkerStatus()

    return NextResponse.json({
      success: true,
      message: 'Worker initialized successfully',
      status,
    })
  } catch (error: any) {
    console.error('❌ Failed to start worker:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  const status = getWorkerStatus()
  return NextResponse.json({
    worker: status,
  })
}
