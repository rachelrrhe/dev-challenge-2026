'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Restaurant } from '@/lib/types';
import { createRestaurant, createVisit, patchRestaurant } from '@/lib/apiClient';

type Mode = 'old' | 'new';

interface Props {
  restaurants: Restaurant[];
}

export function AddForm({ restaurants }: Props) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [mode, setMode] = useState<Mode>('old');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Old tab
  const [restaurantId, setRestaurantId] = useState<string | number>(restaurants[0]?.id ?? '');
  // New tab
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [cuisine, setCuisine] = useState('');
  // Shared
  const [rating, setRating] = useState('');
  const [spending, setSpending] = useState('');
  const [dishPhoto, setDishPhoto] = useState<string | null>(null);

  function handlePhotoClick() {
    fileInputRef.current?.click();
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setDishPhoto(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const ratingNum = Number(rating);
    const spendingNum = Number(spending);
    if (!rating || Number.isNaN(ratingNum) || ratingNum < 0 || ratingNum > 5) {
      setError('Rating must be a number between 0 and 5.');
      return;
    }
    if (!spending || Number.isNaN(spendingNum) || spendingNum < 0) {
      setError('Spending must be a non-negative number.');
      return;
    }

    setSubmitting(true);
    try {
      if (mode === 'old') {
        if (!restaurantId) {
          setError('Choose a restaurant.');
          return;
        }
        const id = Number(restaurantId);
        const patchRes = await patchRestaurant(id, { rating: ratingNum });
        if (!patchRes.ok) {
          const body = await patchRes.json().catch(() => ({}));
          setError(body.error ?? 'Could not update restaurant.');
          return;
        }
        const visitRes = await createVisit({ restaurantId: id, amountSpent: spendingNum, dishPhoto });
        if (!visitRes.ok) {
          const body = await visitRes.json().catch(() => ({}));
          setError(body.error ?? 'Could not record visit.');
          return;
        }
      } else {
        if (!name.trim() || !address.trim() || !cuisine.trim()) {
          setError('Name, address, and cuisine are required.');
          return;
        }
        const createRes = await createRestaurant({
          name,
          cuisine,
          address,
          rating: ratingNum,
        });
        if (!createRes.ok) {
          const body = await createRes.json().catch(() => ({}));
          setError(body.error ?? 'Could not create restaurant.');
          return;
        }
        const created = await createRes.json();
        const visitRes = await createVisit({
          restaurantId: created.id,
          amountSpent: spendingNum,
          dishPhoto,
        });
        if (!visitRes.ok) {
          const body = await visitRes.json().catch(() => ({}));
          setError(body.error ?? 'Could not record visit.');
          return;
        }
      }

      router.push('/');
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <Link
          href="/"
          title="Back to My Restaurants"
          className="flex h-8 w-8 items-center justify-center rounded-full text-lg text-gray-700 hover:bg-gray-100"
        >
          ←
        </Link>
        <h2 className="text-lg font-medium">Record a Visit</h2>
      </div>

      <div className="mb-6 flex overflow-hidden rounded-full border border-gray-300">
        <button
          type="button"
          onClick={() => setMode('old')}
          className={`flex-1 py-2 text-sm font-medium ${
            mode === 'old' ? 'bg-gray-700 text-white' : 'bg-white text-black'
          }`}
        >
          Revisiting
        </button>
        <button
          type="button"
          onClick={() => setMode('new')}
          className={`flex-1 py-2 text-sm font-medium ${
            mode === 'new' ? 'bg-gray-700 text-white' : 'bg-white text-black'
          }`}
        >
          New
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === 'old' ? (
          <label className="block">
            <span className="mb-1 block text-sm font-medium">Name:</span>
            <select
              value={restaurantId}
              onChange={(e) => setRestaurantId(e.target.value)}
              className="w-full rounded-md border border-gray-300 p-2"
            >
              {restaurants.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <>
            <label className="block">
              <span className="mb-1 block text-sm font-medium">Name:</span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-md border border-gray-300 p-2"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium">Address:</span>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full rounded-md border border-gray-300 p-2"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium">Cuisine:</span>
              <input
                type="text"
                value={cuisine}
                onChange={(e) => setCuisine(e.target.value)}
                className="w-full rounded-md border border-gray-300 p-2"
              />
            </label>
          </>
        )}

        <label className="block">
          <span className="mb-1 block text-sm font-medium">Rating:</span>
          <input
            type="number"
            min={0}
            max={5}
            step={0.1}
            value={rating}
            onChange={(e) => setRating(e.target.value)}
            className="w-full rounded-md border border-gray-300 p-2"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium">Spending:</span>
          <input
            type="number"
            min={0}
            step={0.01}
            value={spending}
            onChange={(e) => setSpending(e.target.value)}
            className="w-full rounded-md border border-gray-300 p-2"
          />
        </label>

        <div>
          <p className="mb-2 text-sm font-medium">Share Your Favorite Dish!</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handlePhotoChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={handlePhotoClick}
            className="flex h-32 w-32 items-center justify-center overflow-hidden rounded-md border border-gray-300 bg-white"
          >
            {dishPhoto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={dishPhoto} alt="Favorite dish" className="h-full w-full object-cover" />
            ) : (
              <span className="text-2xl text-gray-400">+</span>
            )}
          </button>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-md bg-gray-700 py-2 font-medium text-white disabled:opacity-50"
        >
          Submit
        </button>
      </form>
    </div>
  );
}
