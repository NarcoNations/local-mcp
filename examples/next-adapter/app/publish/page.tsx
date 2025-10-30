import PublishBoard from '@/examples/next-adapter/app/publish/publish-board';
import { listPublishPackages } from '@/examples/next-adapter/lib/mcp/publish';

export const revalidate = 10;

export default async function PublishPage() {
  const packages = await listPublishPackages();
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-12">
      <header className="space-y-3 text-stone-100">
        <p className="text-xs uppercase tracking-wide text-emerald-300/80">MCP :: NarcoNations</p>
        <h1 className="text-4xl font-semibold">Publish Packages</h1>
        <p className="max-w-2xl text-sm text-stone-400">
          Review staged bundles before handing off to the public site. Approval triggers policy re-checks and Historian logs.
        </p>
      </header>
      <PublishBoard packages={packages} />
    </main>
  );
}
