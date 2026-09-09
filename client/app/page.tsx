import { getVisits } from '@/lib/apiClient';
import { HomeVisitList } from './HomeVisitList';

// Server component. Fetches every visit (most recent first) and hands them to
// the client-side list, which groups them by month and handles deletion.
export default async function HomePage() {
  const visits = await getVisits();

  return (
    <div>
      <h2 className="mb-4 text-lg font-medium">My Restaurant Visits</h2>
      <HomeVisitList visits={visits} />
    </div>
  );
}


