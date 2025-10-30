'use client';

import * as React from 'react';
import { ToastProvider } from '../src/components/Toast';

export function AppProviders({ children }: { children: React.ReactNode }) {
  return <ToastProvider>{children}</ToastProvider>;
}
