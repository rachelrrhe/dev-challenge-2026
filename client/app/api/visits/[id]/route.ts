import { NextResponse } from 'next/server';
import { pool } from '@/db/pool';
import { handleError } from '@/lib/errors';

type Params = { params: { id: string } };

/**
 * DELETE /api/visits/:id
 * Delete a single visit entry. Used by the delete button on the My Restaurants
 * home page's visit-entry list.
 */
export async function DELETE(_req: Request, { params }: Params) {
  try {
    const id = Number(params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ error: 'Visit not found' }, { status: 404 });
    }

    const { rowCount } = await pool.query('DELETE FROM visits WHERE id = $1', [id]);
    if (rowCount === 0) {
      return NextResponse.json({ error: 'Visit not found' }, { status: 404 });
    }
    return NextResponse.json(null, { status: 204 });
  } catch (err) {
    return handleError(err);
  }
}
