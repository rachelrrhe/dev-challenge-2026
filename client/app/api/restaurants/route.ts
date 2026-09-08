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
    const { rows } = await pool.query(
      'SELECT * FROM restaurants ORDER BY created_at DESC'
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
    // I restricted the address format to start with a number and then a string like "301 Olive Ave" in the example.
    const ADDRESS_PATTERN = /^[0-9][a-zA-Z\s.,'#-]{4,99}$/;

    const { name, cuisine, address, rating } = body;
    // I also restricted the rating to be between 0-5.
    if (!name || !cuisine || !address || !ADDRESS_PATTERN.test(address) || !rating || rating < 0 || rating > 5) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }
    const { rows } = await pool.query(
      'INSERT INTO restaurants (name, cuisine, address, rating) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, cuisine, address, rating]
    );

    return NextResponse.json(toRestaurant(rows[0]), { status: 201 });
  } catch (err) {
    return handleError(err);
  }
}
