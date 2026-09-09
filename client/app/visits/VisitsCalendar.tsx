'use client';

import { useMemo, useState } from 'react';
import type { Restaurant, VisitWithRestaurant } from '@/lib/types';

interface Props {
  visits: VisitWithRestaurant[];
  restaurants: Restaurant[];
}

type ViewMode = 'month' | 'year';

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_LABELS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/** "$21.00" -> "$21", per the calendar's compact amount display. */
function formatAmount(amount: number | null): string {
  return amount === null ? '' : `$${Math.round(amount)}`;
}

export function VisitsCalendar({ visits, restaurants }: Props) {
  const today = useMemo(() => new Date(), []);
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [modeMenuOpen, setModeMenuOpen] = useState(false);
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [slideDir, setSlideDir] = useState<'left' | 'right'>('left');

  function goToMonth(delta: number) {
    setSlideDir(delta > 0 ? 'left' : 'right');
    let newMonth = month + delta;
    let newYear = year;
    if (newMonth < 0) {
      newMonth = 11;
      newYear -= 1;
    } else if (newMonth > 11) {
      newMonth = 0;
      newYear += 1;
    }
    setMonth(newMonth);
    setYear(newYear);
  }

  const restaurantById = useMemo(
    () => new Map(restaurants.map((r) => [r.id, r])),
    [restaurants]
  );

  const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;
  const visitsThisMonth = useMemo(
    () => visits.filter((v) => v.date.startsWith(monthPrefix)),
    [visits, monthPrefix]
  );
  const visitsThisYear = useMemo(
    () => visits.filter((v) => v.date.startsWith(`${year}-`)),
    [visits, year]
  );

  // Last-added visit per date, by created_at (a day can have more than one visit).
  const visitByDate = useMemo(() => {
    const map = new Map<string, VisitWithRestaurant>();
    for (const v of visitsThisMonth) {
      const existing = map.get(v.date);
      if (!existing || new Date(v.createdAt) > new Date(existing.createdAt)) {
        map.set(v.date, v);
      }
    }
    return map;
  }, [visitsThisMonth]);

  // Total spend per date, since a day can have visits to more than one restaurant.
  const spendByDate = useMemo(() => {
    const map = new Map<string, number>();
    for (const v of visitsThisMonth) {
      map.set(v.date, (map.get(v.date) ?? 0) + (v.amountSpent ?? 0));
    }
    return map;
  }, [visitsThisMonth]);

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstWeekday = new Date(year, month, 1).getDay();
  const cells: (number | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const totalVisits = visitsThisMonth.length;
  const distinctRestaurants = new Set(visitsThisMonth.map((v) => v.restaurantId)).size;
  const totalSpentMonth = visitsThisMonth.reduce((sum, v) => sum + (v.amountSpent ?? 0), 0);

  // Monthly favorite: most visits, ties broken by higher restaurant rating.
  const visitCounts = new Map<number, number>();
  for (const v of visitsThisMonth) {
    visitCounts.set(v.restaurantId, (visitCounts.get(v.restaurantId) ?? 0) + 1);
  }
  let favoriteId: number | null = null;
  let favoriteCount = 0;
  for (const [id, count] of visitCounts) {
    if (count > favoriteCount) {
      favoriteId = id;
      favoriteCount = count;
    } else if (count === favoriteCount && favoriteId !== null) {
      const currentRating = restaurantById.get(favoriteId)?.rating ?? 0;
      const candidateRating = restaurantById.get(id)?.rating ?? 0;
      if (candidateRating > currentRating) favoriteId = id;
    }
  }
  const favoriteRestaurant = favoriteId !== null ? restaurantById.get(favoriteId) : undefined;

  // Per-month totals for the year grid's spend-based shading.
  const monthlyTotals = useMemo(() => {
    const totals = Array(12).fill(0);
    for (const v of visitsThisYear) {
      const m = Number(v.date.slice(5, 7)) - 1;
      totals[m] += v.amountSpent ?? 0;
    }
    return totals;
  }, [visitsThisYear]);
  const maxMonthlyTotal = Math.max(...monthlyTotals, 0);
  const totalSpentYear = visitsThisYear.reduce((sum, v) => sum + (v.amountSpent ?? 0), 0);

  function monthShade(total: number): React.CSSProperties {
    if (maxMonthlyTotal <= 0) return { backgroundColor: 'rgba(74, 222, 128, 0.25)' };
    const opacity = 0.15 + (total / maxMonthlyTotal) * 0.75;
    return { backgroundColor: `rgba(22, 163, 74, ${opacity})` };
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-medium">My Visits</h2>
        <div className="relative">
          <button
            type="button"
            onClick={() => setModeMenuOpen((open) => !open)}
            className="flex items-center gap-1 rounded-md border border-gray-300 bg-white px-3 py-1 text-sm"
          >
            {viewMode === 'month' ? 'Monthly' : 'Yearly'}
            <span className="text-xs">▾</span>
          </button>
          {modeMenuOpen && (
            <div className="absolute right-0 z-10 mt-1 w-28 overflow-hidden rounded-md border border-gray-200 bg-white shadow-lg">
              {(['month', 'year'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    setViewMode(m);
                    setModeMenuOpen(false);
                  }}
                  className="block w-full px-3 py-2 text-left text-sm hover:bg-gray-100"
                >
                  {m === 'month' ? 'Monthly' : 'Yearly'}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {viewMode === 'month' ? (
        <>
      <div className="mb-4">
        <div className="mb-2 grid grid-cols-[auto_1fr_auto] items-center">
          <button
            type="button"
            onClick={() => goToMonth(-1)}
            aria-label="Previous month"
            className="flex h-6 w-6 items-center justify-center rounded-full border border-gray-300 text-xs"
          >
            ‹
          </button>
          <div className="text-center">
            <div className="text-2xl font-semibold leading-tight">{MONTH_LABELS[month]}</div>
            <div className="text-sm text-gray-500">{year}</div>
          </div>
          <button
            type="button"
            onClick={() => goToMonth(1)}
            aria-label="Next month"
            className="flex h-6 w-6 items-center justify-center rounded-full border border-gray-300 text-xs"
          >
            ›
          </button>
        </div>

        <div
          key={`${year}-${month}`}
          className={`rounded-xl bg-gray-100 p-3 ${
            slideDir === 'left' ? 'animate-slide-in-left' : 'animate-slide-in-right'
          }`}
        >
          <div className="mb-2 grid grid-cols-7 gap-1 text-center text-xs font-medium text-gray-500">
            {WEEKDAY_LABELS.map((label) => (
              <div key={label}>{label}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {cells.map((day, i) => {
              if (day === null) return <div key={i} />;

              const dateStr = `${monthPrefix}-${String(day).padStart(2, '0')}`;
              const visit = visitByDate.get(dateStr);
              const dayTotal = spendByDate.get(dateStr) ?? null;

              if (!visit) {
                return (
                  <div
                    key={i}
                    className="flex aspect-square items-center justify-center rounded-md bg-white text-sm text-black"
                  >
                    {day}
                  </div>
                );
              }

              if (visit.dishPhoto) {
                return (
                  <div
                    key={i}
                    className="relative aspect-square overflow-hidden rounded-md bg-cover bg-center"
                    style={{ backgroundImage: `url(${visit.dishPhoto})` }}
                    title={visit.restaurantName}
                  >
                    {/* Dim the photo so the overlaid date/amount stay readable. */}
                    <div className="absolute inset-0 bg-black/40" />
                    <span className="absolute left-1 top-0.5 text-[10px] font-medium text-white drop-shadow">
                      {day}
                    </span>
                    <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-white drop-shadow">
                      {formatAmount(dayTotal)}
                    </span>
                  </div>
                );
              }

              return (
                <div
                  key={i}
                  className="relative flex aspect-square items-center justify-center rounded-md bg-green-300 text-sm font-bold text-gray-800"
                  title={visit.restaurantName}
                >
                  <span className="absolute left-1 top-0.5 text-[10px] font-medium">{day}</span>
                  <span>{visit.restaurantName.charAt(0).toUpperCase()}</span>
                  <span className="absolute bottom-0.5 left-1 text-[9px] font-medium">
                    {formatAmount(dayTotal)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mb-4 flex rounded-xl border border-green-300 bg-gray-100 p-4">
        <div className="w-2/5">
          <div className="font-medium">This Month</div>
          <div className="mt-1 text-sm text-gray-600">{totalVisits} visits</div>
          <div className="text-sm text-gray-600">{distinctRestaurants} restaurants</div>
        </div>
        <div className="flex w-3/5 items-center justify-end">
          <div className="text-3xl font-semibold">${totalSpentMonth.toFixed(2)}</div>
        </div>
      </div>

      <div className="flex rounded-xl bg-gray-100 p-4">
        <div className="w-2/5">
          <div className="font-medium">Monthly Favorite</div>
          {favoriteRestaurant ? (
            <>
              <div className="mt-1 text-sm text-gray-600">{favoriteRestaurant.name}</div>
              <div className="text-sm text-gray-600">{favoriteCount} visits</div>
            </>
          ) : (
            <div className="mt-1 text-sm text-gray-600">No visits yet</div>
          )}
        </div>
        <div className="flex w-3/5 items-center justify-center">
          {favoriteRestaurant?.dishPhoto && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={favoriteRestaurant.dishPhoto}
              alt={favoriteRestaurant.name}
              className="h-20 w-20 rounded-md object-cover shadow"
            />
          )}
        </div>
      </div>
        </>
      ) : (
        <>
          <div className="mb-4 rounded-xl bg-gray-100 p-3">
            <div className="mb-2 text-center text-2xl font-semibold leading-tight">{year}</div>
            <div className="grid grid-cols-4 gap-2">
              {MONTH_LABELS.map((label, i) => (
                <div
                  key={label}
                  className="flex aspect-square flex-col items-center justify-center gap-1 rounded-md text-sm font-semibold text-gray-800"
                  style={monthShade(monthlyTotals[i])}
                >
                  <span>{label.slice(0, 3)}</span>
                  <span className="text-xs font-normal">${Math.round(monthlyTotals[i])}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex rounded-xl border border-green-300 bg-gray-100 p-4">
            <div className="flex w-2/5 items-center">
              <div className="font-medium">This Year</div>
            </div>
            <div className="flex w-3/5 flex-col items-end justify-center">
              <div className="text-3xl font-semibold">${totalSpentYear.toFixed(2)}</div>
              <div className="text-sm text-gray-600">
                {visitsThisYear.length} visit{visitsThisYear.length === 1 ? '' : 's'}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
