import { Sparkles } from "lucide-react";

import { DashboardClient } from "@/components/dashboard/DashboardClient";
import { Pill } from "@/components/Pill";
import { Surface } from "@/components/Surface";
import { getDashboardData } from "@/data/dashboard";

export default async function Page() {
  const data = await getDashboardData();

  return (
    <div className="space-y-6">
      <Surface variant="glass" padding className="overflow-hidden">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <Pill tone="info" className="mb-3 w-fit bg-highlight/20 text-xs">
              All systems humming
            </Pill>
            <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">
              VibeOS Ultimate — Adaptive operations dashboard
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted">
              Monitor ingest, knowledge, search, historian, and social experiments in one cinematic control surface. Keyboard-first. Motion-aware. Ready for deployment.
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-highlight/40 bg-highlight/10 px-4 py-3 text-sm font-semibold text-highlight">
            <Sparkles className="h-5 w-5" aria-hidden />
            <span>// EDIT HERE — calibrate call-to-action copy</span>
          </div>
        </div>
      </Surface>
      <DashboardClient data={data} />
    </div>
  );
}
