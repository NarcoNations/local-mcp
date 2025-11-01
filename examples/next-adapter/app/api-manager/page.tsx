"use client";

import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import type { CSSProperties } from "react";

type ProviderModel = { id: string; label?: string; description?: string | null };
type ProviderDescriptor = {
  id: string;
  type: string;
  label: string;
  description?: string;
  available: boolean;
  disabledReason?: string;
  models: ProviderModel[];
};

type LLMRunPayload = {
  task: string;
  prompt: string;
  model?: string;
  modelHint?: string;
  providerId?: string;
  useCache?: boolean;
};

type LLMRunResult = {
  providerId: string;
  providerLabel?: string;
  model: string;
  output: string;
  cached?: boolean;
  usage?: Record<string, unknown>;
};

type ApiResponse<T> = { ok: true; data: T } | { ok: false; error: string };

const API_BASE = process.env.NEXT_PUBLIC_MCP_HTTP_URL ?? "";

function apiUrl(path: string): string {
  if (!API_BASE) return path;
  return `${API_BASE.replace(/\/$/, "")}${path}`;
}

const pageStyle: CSSProperties = {
  display: "grid",
  gap: "24px",
  padding: "min(5vw, 48px) min(5vw, 32px)",
};

const responsivePanel: CSSProperties = {
  background: "rgba(15,23,42,0.03)",
  borderRadius: "20px",
  padding: "24px",
  display: "grid",
  gap: "16px",
  boxShadow: "0 25px 45px rgba(15,23,42,0.08)",
};

const providersGrid: CSSProperties = {
  display: "grid",
  gap: "16px",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
};

const providerCard: CSSProperties = {
  background: "white",
  borderRadius: "16px",
  padding: "18px",
  display: "grid",
  gap: "10px",
  border: "1px solid rgba(148,163,184,0.18)",
  boxShadow: "0 14px 28px rgba(15,23,42,0.08)",
};

const formStyle: CSSProperties = {
  display: "grid",
  gap: "16px",
};

const labelStyle: CSSProperties = {
  display: "grid",
  gap: "8px",
  fontWeight: 600,
  color: "#0f172a",
};

const inputStyle: CSSProperties = {
  borderRadius: "12px",
  border: "1px solid rgba(148,163,184,0.4)",
  padding: "12px",
  fontSize: "1rem",
  background: "white",
  minHeight: "48px",
  width: "100%",
};

const buttonStyle: CSSProperties = {
  borderRadius: "12px",
  border: "none",
  padding: "14px 18px",
  background: "linear-gradient(135deg, rgba(79,70,229,0.95), rgba(59,130,246,0.95))",
  color: "white",
  fontWeight: 600,
  cursor: "pointer",
  transition: "transform 0.15s ease, box-shadow 0.2s ease",
  boxShadow: "0 18px 35px rgba(59,130,246,0.35)",
};

const resultPanel: CSSProperties = {
  background: "rgba(15,23,42,0.8)",
  color: "white",
  borderRadius: "18px",
  padding: "20px",
  fontFamily: "'JetBrains Mono', 'SFMono-Regular', Menlo, Consolas, monospace",
  minHeight: "160px",
  whiteSpace: "pre-wrap",
  wordBreak: "break-word",
  overflowWrap: "anywhere",
};

