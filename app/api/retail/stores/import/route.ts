import { NextResponse } from 'next/server';
import { bulkCreateRetailStores } from '@/lib/database/retail-queries';
import { successResponse, errorResponse } from '@/lib/utils/api-response';

// POST: Bulk import stores from CSV data
export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.stores || !Array.isArray(body.stores)) {
      return NextResponse.json(
        errorResponse('Invalid request: stores array is required', 'MISSING_STORES'),
        { status: 400 }
      );
    }

    if (body.stores.length === 0) {
      return NextResponse.json(
        errorResponse('No stores to import', 'EMPTY_STORES'),
        { status: 400 }
      );
    }

    // Validate total number of stores (soft limit warning, but no hard cap)
    if (body.stores.length > 10000) {
      console.warn(`Large import: ${body.stores.length} stores`);
      // Still proceed, but log for monitoring
    }

    // Import stores
    const result = bulkCreateRetailStores(body.stores);

    return NextResponse.json(
      successResponse(
        {
          created: result.created,
          failed: result.errors.length,
          total: body.stores.length,
          errors: result.errors,
        },
        `Successfully imported ${result.created} of ${body.stores.length} stores`
      )
    );
  } catch (error: any) {
    console.error('Error importing stores:', error);
    return NextResponse.json(
      errorResponse(error.message || 'Failed to import stores', 'IMPORT_ERROR'),
      { status: 500 }
    );
  }
}
