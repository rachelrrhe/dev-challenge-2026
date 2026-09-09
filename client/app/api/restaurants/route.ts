import { NextResponse } from 'next/server';
import { pool } from '@/db/pool';
import { handleError } from '@/lib/errors';
import { toRestaurant } from '@/lib/types';

/**
 * GET /api/restaurants
 * Returns all restaurants.
 */
export async function GET() {
  try {
    // I changed the code in part A. Now include dish_photo and updated_at for restaurants.
    // I changed the home page (restaurants page) into a gallery list sorted by date.
    // Gallery is sorted by most recently created/updated first.
    const { rows } = await pool.query(
      `SELECT id, name, cuisine, address, rating,
              dish_photo AS "dishPhoto", created_at AS "createdAt", updated_at AS "updatedAt"
       FROM restaurants
       ORDER BY updated_at DESC`
    );
    // Map every row - raw rows don't match the contract (NUMERIC comes back
    // as a string, timestamps as Date objects). See lib/types.ts.
    return NextResponse.json(rows.map(toRestaurant));
  } catch (err) {
    return handleError(err);
  }
}

/**
 * POST /api/restaurants
 * Create a new restaurant.
 *
 * TODO (A2): implement. Read the restaurant fields from the request body,
 * insert a row, and return the created restaurant with a 201 status.
 *
 * TODO (A3): validate before you insert. Nothing validates anything today, so
 * `rating` happily accepts 6. Decide what valid means for each field and reject
 * bad bodies with a 400 rather than letting them reach the database.
 */
export async function POST(_req: Request) {
  try {
    // Read the request body
    const body = await _req.json();
    // I changed code in part A to include dishPhoto
    const { name, cuisine, address, rating, dishPhoto } = body;
    // I checked the type of the fields and restricted the rating to be between 0-5.
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

    // Check if the new restaurant is not a duplicate.
    // A restaurant is a duplicate if it shares both name and address.
    const { rows: existing } = await pool.query(
      'SELECT id FROM restaurants WHERE LOWER(name) = LOWER($1) AND LOWER(address) = LOWER($2)',
      [name, address]
    );
    if (existing.length > 0) {
      return NextResponse.json({ error: 'Restaurant already exists' }, { status: 400 });
    }

    const { rows } = await pool.query(
      `INSERT INTO restaurants (name, cuisine, address, rating, dish_photo)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, cuisine, address, rating,
                 dish_photo AS "dishPhoto", created_at AS "createdAt", updated_at AS "updatedAt"`,
      [name, cuisine, address, rating, dishPhoto ?? null]
    );

    return NextResponse.json(toRestaurant(rows[0]), { status: 201 });
  } catch (err) {
    return handleError(err);
  }
}
