export interface KnowledgeEntry {
  id: string;
  slug: string;
  title: string;
  createdAt: string;
  files: number;
  status: 'indexed' | 'pending' | 'error';
}

export const knowledgeMock: KnowledgeEntry[] = [
  {
    id: 'kn-01',
    slug: 'founder-insights-2024',
    title: 'Founder Insights 2024',
    createdAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    files: 12,
    status: 'indexed',
  },
  {
    id: 'kn-02',
    slug: 'narco-lore-playbook',
    title: 'Narco Lore Playbook',
    createdAt: new Date(Date.now() - 1000 * 60 * 140).toISOString(),
    files: 7,
    status: 'indexed',
  },
  {
    id: 'kn-03',
    slug: 'contraband-supply-lines',
    title: 'Contraband Supply Lines',
    createdAt: new Date(Date.now() - 1000 * 60 * 200).toISOString(),
    files: 9,
    status: 'pending',
  },
  {
    id: 'kn-04',
    slug: 'intel-field-briefs',
    title: 'Intel Field Briefs',
    createdAt: new Date(Date.now() - 1000 * 60 * 320).toISOString(),
    files: 15,
    status: 'indexed',
  },
  {
    id: 'kn-05',
    slug: 'mvp-blueprints',
    title: 'MVP Blueprints',
    createdAt: new Date(Date.now() - 1000 * 60 * 480).toISOString(),
    files: 6,
    status: 'error',
  },
];
