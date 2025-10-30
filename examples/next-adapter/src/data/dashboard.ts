import { USE_MOCKS } from '../config';
import { dashboardMock, type DashboardData } from '../mocks/dashboard';

export interface DashboardState extends DashboardData {
  isMock: boolean;
  errors: string[];
}

export async function getDashboardData(): Promise<DashboardState> {
  const errors: string[] = [];

  if (USE_MOCKS) {
    return { ...dashboardMock, isMock: true, errors };
  }

  try {
    // TODO: Replace with live integrations once historian + ingest summaries ship.
    // Placeholder ensures the UI renders while backend contracts stabilize.
    return { ...dashboardMock, isMock: true, errors: ['Live dashboard feed not yet wired; falling back to mock data.'] };
  } catch (error: any) {
    errors.push(error?.message ?? 'Unknown dashboard error');
    return { ...dashboardMock, isMock: true, errors };
  }
}
