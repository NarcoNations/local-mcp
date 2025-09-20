const searchForm = document.getElementById("search-form");
const searchQuery = document.getElementById("search-query");
const searchStatus = document.getElementById("search-status");
const searchK = document.getElementById("search-k");
const searchAlpha = document.getElementById("search-alpha");
const alphaValue = document.getElementById("alpha-value");
const filterTypes = document.getElementById("filter-types");
const resultsList = document.getElementById("results");
const docViewer = document.getElementById("doc-viewer");
const statsGrid = document.getElementById("stats-grid");
const reindexForm = document.getElementById("reindex-form");
const reindexPaths = document.getElementById("reindex-paths");
const reindexStatus = document.getElementById("reindex-status");
const watchForm = document.getElementById("watch-form");
const watchPaths = document.getElementById("watch-paths");
const watchStatus = document.getElementById("watch-status");
const importForm = document.getElementById("import-form");
const importExport = document.getElementById("import-export");
const importOut = document.getElementById("import-out");
const importStatus = document.getElementById("import-status");
const logStream = document.getElementById("log-stream");
const searchPrimary = document.getElementById("search-primary");

const state = {
  results: [],
  selectedIndex: null,
  log: [],
  logLimit: 200,
};

function setStatus(el, message, type) {
  if (!el) return;
  el.textContent = message;
  el.classList.remove("error", "success");
  if (type) {
    el.classList.add(type);
  }
}

async function fetchJSON(url, { method = "GET", body } = {}) {
  const opts = {
    method,
    headers: { "Content-Type": "application/json" },
  };
  if (body !== undefined) {
    opts.body = JSON.stringify(body);
  }
  const res = await fetch(url, opts);
  if (!res.ok) {
    let message = res.statusText;
    try {
      const data = await res.json();
      if (data?.error) message = data.error;
    } catch {}
    throw new Error(message);
  }
  if (res.status === 204) return null;
  return res.json();
}

function getSelectedTypes() {
  return Array.from(filterTypes.querySelectorAll("input[type='checkbox']"))
    .filter((box) => box.checked)
    .map((box) => box.value);
}

