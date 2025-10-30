import { PromptLibraryView } from "../../../src/components/prompts/PromptLibraryView";
import { listPrompts } from "../../../src/data/prompts";

export default async function PromptLibraryPage() {
  const prompts = await listPrompts();
  return <PromptLibraryView prompts={prompts} />;
}
