export interface PromptDefinition {
  id: string;
  label: string;
  description: string;
  template: string;
  tags: string[];
}

export const promptsMock: PromptDefinition[] = [
  {
    id: 'launch-blueprint',
    label: 'Launch blueprint',
    description: 'Generate a go-to-market blueprint for the next Narco Nations drop.',
    template:
      'You are the director of shadow operations. Outline launch motions for {{product}} targeting {{audience}}. Include stages, rituals, and contingencies.',
    tags: ['strategy', 'ops'],
  },
  {
    id: 'intel-brief',
    label: 'Intel brief',
    description: 'Summarize field intel into a crisp two-minute readout.',
    template:
      'Condense the following intel feed into a brief. Flag risks, opportunities, and recommended counter-moves. Feed: {{input}}',
    tags: ['intel', 'summary'],
  },
  {
    id: 'social-script',
    label: 'Social pulse script',
    description: 'Draft a short-form social script with hooks, CTA, and loops.',
    template:
      'Write a social script about {{topic}} using Narco Nations tone. Include: hook, beats, CTA, and retention loop.',
    tags: ['social', 'creative'],
  },
];
