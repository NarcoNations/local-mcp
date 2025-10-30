import { PromptDefinition } from '../types/systems';

export const mockPrompts: PromptDefinition[] = [
  {
    id: 'prompt-ops-brief',
    name: 'Ops Brief Skeleton',
    description: 'Summarize mission-critical updates for ops leads.',
    body: 'You are VibeOS historian. Summarize the last 24h events across ingest, knowledge, and search.',
  },
  {
    id: 'prompt-social-drop',
    name: 'Social Drop Pulse',
    description: 'Craft a multi-format narrative pulse for the next drop.',
    body: 'Generate three punchy narrative hooks for Drop {dropNumber}. Include action verbs and a call to action.',
  },
  {
    id: 'prompt-research',
    name: 'Research Fact Sweep',
    description: 'Aggregate facts from the knowledge graph with citations.',
    body: 'Given the query {query}, produce a fact table with sources from knowledge and historian events.',
  },
];
