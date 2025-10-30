import { getDashboardData } from '../src/data/dashboard';
import { DashboardView } from '../src/components/dashboard/DashboardView';

export default async function Page() {
  const data = await getDashboardData();
  return (
    <div className="space-y-6">
      <DashboardView data={data} />
    </div>
  );
}
