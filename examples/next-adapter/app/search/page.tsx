import { SearchView } from "../../src/components/search/SearchView";
import { runSearch } from "../../src/data/search";

interface SearchPageProps {
  searchParams?: { q?: string };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const query = searchParams?.q ? String(searchParams.q) : "";
  const results = query ? await runSearch(query) : [];
  return <SearchView initialQuery={query} initialResults={results} />;
}
