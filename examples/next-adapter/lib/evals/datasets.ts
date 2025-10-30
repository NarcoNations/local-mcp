export type EvalSample = {
  input: string;
  expected: string;
};

export const DATASETS: Record<string, EvalSample[]> = {
  'baseline-qa': [
    { input: 'What is VibeOS?', expected: 'VibeOS is the orchestration stack for Narco Nations.' },
    { input: 'Who runs the Historian?', expected: 'Historian captures provenance across teams.' },
  ],
};
