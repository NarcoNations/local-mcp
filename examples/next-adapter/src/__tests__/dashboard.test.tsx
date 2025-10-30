import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import DashboardPage from '../../app/page';
import { mockDashboardData } from '../mocks/dashboard';
import { ToastProvider } from '../components/Toast';
import { CommandPalette } from '../components/CommandPalette';

vi.mock('../../src/lib/dataClient', () => ({
  getDashboardData: vi.fn(() => Promise.resolve(mockDashboardData)),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

describe('dashboard experience', () => {
  it('renders quick actions from dashboard data', async () => {
    render(
      <ToastProvider>
        <DashboardPage />
      </ToastProvider>,
    );

    await waitFor(() => expect(screen.getByText('Quick actions')).toBeInTheDocument());
    expect(screen.getByText('Upload file')).toBeInTheDocument();
    expect(screen.getByText(/Historian now/i)).toBeInTheDocument();
  });

  it('opens command palette with items', () => {
    render(
      <CommandPalette
        isOpen
        onClose={() => undefined}
        items={[
          { id: 'nav-dashboard', label: 'Dashboard', href: '/' },
          { id: 'action-upload', label: 'Upload file for ingestion', action: () => undefined },
        ]}
      />,
    );

    expect(screen.getByRole('button', { name: /dashboard/i })).toHaveTextContent(
      /dashboard/i,
    );
    expect(
      screen.getByRole('button', { name: /upload file for ingestion/i }),
    ).toHaveTextContent(/upload file for ingestion/i);
  });
});
