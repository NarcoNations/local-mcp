export type EvalSample = {
  id: string;
  prompt: string;
  expected: string;
};

export type EvalDataset = {
  id: string;
  name: string;
  description: string;
  samples: EvalSample[];
};

// EDIT HERE: add or adjust datasets for eval lab runs.
export const DATASETS: EvalDataset[] = [
  {
    id: 'baseline-copy',
    name: 'Baseline Copy Tone',
    description: 'Short-form tone + accuracy prompts for NarcoNations messaging.',
    samples: [
      {
        id: 'welcome',
        prompt: 'Craft a 2 sentence welcome message for NarcoNations that mentions community safety.',
        expected: 'Welcome to NarcoNations, where community safety is paramount. Explore responsibly and stay informed.',
      },
      {
        id: 'cta',
        prompt: 'Write a direct CTA inviting activists to join the VibeLabz watch briefing.',
        expected: 'Join the VibeLabz watch briefing to coordinate activists and keep our cities resilient.',
      },
    ],
  },
];

export function getDataset(id: string) {
  return DATASETS.find((d) => d.id === id);
}
