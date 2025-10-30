import { KnowledgeRecord } from '../types/systems';

export const mockKnowledgeRecords: KnowledgeRecord[] = [
  {
    id: 'kn-3004',
    slug: 'narconations/opsec-field-manual',
    files: 7,
    createdAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    description: 'Red-team guidelines and escalation protocols.',
    status: 'ready',
  },
  {
    id: 'kn-3003',
    slug: 'labs/vision-recon-blueprint',
    files: 5,
    createdAt: new Date(Date.now() - 1000 * 60 * 85).toISOString(),
    description: 'Recon capture workflows for offsite ops.',
    status: 'pending',
  },
  {
    id: 'kn-3002',
    slug: 'social/propagation-kit',
    files: 9,
    createdAt: new Date(Date.now() - 1000 * 60 * 190).toISOString(),
    description: 'Narrative templates for pulses and drops.',
    status: 'ready',
  },
];
