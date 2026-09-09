'use client';

import { useRouter } from 'next/navigation';
import type { VisitWithRestaurant } from '@/lib/types';
import { deleteVisit } from '@/lib/apiClient';

interface Props {
  visits: VisitWithRestaurant[];
}

const MONTH_LABELS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function HomeVisitList({ visits }: Props) {
  const router = useRouter();

  // Visits already arrive sorted latest-first, so grouping in order keeps
  // the most recent month on top without a separate sort pass.
  const groups: { label: string; visits: VisitWithRestaurant[] }[] = [];
  for (const visit of visits) {
    const [year, month] = visit.date.split('-');
    const label = `${MONTH_LABELS[Number(month) - 1]} ${year}`;
    const lastGroup = groups[groups.length - 1];
    if (lastGroup?.label === label) {
      lastGroup.visits.push(visit);
    } else {
      groups.push({ label, visits: [visit] });
    }
  }

  async function handleDelete(id: number) {
    const res = await deleteVisit(id);
    if (res.ok) router.refresh();
  }

  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <div key={group.label}>
          <h3 className="mb-2 text-sm font-semibold text-gray-500">{group.label}</h3>
          <ul className="space-y-3">
            {group.visits.map((visit) => (
              <li
                key={visit.id}
                className="rounded-lg border border-gray-200 bg-white p-4"
              >
                {visit.dishPhoto && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={visit.dishPhoto}
                    alt={`${visit.restaurantName}'s dish`}
                    className="mb-2 h-40 w-full rounded-md object-cover"
                  />
                )}
                <div className="flex items-baseline justify-between">
                  <span className="font-medium">{visit.restaurantName}</span>
                  <span className="text-sm text-gray-500">
                    {visit.restaurantRating}★
                  </span>
                </div>
                <div className="mt-1 flex items-baseline justify-between">
                  <span className="text-sm text-gray-600">
                    {visit.restaurantCuisine} · {visit.restaurantAddress}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDelete(visit.id)}
                    className="text-sm text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