function parsePaths(raw) {
  return raw
    .split(/\n|,/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function formatScore(score) {
  if (typeof score !== "number" || Number.isNaN(score)) return "-";
  return `${(score * 100).toFixed(1)}%`;
}

function formatTime(timestamp) {
  if (!timestamp) return new Date().toLocaleTimeString();
  try {
    return new Date(timestamp).toLocaleTimeString();
  } catch {
    return new Date().toLocaleTimeString();
  }
}

function renderResults(result) {
  state.results = result.results ?? [];
  resultsList.innerHTML = "";
  if (!state.results.length) {
    const empty = document.createElement("p");
    empty.className = "status-message";
    empty.textContent = "No matches yet. Try broadening your query or reindexing.";
    resultsList.appendChild(empty);
    return;
  }
  const frag = document.createDocumentFragment();
  state.results.forEach((entry, index) => {
    const card = document.createElement("article");
    card.className = "result-card";
    if (state.selectedIndex === index) {
      card.classList.add("result-card--active");
    }
    card.dataset.index = String(index);
    const meta = document.createElement("div");
    meta.className = "result-card__meta";
    const fileName = entry.citation?.filePath ? entry.citation.filePath.split(/[/\\]/).pop() : "Unknown file";
    const pathLabel = document.createElement("span");
    pathLabel.textContent = fileName;
    const pageLabel = document.createElement("span");
    if (entry.citation?.page) {
      pageLabel.textContent = `Page ${entry.citation.page}`;
    }
    const scoreLabel = document.createElement("span");
    scoreLabel.textContent = `Relevance ${formatScore(entry.score ?? 0)}`;
    meta.append(pathLabel, scoreLabel);
    if (pageLabel.textContent) meta.appendChild(pageLabel);

    const snippet = document.createElement("p");
    snippet.className = "result-card__snippet";
    snippet.textContent = entry.citation?.snippet || entry.text || "No snippet available.";

    const actions = document.createElement("div");
    actions.className = "result-actions";

    const openBtn = document.createElement("button");
    openBtn.type = "button";
    openBtn.dataset.action = "open-doc";
    openBtn.dataset.index = String(index);
    openBtn.textContent = "Open source";

    const copyBtn = document.createElement("button");
    copyBtn.type = "button";
    copyBtn.className = "secondary";
    copyBtn.dataset.action = "copy-path";
    copyBtn.dataset.index = String(index);
    copyBtn.textContent = "Copy path";

    actions.append(openBtn, copyBtn);
    card.append(meta, snippet, actions);
    frag.appendChild(card);
  });
  resultsList.appendChild(frag);
}

function renderDoc(doc, context) {
  docViewer.innerHTML = "";
  const header = document.createElement("div");
  header.className = "doc-viewer__header";

  const title = document.createElement("h3");
  const fileName = context?.citation?.filePath ? context.citation.filePath.split(/[/\\]/).pop() : "Document";
  title.textContent = fileName;

  const path = document.createElement("div");
  path.className = "doc-viewer__path";
  path.textContent = context?.citation?.filePath ?? "";

  const meta = document.createElement("div");
  meta.className = "result-card__meta";
  if (context?.citation?.page) {
    const page = document.createElement("span");
    page.textContent = `Page ${context.citation.page}`;
    meta.appendChild(page);
  }
  const score = document.createElement("span");
  score.textContent = `Score ${formatScore(context?.score ?? 0)}`;
  meta.appendChild(score);

  header.append(title, path, meta);

  if (context?.citation?.snippet) {
    const highlight = document.createElement("div");
    highlight.className = "doc-viewer__snippet";
    highlight.textContent = context.citation.snippet;
    docViewer.append(header, highlight);
  } else {
    docViewer.appendChild(header);
  }

  const textBlock = document.createElement("pre");
  textBlock.className = "doc-viewer__text";
  textBlock.textContent = doc?.text?.trim() ? doc.text : "Document text is empty.";
  docViewer.appendChild(textBlock);
}

function renderStats(stats) {
  statsGrid.innerHTML = "";
  if (!stats) return;
  const files = Object.keys(stats.files ?? {}).length;
  const chunks = stats.chunks ?? 0;
  const embeddings = stats.embeddingsCached ?? 0;
  const lastIndexed = stats.lastIndexedAt ? new Date(stats.lastIndexedAt).toLocaleString() : "—";
  const byType = stats.byType ?? {};

  const entries = [
    { label: "Files indexed", value: files.toLocaleString() },
    { label: "Chunks", value: chunks.toLocaleString() },
    { label: "Embeddings", value: embeddings.toLocaleString() },
    { label: "Last index", value: lastIndexed },
  ];

  entries.forEach((entry) => {
    const card = document.createElement("div");
    card.className = "stat-card";
    const value = document.createElement("div");
    value.className = "stat-card__value";
    value.textContent = entry.value;
    const label = document.createElement("div");
    label.className = "stat-card__label";
    label.textContent = entry.label;
    card.append(value, label);
    statsGrid.appendChild(card);
  });

  const typesCard = document.createElement("div");
  typesCard.className = "stat-card";
  const typeTitle = document.createElement("div");
  typeTitle.className = "stat-card__label";
  typeTitle.textContent = "By type";
  const typeList = document.createElement("div");
  typeList.className = "stat-card__value";
  typeList.style.fontSize = "1rem";
  const summaries = Object.entries(byType)
    .filter(([, count]) => count)
    .map(([type, count]) => `${type}: ${count}`);
  typeList.textContent = summaries.length ? summaries.join("  ·  ") : "No files indexed";
  typesCard.append(typeList, typeTitle);
  statsGrid.appendChild(typesCard);
}

function pushLog(entry) {
  state.log.unshift(entry);
  if (state.log.length > state.logLimit) {
    state.log = state.log.slice(0, state.logLimit);
  }
  renderLog();
}

function renderLog() {
  logStream.innerHTML = "";
  const frag = document.createDocumentFragment();
  state.log.forEach((entry) => {
    const item = document.createElement("article");
    item.className = "log-entry";

    const header = document.createElement("div");
    header.className = "log-entry__header";

    const type = document.createElement("span");
    type.className = "log-entry__type";
    type.textContent = entry.type ?? "event";

    const time = document.createElement("span");
    time.textContent = formatTime(entry.timestamp);

    header.append(type, time);

    const body = document.createElement("div");
    body.className = "log-entry__body";
    const message = entry.message || JSON.stringify(entry.detail ?? {});
    body.textContent = message;

    if (entry.detail && Object.keys(entry.detail).length > 0) {
      const pre = document.createElement("pre");
      pre.style.margin = "0";
      pre.style.whiteSpace = "pre-wrap";
      pre.style.fontFamily = "JetBrains Mono, SFMono-Regular, Consolas, monospace";
      pre.style.fontSize = "0.75rem";
      pre.textContent = JSON.stringify(entry.detail, null, 2);
      body.appendChild(pre);
    }

    item.append(header, body);
    frag.appendChild(item);
  });
  logStream.appendChild(frag);
}

async function runSearch() {
  const query = searchQuery.value.trim();
  if (!query) return;
  setStatus(searchStatus, "Searching…");
  try {
    const payload = {
      query,
      k: Number(searchK.value) || 8,
      alpha: Number(searchAlpha.value),
    };
    const types = getSelectedTypes();
    if (types.length && types.length < filterTypes.querySelectorAll("input").length) {
      payload.filters = { type: types };
    }
    const result = await fetchJSON("/api/search", { method: "POST", body: payload });
    renderResults(result);
    if (result.results?.length) {
      setStatus(searchStatus, `${result.results.length} result(s) ready.`, "success");
    } else {
      setStatus(searchStatus, "No results yet.");
    }
  } catch (err) {
    console.error(err);
    setStatus(searchStatus, err.message || "Search failed", "error");
  }
}

async function loadDoc(index) {
  const result = state.results[index];
  if (!result) return;
  state.selectedIndex = index;
  resultsList.querySelectorAll(".result-card").forEach((card) => card.classList.remove("result-card--active"));
  const card = resultsList.querySelector(`[data-index="${index}"]`);
  if (card) {
    card.classList.add("result-card--active");
  }
  setStatus(searchStatus, "Fetching document…");
  try {
    const payload = { path: result.citation?.filePath };
    if (result.citation?.page) payload.page = result.citation.page;
    const doc = await fetchJSON("/api/get-doc", { method: "POST", body: payload });
    renderDoc(doc, result);
    setStatus(searchStatus, "Document loaded.", "success");
  } catch (err) {
    console.error(err);
    setStatus(searchStatus, err.message || "Failed to load document", "error");
  }
}

function setupResultsEvents() {
  resultsList.addEventListener("click", async (event) => {
    const target = event.target instanceof HTMLElement ? event.target.closest("button[data-action]") : null;
    if (!target) return;
    const index = Number(target.dataset.index);
    if (Number.isNaN(index)) return;
    if (target.dataset.action === "open-doc") {
      await loadDoc(index);
    } else if (target.dataset.action === "copy-path") {
      const path = state.results[index]?.citation?.filePath;
      if (!path) return;
      if (navigator.clipboard) {
        try {
          await navigator.clipboard.writeText(path);
          setStatus(searchStatus, "Path copied to clipboard.", "success");
        } catch (err) {
          console.error(err);
          setStatus(searchStatus, "Unable to copy path", "error");
        }
      }
    }
  });
}

async function refreshStats() {
  try {
    const stats = await fetchJSON("/api/stats");
    renderStats(stats);
  } catch (err) {
    console.error(err);
    setStatus(searchStatus, "Failed to fetch stats", "error");
  }
}

function setupForms() {
  searchForm.addEventListener("submit", (event) => {
    event.preventDefault();
    runSearch();
  });

  if (searchPrimary) {
    searchPrimary.addEventListener("click", () => {
      searchQuery.focus();
      searchQuery.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }

  searchAlpha.addEventListener("input", () => {
    alphaValue.textContent = Number(searchAlpha.value).toFixed(2);
  });

  reindexForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    setStatus(reindexStatus, "Reindexing…");
    try {
      const paths = parsePaths(reindexPaths.value || "");
      const body = { paths };
      const result = await fetchJSON("/api/reindex", { method: "POST", body });
      setStatus(reindexStatus, `Indexed ${result.indexed} chunk(s)`, "success");
      await refreshStats();
    } catch (err) {
      console.error(err);
      setStatus(reindexStatus, err.message || "Reindex failed", "error");
    }
  });

  watchForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    setStatus(watchStatus, "Starting watcher…");
    try {
      const paths = parsePaths(watchPaths.value || "");
      const body = { paths };
      const result = await fetchJSON("/api/watch", { method: "POST", body });
      const watching = result?.watching?.length ?? 0;
      setStatus(watchStatus, `Watching ${watching} path(s)`, "success");
    } catch (err) {
      console.error(err);
      setStatus(watchStatus, err.message || "Watch failed", "error");
    }
  });

  importForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const exportPath = importExport.value.trim();
    if (!exportPath) {
      setStatus(importStatus, "Export path is required", "error");
      return;
    }
    setStatus(importStatus, "Importing export…");
    try {
      const outDir = importOut.value.trim();
      const body = { exportPath };
      if (outDir) body.outDir = outDir;
      const result = await fetchJSON("/api/import-chatgpt", { method: "POST", body });
      setStatus(
        importStatus,
        `Imported ${result.filesWritten ?? 0} files into ${result.outDir || outDir || "output"}.`,
        "success"
      );
      await refreshStats();
    } catch (err) {
      console.error(err);
      setStatus(importStatus, err.message || "Import failed", "error");
    }
  });
}

function setupEventStream() {
  if (!window.EventSource) return;
  const source = new EventSource("/api/events");
  source.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      pushLog(data);
    } catch {}
  };
  source.onerror = () => {
    pushLog({ type: "warning", message: "Event stream interrupted", timestamp: Date.now() });
  };
  pushLog({ type: "startup", message: "Event stream connected", timestamp: Date.now() });
}

async function init() {
  setupForms();
  setupResultsEvents();
  setupEventStream();
  await refreshStats();
}

init().catch((err) => {
  console.error(err);
  setStatus(searchStatus, "Failed to initialise UI", "error");
});
