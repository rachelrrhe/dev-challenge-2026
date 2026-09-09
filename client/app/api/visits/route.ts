import { NextResponse } from 'next/server';
import { pool } from '@/db/pool';
import { handleError } from '@/lib/errors';
import { toVisit, toVisitWithRestaurant } from '@/lib/types';

/**
 * GET /api/visits
 * Returns every visit, most recent first, with the restaurant name joined in
 */
export async function GET() {
  try {
    const { rows } = await pool.query(
      `SELECT v.id, v."restaurantId", v.date, v."amountSpent", v.notes,
              v.dish_photo AS "dishPhoto", v.created_at AS "createdAt", r.name AS "restaurantName",
              r.cuisine AS "restaurantCuisine", r.address AS "restaurantAddress", r.rating AS "restaurantRating"
       FROM visits v
       JOIN restaurants r ON r.id = v."restaurantId"
       ORDER BY v.date DESC, v.created_at DESC`
    );
    return NextResponse.json(rows.map(toVisitWithRestaurant));
  } catch (err) {
    return handleError(err);
  }
}

/**
 * POST /api/visits
 * Record a new visit (seperate from updating restaurant). If
 * a dish photo was submitted, it is updated to the restaurant as its latest photo.
 *
 * Body: { restaurantId: number, amountSpent: number, date?: "YYYY-MM-DD", notes?: string, dishPhoto?: string }
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { restaurantId, amountSpent, date, notes, dishPhoto } = body;

    if (
      !Number.isInteger(restaurantId) ||
      restaurantId <= 0 ||
      typeof amountSpent !== 'number' ||
      Number.isNaN(amountSpent) ||
      amountSpent < 0 ||
      (date !== undefined && typeof date !== 'string') ||
      (notes !== undefined && notes !== null && typeof notes !== 'string') ||
      (dishPhoto !== undefined && dishPhoto !== null && typeof dishPhoto !== 'string')
    ) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const { rows: restaurantRows } = await client.query(
        'SELECT id FROM restaurants WHERE id = $1',
        [restaurantId]
      );
      if (restaurantRows.length === 0) {
        await client.query('ROLLBACK');
        return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
      }

      const { rows } = await client.query(
        `INSERT INTO visits ("restaurantId", date, "amountSpent", notes, dish_photo)
         VALUES ($1, COALESCE($2, CURRENT_DATE), $3, $4, $5)
         RETURNING id, "restaurantId", date, "amountSpent", notes, dish_photo AS "dishPhoto", created_at AS "createdAt"`,
        [restaurantId, date ?? null, amountSpent, notes ?? null, dishPhoto ?? null]
      );
      await client.query(
        `UPDATE restaurants
         SET updated_at = now(), dish_photo = COALESCE($2, dish_photo)
         WHERE id = $1`,
        [restaurantId, dishPhoto ?? null]
      );

      await client.query('COMMIT');
      return NextResponse.json(toVisit(rows[0]), { status: 201 });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    return handleError(err);
  }
}
