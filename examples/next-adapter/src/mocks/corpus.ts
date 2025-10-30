export interface CorpusSummary {
  conversations: number;
  messages: number;
  lastSync: string;
  channels: Array<{ id: string; label: string; conversations: number }>;
}

export const corpusMock: CorpusSummary = {
  conversations: 482,
  messages: 13240,
  lastSync: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
  channels: [
    { id: 'field', label: 'Field Ops', conversations: 182 },
    { id: 'research', label: 'Research Squad', conversations: 96 },
    { id: 'intel', label: 'Intelligence', conversations: 204 },
  ],
};
