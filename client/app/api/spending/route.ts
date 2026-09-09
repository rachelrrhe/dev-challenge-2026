import { NextResponse } from 'next/server';
import { pool } from '@/db/pool';
import { handleError } from '@/lib/errors';
import type { RestaurantSpending, SpendingSummary } from '@/lib/types';

/**
 * GET /api/spending
 * Aggregates visit spending per restaurant, plus a total spending for Brennen.
 */
export async function GET() {
  try {
    const { rows } = await pool.query(
      `SELECT r.id AS "restaurantId", r.name AS "restaurantName",
              COUNT(v.id)::int AS "visitCount",
              COALESCE(SUM(v."amountSpent"), 0) AS "totalSpent"
       FROM restaurants r
       JOIN visits v ON v."restaurantId" = r.id
       GROUP BY r.id, r.name
       ORDER BY "totalSpent" DESC`
    );

    const byRestaurant: RestaurantSpending[] = rows.map((row) => ({
      restaurantId: Number(row.restaurantId),
      restaurantName: String(row.restaurantName),
      visitCount: Number(row.visitCount),
      totalSpent: Number(row.totalSpent),
    }));

    const summary: SpendingSummary = {
      totalSpent: byRestaurant.reduce((sum, r) => sum + r.totalSpent, 0),
      byRestaurant,
    };

    return NextResponse.json(summary);
  } catch (err) {
    return handleError(err);
  }
}
