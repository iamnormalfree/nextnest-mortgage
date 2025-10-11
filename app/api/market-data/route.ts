import { NextResponse } from 'next/server'

/**
 * Market data endpoint for Chatwoot bot to fetch current rates
 * Called by Web Request block in Chatwoot bot flow
 */
export async function GET() {
  try {
    // Simulate fetching real market data
    // In production, integrate with actual data sources
    const marketData = {
      fedRate: 5.5,
      soraRate: 3.67,
      bankRates: {
        dbs: { fixed2yr: 3.75, fixed3yr: 3.65, floating: 4.25 },
        ocbc: { fixed2yr: 3.70, fixed3yr: 3.60, floating: 4.20 },
        uob: { fixed2yr: 3.72, fixed3yr: 3.62, floating: 4.22 }
      },
      insight: "Current rates are stabilizing after recent Fed decision. Fixed rates remain attractive for risk-averse borrowers.",
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(marketData);
  } catch (error) {
    console.error('Error fetching market data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch market data' },
      { status: 500 }
    );
  }
}