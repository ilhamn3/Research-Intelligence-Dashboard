import { repository } from '@/lib/api';
import { CommandCenterDashboard } from '@/components/CommandCenterDashboard';

export default async function CommandCenter() {
  const [stats, activity, companies, jobs, reports, triggers] = await Promise.all([
    repository.getStats(),
    repository.getActivity(),
    repository.listCompanies(),
    repository.getJobs(),
    repository.getReports(),
    repository.getTriggers(),
  ]);

  return (
    <CommandCenterDashboard
      stats={stats}
      activity={activity}
      companies={companies}
      jobs={jobs}
      reports={reports}
      triggers={triggers}
    />
  );
}
