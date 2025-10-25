/**
 * Campaign Plans API - List and Create
 * GET /api/campaigns/plans - List all plans
 * POST /api/campaigns/plans - Create new plan
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAllPlans, getAllPlanSummaries, createPlan } from '@/lib/database/planning-queries';
import type { PlanStatus, CreatePlanInput } from '@/types/planning';

/**
 * GET /api/campaigns/plans
 * List all campaign plans with optional filtering
 * Query params:
 * - status: 'draft' | 'approved' | 'executed'
 * - summary: 'true' to get aggregated stats
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as PlanStatus | null;
    const includeSummary = searchParams.get('summary') === 'true';

    // Use summary view for aggregated stats, or basic plan list
    const plans = includeSummary
      ? getAllPlanSummaries(status ? { status } : undefined)
      : getAllPlans(status ? { status } : undefined);

    return NextResponse.json({
      success: true,
      data: plans,
      count: plans.length,
    });
  } catch (error) {
    console.error('Error fetching plans:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch plans' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/campaigns/plans
 * Create a new campaign plan
 * Body: { name, description?, notes?, created_by? }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as CreatePlanInput;

    // Validation
    if (!body.name || body.name.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Plan name is required' },
        { status: 400 }
      );
    }

    const plan = createPlan(body);

    return NextResponse.json({
      success: true,
      data: plan,
      message: 'Plan created successfully',
    });
  } catch (error) {
    console.error('Error creating plan:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create plan' },
      { status: 500 }
    );
  }
}