export default function ApiManagerPage() {
  const [providers, setProviders] = useState<ProviderDescriptor[]>([]);
  const [loadingProviders, setLoadingProviders] = useState(false);
  const [providerError, setProviderError] = useState<string | null>(null);
  const [payload, setPayload] = useState<LLMRunPayload>({
    task: "summarize",
    prompt: "Summarize the current state of the Narco Nations research stack in three bullet points.",
    useCache: true,
  });
  const [result, setResult] = useState<LLMRunResult | null>(null);
  const [running, setRunning] = useState(false);
  const [runError, setRunError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProviders() {
      setLoadingProviders(true);
      setProviderError(null);
      try {
        const response = await fetch(apiUrl("/api/llm/providers"));
        const json = (await response.json()) as ApiResponse<ProviderDescriptor[]>;
        if (!json.ok) throw new Error(json.error);
        setProviders(json.data);
        if (!payload.providerId) {
          const firstAvailable = json.data.find((provider) => provider.available);
          setPayload((prev) => ({ ...prev, providerId: firstAvailable?.id }));
        }
      } catch (error) {
        setProviderError(error instanceof Error ? error.message : String(error));
      } finally {
        setLoadingProviders(false);
      }
    }
    void loadProviders();
  }, []);

  const handleChange = (field: keyof LLMRunPayload) => (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const isCheckbox = event.target.type === "checkbox";
    const rawValue = isCheckbox ? (event.target as HTMLInputElement).checked : event.target.value;
    const normalizedValue = !isCheckbox && rawValue === "" ? undefined : rawValue;
    setPayload((prev) => ({ ...prev, [field]: normalizedValue as never }));
  };

  const availableProviders = useMemo(() => providers.filter((provider) => provider.available), [providers]);

  async function handleRun(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setRunning(true);
    setRunError(null);
    setResult(null);
    try {
      const response = await fetch(apiUrl("/api/llm/run"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = (await response.json()) as ApiResponse<LLMRunResult>;
      if (!json.ok) throw new Error(json.error);
      setResult(json.data);
    } catch (error) {
      setRunError(error instanceof Error ? error.message : String(error));
    } finally {
      setRunning(false);
    }
  }

  return (
    <main style={pageStyle}>
      <header style={{ display: "grid", gap: "12px" }}>
        <p style={{ margin: 0, fontWeight: 600, color: "rgba(79,70,229,0.9)" }}>API Manager · Provider Router</p>
        <h1 style={{ margin: 0, fontSize: "clamp(2rem, 5vw, 3rem)", lineHeight: 1.1 }}>Route LLM work across hosted + local adapters</h1>
        <p style={{ margin: 0, maxWidth: "70ch", lineHeight: 1.6 }}>
          Discover available providers, inspect capabilities, and send routed tasks through the MCP HTTP bridge. The router picks
          providers using policy tiers and metadata hints while caching long-form work.
        </p>
      </header>

      <section style={responsivePanel}>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <h2 style={{ margin: 0, fontSize: "1.4rem" }}>Provider inventory</h2>
          <p style={{ margin: 0, color: "rgba(15,23,42,0.7)", lineHeight: 1.6 }}>
            Providers resolve secrets from env config and expose availability. Toggle tiers or hints in your requests to target
            specific adapters.
          </p>
        </div>
        {loadingProviders ? (
          <p style={{ margin: 0 }}>Loading providers…</p>
        ) : providerError ? (
          <p style={{ margin: 0, color: "#dc2626" }}>Failed to load providers: {providerError}</p>
        ) : (
          <div style={providersGrid}>
            {providers.map((provider) => (
              <article key={provider.id} style={providerCard}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px" }}>
                  <h3 style={{ margin: 0, fontSize: "1.1rem" }}>{provider.label}</h3>
                  <span
                    style={{
                      padding: "4px 10px",
                      borderRadius: "999px",
                      fontSize: "0.75rem",
                      background: provider.available ? "rgba(16,185,129,0.15)" : "rgba(248,113,113,0.15)",
                      color: provider.available ? "#047857" : "#b91c1c",
                      fontWeight: 600,
                    }}
                  >
                    {provider.available ? "Online" : "Offline"}
                  </span>
                </div>
                <p style={{ margin: 0, color: "rgba(15,23,42,0.7)", lineHeight: 1.5 }}>
                  {provider.description ?? "No description"}
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {provider.models.map((model) => (
                    <span
                      key={`${provider.id}-${model.id}`}
                      style={{
                        padding: "4px 8px",
                        borderRadius: "999px",
                        background: "rgba(59,130,246,0.12)",
                        color: "rgba(30,64,175,0.95)",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                      }}
                    >
                      {model.label ?? model.id}
                    </span>
                  ))}
                </div>
                {!provider.available && provider.disabledReason ? (
                  <p style={{ margin: 0, color: "#b91c1c", fontSize: "0.85rem" }}>{provider.disabledReason}</p>
                ) : null}
              </article>
            ))}
          </div>
        )}
      </section>

      <section style={responsivePanel}>
        <form onSubmit={handleRun} style={formStyle}>
          <div style={{ display: "grid", gap: "12px", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
            <label style={labelStyle}>
              Task
              <select value={payload.task} onChange={handleChange("task")} style={inputStyle}>
                <option value="summarize">Summarize</option>
                <option value="draft_copy">Draft copy</option>
                <option value="classify">Classify</option>
                <option value="analyze">Analyze</option>
                <option value="chat">Chat</option>
              </select>
            </label>
            <label style={labelStyle}>
              Provider
              <select
                value={payload.providerId ?? ""}
                onChange={handleChange("providerId")}
                style={inputStyle}
                disabled={!availableProviders.length}
              >
                <option value="">Auto (policy)</option>
                {availableProviders.map((provider) => (
                  <option key={provider.id} value={provider.id}>
                    {provider.label}
                  </option>
                ))}
              </select>
            </label>
            <label style={labelStyle}>
              Model hint
              <input
                value={payload.modelHint ?? ""}
                onChange={handleChange("modelHint")}
                placeholder="e.g. gpt-4o-mini or mock-local"
                style={inputStyle}
              />
            </label>
            <label style={{ ...labelStyle, alignItems: "center", gridTemplateColumns: "auto 1fr", gap: "12px" }}>
              <span>Cache output</span>
              <input
                type="checkbox"
                checked={payload.useCache ?? true}
                onChange={handleChange("useCache")}
                style={{ width: "20px", height: "20px" }}
              />
            </label>
          </div>

          <label style={labelStyle}>
            Prompt
            <textarea
              value={payload.prompt}
              onChange={handleChange("prompt")}
              rows={6}
              style={{ ...inputStyle, resize: "vertical" }}
            />
          </label>

          <button type="submit" style={buttonStyle} disabled={running}>
            {running ? "Routing…" : "Run via policy"}
          </button>
        </form>

        {runError ? <p style={{ margin: 0, color: "#dc2626" }}>{runError}</p> : null}
        {result ? (
          <article style={{ display: "grid", gap: "12px" }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center" }}>
              <span style={{ fontWeight: 600 }}>Provider:</span>
              <span>{result.providerLabel ?? result.providerId}</span>
              <span style={{ fontWeight: 600 }}>Model:</span>
              <span>{result.model}</span>
              {result.cached ? (
                <span style={{ padding: "4px 10px", borderRadius: "999px", background: "rgba(16,185,129,0.15)", color: "#047857" }}>
                  Cached
                </span>
              ) : null}
            </div>
            <pre style={resultPanel}>{result.output || "(empty response)"}</pre>
          </article>
        ) : null}
      </section>
    </main>
  );
}
