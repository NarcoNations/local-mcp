"use client";

import { useRef, useState } from "react";
import { Card } from "../../src/components/Card";
import { Toolbar } from "../../src/components/Toolbar";
import { useToast } from "../../src/components/Toast";

const MAX_FILE_SIZE = 200 * 1024 * 1024; // 200 MB

export default function IngestPage() {
  const [active, setActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { push } = useToast();

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const candidate = files[0];
    if (candidate.size > MAX_FILE_SIZE) {
      push({
        title: "File too large",
        description: "Keep uploads under 200MB for optimal conversion.",
        variant: "danger",
      });
      return;
    }
    setFile(candidate);
  };

  const submit = async () => {
    if (!file) {
      push({ title: "Select a file", description: "Drop a briefing archive or choose one to begin.", variant: "info" });
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/ingest/convert", { method: "POST", body: formData });
      if (!response.ok) {
        throw new Error(await response.text());
      }
      const result = await response.json();
      push({
        title: "Conversion queued",
        description: `Slug ${result.slug} with ${result.files?.length ?? 0} files. Track via Historian.`,
        variant: "success",
      });
      setFile(null);
      fileInputRef.current?.value && (fileInputRef.current.value = "");
    } catch (error) {
      push({
        title: "Conversion failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "danger",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Toolbar
        title="Ingest pipeline"
        description="Convert exports, field intel, and recon archives into VibeOS-ready artifacts."
        actions={
          <p className="text-xs text-muted">
            Need chat exports? <a href="/corpus" className="underline">Switch to Corpus</a>
          </p>
        }
      />
      <Card title="Upload intelligence" description="Drag and drop or browse to launch the pipeline." variant="elevated">
        <div
          onDragEnter={(event) => {
            event.preventDefault();
            setActive(true);
          }}
          onDragOver={(event) => event.preventDefault()}
          onDragLeave={(event) => {
            event.preventDefault();
            setActive(false);
          }}
          onDrop={(event) => {
            event.preventDefault();
            setActive(false);
            handleFiles(event.dataTransfer.files);
          }}
          className={`flex flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed px-6 py-16 text-center transition ${
            active ? "border-accent bg-accent-soft" : "border-border bg-surface"
          }`}
        >
          <IconCloud />
          <p className="text-sm font-semibold text-primary">Drop archive or intelligence bundle</p>
          <p className="text-xs text-muted">PDF, DOCX, ZIP, audio transcripts — max 200MB</p>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="focus-ring mt-4 inline-flex items-center gap-2 rounded-full border border-border bg-surface-elevated px-4 py-2 text-sm font-semibold text-primary"
          >
            Browse files
          </button>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={(event) => handleFiles(event.target.files)}
          />
        </div>
        {file ? (
          <div className="rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-primary">
            <p className="font-semibold">Ready to ingest</p>
            <p className="text-xs text-muted">{file.name} • {(file.size / (1024 * 1024)).toFixed(1)}MB</p>
          </div>
        ) : (
          <p className="text-xs text-muted">No file selected.</p>
        )}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-surface p-4 text-xs text-muted">
          <span>Converted archives appear in Historian instantly and feed Corpus & Knowledge.</span>
          <button
            type="button"
            onClick={submit}
            disabled={loading}
            className="focus-ring inline-flex items-center gap-2 rounded-full border border-border bg-accent-soft px-4 py-2 text-sm font-semibold text-primary disabled:opacity-60"
          >
            {loading ? "Converting..." : "Start conversion"}
          </button>
        </div>
      </Card>
    </div>
  );
}

function IconCloud() {
  return (
    <svg
      className="h-12 w-12 text-accent"
      viewBox="0 0 48 48"
      aria-hidden="true"
      focusable="false"
    >
      <path
        fill="currentColor"
        d="M30.5 12.2A10 10 0 0 0 11 19c0 .3 0 .7.1 1A8 8 0 0 0 12 36h24a7 7 0 0 0 1-14 10 10 0 0 0-6.5-9.8ZM26 26v6h-4v-6h-4l6-7 6 7Z"
      />
    </svg>
  );
}
