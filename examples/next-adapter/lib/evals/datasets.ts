export type EvalSample = {
  prompt: string;
  expected: string;
};

export type EvalDataset = {
  id: string;
  name: string;
  type: 'qa' | 'copy' | 'analysis';
  samples: EvalSample[];
  judgePrompt?: string;
};

export const DATASETS: EvalDataset[] = [
  {
    id: 'baseline.qa',
    name: 'Baseline QA (NarcoNations Core)',
    type: 'qa',
    samples: [
      {
        prompt: 'What is VibeOS designed to orchestrate?',
        expected: 'VibeOS coordinates cross-department studio workflows across NarcoNations.',
      },
      {
        prompt: 'Which feature flag enables cost telemetry?',
        expected: 'Set FF_COST_TELEMETRY=true to enable cost tracking.',
      },
      {
        prompt: 'Name the pipeline for map tiles.',
        expected: 'The Crime Map pipeline builds PMTiles via map:build jobs.',
      },
    ],
    judgePrompt:
      'Act as an evaluation judge. Determine if the candidate response fully answers the prompt with accurate NarcoNations context.',
  },
];

export function getDataset(id: string) {
  return DATASETS.find((dataset) => dataset.id === id);
}
