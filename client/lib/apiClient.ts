/**
 * The client side of the API: helpers the frontend uses to call the endpoints.
 *
 * Don't confuse this with `app/api/`, which is the other side of the same
 * boundary - the route handlers that *implement* those endpoints. This file
 * only ever talks to them over HTTP.
 *
 * The shapes these helpers return live in `lib/types.ts`, shared with the
 * handlers that produce them.
 */
import type { Restaurant, SpendingSummary, VisitWithRestaurant } from './types';

// We read a base URL from the environment because Server Components fetch on
// the server, where relative URLs don't resolve - so we need an absolute origin.
// It's the same app on the same port, so this is normally just localhost:3000.
export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

/**
 * Fetch every restaurant from the API.
 *
 * NOTE: this is a bare fetch with no error handling. It does not check the
 * response status and it does not catch network failures - callers get whatever
 * `res.json()` produces, including on a 500.
 */
export async function getRestaurants(): Promise<Restaurant[]> {
  const res = await fetch(`${API_URL}/api/restaurants`, { cache: 'no-store' });
  return res.json();
}

/**
 * Fetch a single restaurant by id.
 */
export async function getRestaurant(id: number | string): Promise<Restaurant> {
  const res = await fetch(`${API_URL}/api/restaurants/${id}`, { cache: 'no-store' });
  return res.json();
}

/** Create a new restaurant. Used by the Add page's "New" tab. */
export async function createRestaurant(input: {
  name: string;
  cuisine: string;
  address: string;
  rating: number;
  dishPhoto?: string | null;
}): Promise<Response> {
  return fetch(`${API_URL}/api/restaurants`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
}

/** Update rating/dish photo on an existing restaurant. Used by the Add page's "Old" tab. */
export async function patchRestaurant(
  id: number,
  input: { rating?: number; dishPhoto?: string | null }
): Promise<Response> {
  return fetch(`${API_URL}/api/restaurants/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
}

/** Record a visit against a restaurant. Used by both tabs of the Add page. */
export async function createVisit(input: {
  restaurantId: number;
  amountSpent: number;
  date?: string;
  notes?: string;
  dishPhoto?: string | null;
}): Promise<Response> {
  return fetch(`${API_URL}/api/visits`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
}

/** Fetch every visit (with restaurant name joined in), most recent first. */
export async function getVisits(): Promise<VisitWithRestaurant[]> {
  const res = await fetch(`${API_URL}/api/visits`, { cache: 'no-store' });
  return res.json();
}

/** Delete a single visit entry. Used by the home page's delete button. */
export async function deleteVisit(id: number): Promise<Response> {
  return fetch(`${API_URL}/api/visits/${id}`, { method: 'DELETE' });
}

/** Fetch the total-and-per-restaurant spending summary. */
export async function getSpending(): Promise<SpendingSummary> {
  const res = await fetch(`${API_URL}/api/spending`, { cache: 'no-store' });
  return res.json();
}

