import { NextResponse } from 'next/server';
import { getLatestMetrics, getDashboardStats } from '@/lib/db/metrics-queries';

export async function GET() {
  try {
    const [metricsData, stats] = await Promise.all([
      getLatestMetrics(),
      getDashboardStats(),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        metrics: metricsData,
        stats,
      },
    });
  } catch (error) {
    console.error('Error fetching metrics:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch metrics',
      },
      { status: 500 }
    );
  }
}
