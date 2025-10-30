export const mockPolicyEvents = Array.from({ length: 6 }).map((_, idx) => ({
  id: `policy-${idx + 1}`,
  status: idx % 2 === 0 ? 'pass' : 'fail',
  actor: 'demo@vibelabz',
  scope: idx % 2 === 0 ? 'publish:site' : 'social:post',
  reason: idx % 2 === 0 ? 'All checks passed' : 'Contains disallowed keywords',
  created_at: new Date(Date.now() - idx * 3600_000).toISOString(),
}));

export const mockEvalSets = [
  { id: 'eval-1', name: 'Crisis comms exactness', type: 'exactness', dataset_ref: 'datasets/crisis.json' },
  { id: 'eval-2', name: 'Narco tone balance', type: 'style', dataset_ref: 'datasets/tone.json' },
];

export const mockEvalRuns = [
  {
    id: 'run-1',
    eval_id: 'eval-1',
    model: 'gpt-4.1-mini',
    prompt_id: 'prompt-hero',
    started_at: new Date().toISOString(),
    finished_at: new Date().toISOString(),
    metrics: {
      bleu_like: 0.84,
      avg_latency_ms: 1280,
      avg_tokens_out: 420,
      judge_score: 4.5,
    },
  },
  {
    id: 'run-2',
    eval_id: 'eval-1',
    model: 'claude-3-haiku',
    prompt_id: 'prompt-hero',
    started_at: new Date().toISOString(),
    finished_at: new Date().toISOString(),
    metrics: {
      bleu_like: 0.79,
      avg_latency_ms: 980,
      avg_tokens_out: 380,
      judge_score: 4.2,
    },
  },
];

export const mockMapLayers = [
  {
    id: 'layer-1',
    name: 'Narco Territories',
    type: 'choropleth',
    status: 'ready',
    updated_at: new Date().toISOString(),
    source_url: 'https://example.com/mock.geojson',
    tiles: [
      {
        id: 'tile-1',
        pmtiles_url: 'https://example.com/mock.pmtiles',
        built_at: new Date().toISOString(),
        meta: { features: 120 },
      },
    ],
  },
];

export const mockSocialQueue = [
  {
    id: 'social-1',
    template: 'weekly-brief',
    payload: { headline: 'New intel drop', call_to_action: 'Read report' },
    status: 'rendered',
    scheduled_at: new Date(Date.now() + 3600_000).toISOString(),
    posted_at: null,
    error: null,
    assets: [
      { id: 'asset-1', url: 'https://example.com/social.png', kind: 'image' },
    ],
  },
];

export const mockPackages = [
  {
    id: 'pkg-1',
    title: 'Narco Atlas Weekly',
    status: 'pending',
    content_md: '# Narco Atlas',
    created_at: new Date().toISOString(),
    link: 'https://example.com/bundle.zip',
  },
];

export const mockBriefs = [
  {
    id: 'brief-1',
    title: 'Whiteboard → Product → Build',
    lanes: [{ lane: 'Research', summary: 'Gather sources' }],
    acceptance_criteria: ['Ship map tiles', 'Render social teaser'],
    owner: 'shadow.ops',
    status: 'draft',
    created_at: new Date().toISOString(),
  },
];

export const mockAuditLog = Array.from({ length: 5 }).map((_, idx) => ({
  ts: new Date(Date.now() - idx * 1800_000).toISOString(),
  actor: idx % 2 === 0 ? 'demo-key' : 'studio-admin',
  action: idx % 2 === 0 ? 'jobs.dispatch' : 'publish.package',
  resource: idx % 2 === 0 ? 'jobs' : 'packages/pkg-1',
  meta: { detail: 'Mock audit event' },
}));
