import { PromptsLibraryView } from '../../../src/components/prompts/PromptsLibraryView';
import { getPrompts } from '../../../src/data/prompts';

export default async function Page() {
  const prompts = await getPrompts();
  return <PromptsLibraryView prompts={prompts} />;
}
