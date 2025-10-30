import { USE_MOCKS } from "@/config/env";
import { dashboardMock } from "@/mocks/dashboard";
import type { DashboardData } from "@/types/dashboard";

export async function getDashboardData(): Promise<DashboardData> {
  if (USE_MOCKS) {
    return dashboardMock;
  }

  try {
    const { sbServer } = await import("@/examples/next-adapter/lib/supabase/server");
    const supabase = sbServer();

    const [{ data: events }, { data: knowledge }, { count: conversationsCount }, { count: messagesCount }] = await Promise.all([
      supabase
        .from("events")
        .select("id, source, kind, title, ts, meta", { count: "exact" })
        .order("ts", { ascending: false })
        .limit(20),
      supabase.from("knowledge").select("id, slug, title, created_at").order("created_at", { ascending: false }).limit(8),
      supabase.from("conversations").select("id", { count: "exact", head: true }),
      supabase.from("messages").select("id", { count: "exact", head: true }),
    ]);

    const historian = (events ?? []).slice(0, 10).map((event) => ({
      id: event.id as string,
      source: String(event.source ?? "system"),
      kind: String(event.kind ?? "event"),
      title: String(event.title ?? ""),
      timestamp: String(event.ts ?? new Date().toISOString()),
    }));

    const ingest = (events ?? [])
      .filter((event) => String(event.kind ?? "").startsWith("ingest"))
      .slice(0, 5)
      .map((event) => ({
        id: event.id as string,
        slug: (event.meta as any)?.slug ?? "unknown", 
        files: Number((event.meta as any)?.count ?? 0),
        storage: Boolean((event.meta as any)?.storage ?? false),
        createdAt: String(event.ts ?? new Date().toISOString()),
      }));

    const knowledgeList = (knowledge ?? []).map((row) => ({
      id: row.id as string,
      slug: row.slug,
      title: row.title ?? row.slug,
      createdAt: row.created_at as string,
    }));

    return {
      quickActions: dashboardMock.quickActions,
      historian,
      ingest,
      knowledge: knowledgeList,
      corpus: {
        conversations: conversationsCount ?? 0,
        messages: messagesCount ?? 0,
      },
    };
  } catch (error) {
    console.error("dashboard data fallback", error);
    return dashboardMock;
  }
}
