import { getRestaurants, getVisits } from '@/lib/apiClient';
import { VisitsCalendar } from './VisitsCalendar';

// Server component. Loads all visits and restaurants once; the interactive
// calendar/summary/favorite sections filter by month on the client.
export default async function VisitsPage() {
  const [visits, restaurants] = await Promise.all([getVisits(), getRestaurants()]);

  return <VisitsCalendar visits={visits} restaurants={restaurants} />;
}

