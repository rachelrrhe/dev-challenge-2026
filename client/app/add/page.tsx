import { getRestaurants } from '@/lib/apiClient';
import { AddForm } from './AddForm';

// Server component: loads the restaurant list (for the "Old" tab's dropdown)
// and hands it to the interactive client form.
export default async function AddPage() {
  const restaurants = await getRestaurants();
  return <AddForm restaurants={restaurants} />;
}
