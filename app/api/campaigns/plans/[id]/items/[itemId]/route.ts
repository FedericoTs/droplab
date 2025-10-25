/**
 * Plan Item API - Individual Item Operations
 * GET /api/campaigns/plans/[id]/items/[itemId] - Get item by ID
 * PATCH /api/campaigns/plans/[id]/items/[itemId] - Update item
 * DELETE /api/campaigns/plans/[id]/items/[itemId] - Delete item
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getPlanItemById,
  updatePlanItem,
  deletePlanItem,
  getPlanById,
} from '@/lib/database/planning-queries';
import type { UpdatePlanItemInput } from '@/types/planning';

/**
 * GET /api/campaigns/plans/[id]/items/[itemId]
 * Get a single plan item by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; itemId: string } }
) {
  try {
    const item = getPlanItemById(params.itemId);

    if (!item) {
      return NextResponse.json(
        { success: false, error: 'Item not found' },
        { status: 404 }
      );
    }

    // Verify item belongs to plan
    if (item.plan_id !== params.id) {
      return NextResponse.json(
        { success: false, error: 'Item does not belong to this plan' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: item,
    });
  } catch (error) {
    console.error('Error fetching plan item:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch plan item' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/campaigns/plans/[id]/items/[itemId]
 * Update a plan item (campaign, quantity, wave, override, etc.)
 * Body: { campaign_id?, quantity?, wave?, is_included?, override_notes? }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; itemId: string } }
) {
  try {
    const body = await request.json() as UpdatePlanItemInput;

    // Check if item exists
    const existing = getPlanItemById(params.itemId);
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Item not found' },
        { status: 404 }
      );
    }

    // Verify item belongs to plan
    if (existing.plan_id !== params.id) {
      return NextResponse.json(
        { success: false, error: 'Item does not belong to this plan' },
        { status: 400 }
      );
    }

    // Check plan status
    const plan = getPlanById(params.id);
    if (!plan) {
      return NextResponse.json(
        { success: false, error: 'Plan not found' },
        { status: 404 }
      );
    }

    if (plan.status === 'executed') {
      return NextResponse.json(
        { success: false, error: 'Cannot edit items in executed plan' },
        { status: 400 }
      );
    }

    const updated = updatePlanItem(params.itemId, body);

    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Item updated successfully',
    });
  } catch (error) {
    console.error('Error updating plan item:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update plan item' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/campaigns/plans/[id]/items/[itemId]
 * Delete a plan item (remove store from plan)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; itemId: string } }
) {
  try {
    // Check if item exists
    const existing = getPlanItemById(params.itemId);
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Item not found' },
        { status: 404 }
      );
    }

    // Verify item belongs to plan
    if (existing.plan_id !== params.id) {
      return NextResponse.json(
        { success: false, error: 'Item does not belong to this plan' },
        { status: 400 }
      );
    }

    // Check plan status
    const plan = getPlanById(params.id);
    if (!plan) {
      return NextResponse.json(
        { success: false, error: 'Plan not found' },
        { status: 404 }
      );
    }

    if (plan.status === 'executed') {
      return NextResponse.json(
        { success: false, error: 'Cannot delete items from executed plan' },
        { status: 400 }
      );
    }

    deletePlanItem(params.itemId);

    return NextResponse.json({
      success: true,
      message: 'Item deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting plan item:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete plan item' },
      { status: 500 }
    );
  }
}
