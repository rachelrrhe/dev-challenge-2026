import { NextResponse } from 'next/server';
import { pool } from '@/db/pool';
import { handleError } from '@/lib/errors';
import { toRestaurant } from '@/lib/types';

type Params = { params: { id: string } };

/**
 * GET /api/restaurants/:id
 * Returns a single restaurant, or 404 if it doesn't exist.
 */
export async function GET(_req: Request, { params }: Params) {
  try {
    const id = Number(params.id);
    // I added error check if id is invalid and then check if restaurant is found.
    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ error: 'Invalid id' }, { status: 404 });
    }
    const { rows } = await pool.query(
      `SELECT id, name, cuisine, address, rating,
              dish_photo AS "dishPhoto", created_at AS "createdAt", updated_at AS "updatedAt"
       FROM restaurants WHERE id = $1`,
      [params.id]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
    }

    return NextResponse.json(toRestaurant(rows[0]));
  } catch (err) {
    return handleError(err);
  }
}

/**
 * PUT /api/restaurants/:id
 * Update an existing restaurant.
 *
 * TODO (A2): implement. Update the row matching :id and return the updated
 * record (or 404 if it doesn't exist). Validate the body the same way POST does.
 */
export async function PUT(_req: Request, _ctx: Params) {
  try {
    const { id } = _ctx.params;
    const body = await _req.json();
    const id_number = Number(_ctx.params.id);
    if (!Number.isInteger(id_number) || id_number <= 0) {
      return NextResponse.json({ error: 'Invalid id' }, { status: 404 });
    }
    const { name, cuisine, address, rating, dishPhoto } = body;
    // copied same validation from POST
    if (typeof name !== 'string' ||
        name.trim() === '' ||
        typeof cuisine !== 'string' ||
        cuisine.trim() === '' ||
        typeof address !== 'string' ||
        typeof rating !== 'number' ||
        rating < 0 ||
        rating > 5 ||
        (dishPhoto !== undefined && dishPhoto !== null && typeof dishPhoto !== 'string')) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }
    // changed code from part A to add dishPhoto and updated_at
    const { rows } = await pool.query(
      `UPDATE restaurants
       SET name = $1, cuisine = $2, address = $3, rating = $4,
           dish_photo = COALESCE($5, dish_photo), updated_at = now()
       WHERE id = $6
       RETURNING id, name, cuisine, address, rating,
                 dish_photo AS "dishPhoto", created_at AS "createdAt", updated_at AS "updatedAt"`,
      [name, cuisine, address, rating, dishPhoto ?? null, id_number]
    );
    if (rows.length === 0) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
    }
    return NextResponse.json(toRestaurant(rows[0]));
  } catch (err) {
    return handleError(err);
  }
}

/**
 * PATCH /api/restaurants/:id
 * Partially update rating and/or dish photo. When there's a visit created to an
 * existing restaurant" flow, but the name/cuisine/address is not resubmitted
 * so a full PUT doesn't fit. (explained in my add page)
 */
export async function PATCH(_req: Request, _ctx: Params) {
  try {
    const id_number = Number(_ctx.params.id);
    if (!Number.isInteger(id_number) || id_number <= 0) {
      return NextResponse.json({ error: 'Invalid id' }, { status: 404 });
    }

    const body = await _req.json();
    const { rating, dishPhoto } = body;
    const hasRating = rating !== undefined;
    const hasPhoto = dishPhoto !== undefined;
    if (
      (!hasRating && !hasPhoto) ||
      (hasRating && (typeof rating !== 'number' || rating < 0 || rating > 5)) ||
      (hasPhoto && dishPhoto !== null && typeof dishPhoto !== 'string')
    ) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { rows } = await pool.query(
      `UPDATE restaurants
       SET rating = COALESCE($1, rating), dish_photo = COALESCE($2, dish_photo), updated_at = now()
       WHERE id = $3
       RETURNING id, name, cuisine, address, rating,
                 dish_photo AS "dishPhoto", created_at AS "createdAt", updated_at AS "updatedAt"`,
      [hasRating ? rating : null, hasPhoto ? dishPhoto : null, id_number]
    );
    if (rows.length === 0) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
    }
    return NextResponse.json(toRestaurant(rows[0]));
  } catch (err) {
    return handleError(err);
  }
}

/**
 * DELETE /api/restaurants/:id
 * Delete a restaurant.
 *
 * TODO (A2): implement. Delete the row matching :id and return 204 (or 404
 * if it doesn't exist).
 *
 * Worth noticing: the migration already made a call about what happens to that
 * restaurant's visits. Go read it. If you disagree with it, say so in your
 * write-up.
 */
export async function DELETE(_req: Request, _ctx: Params) {
  try {
    const { id } = _ctx.params;
    const id_number = Number(_ctx.params.id);
    if (!Number.isInteger(id_number) || id_number <= 0) {
      return NextResponse.json({ error: 'Invalid id' }, { status: 404 });
    }
    const { rowCount } = await pool.query(
      'DELETE FROM restaurants WHERE id = $1',
      [id]
    );
    if (rowCount === 0) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
    }
    return NextResponse.json(null, { status: 204 });
  } catch (err) {
    return handleError(err);
  }
}
