import { searchEverything } from '../../src/data/search';
import { SearchView } from '../../src/components/search/SearchView';

interface PageProps {
  searchParams?: { q?: string };
}

export default async function Page({ searchParams }: PageProps) {
  const initialQuery = typeof searchParams?.q === 'string' ? searchParams.q : '';
  const initialResults = initialQuery ? await searchEverything(initialQuery) : [];
  return <SearchView initialQuery={initialQuery} initialResults={initialResults} />;
}
