import PromptLibraryClient from './view';
import { promptLibrary } from '@/examples/next-adapter/data/prompts';

export default function PromptLibraryPage() {
  return <PromptLibraryClient prompts={promptLibrary} />;
}
