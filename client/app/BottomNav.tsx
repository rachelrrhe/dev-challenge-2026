'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

// Navigator bar for Restaurants and Visits
const NAV_ITEMS = [
  { href: '/', label: 'R', title: 'My Restaurants' },
  { href: '/visits', label: 'V', title: 'My Visits' },
];

export function BottomNav() {
  const pathname = usePathname();

  // The Add page has its own back button, so hide the floating nav there.
  if (pathname === '/add') return null;

  return (
    <>
      <nav className="fixed bottom-7 left-5 flex gap-2 rounded-full border border-gray-200 bg-gray-500/50 px-2 py-2 shadow-lg">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.title}
              className={`flex h-11 w-11 items-center justify-center rounded-full text-lg font-semibold ${
                active ? 'bg-gray-700 text-white' : 'bg-white text-gray-700'
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
      <Link
        href="/add"
        title="Add a visit"
        className="fixed bottom-8 right-8 flex h-14 w-14 items-center justify-center rounded-full bg-green-300 text-xl font-semibold text-gray-700 shadow-lg hover:bg-green-500"
      >
        +
      </Link>
    </>
  );
}

