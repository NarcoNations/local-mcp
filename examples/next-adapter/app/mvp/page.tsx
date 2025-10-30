import { listBriefs } from '@/examples/next-adapter/lib/mvp/briefs';
import MvpConsole from '@/examples/next-adapter/app/mvp/runner';

export const revalidate = 10;

export default async function MvpPage() {
  const briefs = await listBriefs();
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-12">
      <header className="space-y-3 text-stone-100">
        <p className="text-xs uppercase tracking-wide text-emerald-300/80">Workroom → Product → Build</p>
        <h1 className="text-4xl font-semibold">Build Briefs</h1>
        <p className="max-w-2xl text-sm text-stone-400">
          Export workroom lanes into structured MVP briefs, generate starter kits, and hand off to job runners.
        </p>
      </header>
      <MvpConsole briefs={briefs} />
    </main>
  );
}
