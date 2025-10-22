import { NextResponse } from 'next/server';
import {
  getAllTrackingSnippets,
  createTrackingSnippet,
  updateTrackingSnippet,
  deleteTrackingSnippet,
  toggleSnippetActive,
} from '@/lib/database/template-queries';

/**
 * GET /api/tracking-snippets
 * Get all tracking snippets
 */
export async function GET() {
  try {
    const snippets = getAllTrackingSnippets();

    return NextResponse.json({
      success: true,
      snippets,
      count: snippets.length,
    });
  } catch (error) {
    console.error('Error fetching tracking snippets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tracking snippets' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/tracking-snippets
 * Create new tracking snippet
 */
export async function POST(request: Request) {
  try {
    const { name, snippet_type, code, position } = await request.json();

    // Validation
    if (!name || !snippet_type || !code || !position) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (position !== 'head' && position !== 'body') {
      return NextResponse.json(
        { error: 'Position must be "head" or "body"' },
        { status: 400 }
      );
    }

    const snippet = createTrackingSnippet(name, snippet_type, code, position);

    return NextResponse.json({
      success: true,
      snippet,
    });
  } catch (error) {
    console.error('Error creating tracking snippet:', error);
    return NextResponse.json(
      { error: 'Failed to create tracking snippet' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/tracking-snippets
 * Update or toggle tracking snippet
 */
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, action, updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Snippet ID is required' },
        { status: 400 }
      );
    }

    let snippet;

    if (action === 'toggle') {
      snippet = toggleSnippetActive(id);
    } else if (updates) {
      snippet = updateTrackingSnippet(id, updates);
    } else {
      return NextResponse.json(
        { error: 'Invalid request: provide action or updates' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      snippet,
    });
  } catch (error) {
    console.error('Error updating tracking snippet:', error);
    return NextResponse.json(
      { error: 'Failed to update tracking snippet' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/tracking-snippets
 * Delete tracking snippet
 */
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Snippet ID is required' },
        { status: 400 }
      );
    }

    deleteTrackingSnippet(id);

    return NextResponse.json({
      success: true,
      message: 'Tracking snippet deleted',
    });
  } catch (error) {
    console.error('Error deleting tracking snippet:', error);
    return NextResponse.json(
      { error: 'Failed to delete tracking snippet' },
      { status: 500 }
    );
  }
}
