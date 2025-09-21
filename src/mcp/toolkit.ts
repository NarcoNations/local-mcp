import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { env } from "../config/env.js";
import { importPaths } from "../services/import-service.js";
import { indexPendingDocuments } from "../services/index-service.js";
import { searchCorpus } from "../services/search-service.js";
import { createLink, getDocumentDetail, listSources } from "../services/document-service.js";
import { logger } from "../utils/logger.js";

const SearchFiltersShape = {
  author: z.string().optional(),
  content_type: z.string().optional(),
  slug: z.string().optional(),
  tag: z.string().optional(),
  date_from: z.string().optional(),
  date_to: z.string().optional(),
} as const;

const SearchFiltersSchema = z.object(SearchFiltersShape);

const SearchCorpusShape = {
  query: z.string().min(1),
  top_k: z.number().int().positive().max(32).optional(),
  filters: SearchFiltersSchema.optional(),
} as const;

const SearchCorpusSchema = z.object(SearchCorpusShape);

const AddDocumentsShape = {
  paths: z.array(z.string().min(1)).nonempty().optional(),
} as const;

const AddDocumentsSchema = z.object(AddDocumentsShape);

const LinkItemsShape = {
  from_id: z.string().min(1),
  to_id: z.string().min(1),
  relation: z.enum(["supports", "contradicts", "related"]),
  note: z.string().optional(),
} as const;

const LinkItemsSchema = z.object(LinkItemsShape);

const GetDocumentShape = {
  document_id: z.string().min(1),
} as const;

const GetDocumentSchema = z.object(GetDocumentShape);

const ListSourcesShape = {
  kind: z.enum(["chat_export", "file", "url"]).optional(),
} as const;

const ListSourcesSchema = z.object(ListSourcesShape);

export function registerMcpTools(server: McpServer): void {
  server.registerTool(
    "search_corpus",
    {
      title: "Search indexed corpus",
      description: "Hybrid search across imported documents with citation metadata.",
      inputSchema: SearchCorpusShape,
      annotations: { readOnlyHint: true, title: "Search Corpus" },
    },
    async (input) => {
      const args = SearchCorpusSchema.parse(input);
      const filters = args.filters
        ? {
            author: args.filters.author,
            contentType: args.filters.content_type,
            slug: args.filters.slug,
            tag: args.filters.tag,
            dateFrom: args.filters.date_from ? new Date(args.filters.date_from) : undefined,
            dateTo: args.filters.date_to ? new Date(args.filters.date_to) : undefined,
          }
        : {};
      const response = await searchCorpus(args.query, args.top_k ?? env.RESULTS_TOPK, filters);
      const structured = response as unknown as Record<string, unknown>;
      return {
        structuredContent: structured,
        content: [
          { type: "text" as const, text: JSON.stringify(response, null, 2) },
        ],
      };
    }
  );

  server.registerTool(
    "add_documents",
    {
      title: "Add documents",
      description: "Import and index documents from local paths.",
      inputSchema: AddDocumentsShape,
      annotations: { readOnlyHint: false, title: "Add Documents" },
    },
    async (input) => {
      const args = AddDocumentsSchema.parse(input);
      if (!args.paths?.length) {
        throw new Error("paths array is required");
      }
      const importSummary = await importPaths(args.paths);
      const indexSummary = await indexPendingDocuments();
      const payload = {
        import: importSummary,
        index: indexSummary,
      };
      logger.info("mcp-add-documents", payload);
      return {
        structuredContent: payload,
        content: [{ type: "text" as const, text: JSON.stringify(payload, null, 2) }],
      };
    }
  );

  server.registerTool(
    "link_items",
    {
      title: "Link chunks",
      description: "Create a relationship between two chunks in the corpus.",
      inputSchema: LinkItemsShape,
      annotations: { readOnlyHint: false, title: "Link Items" },
    },
    async (input) => {
      const args = LinkItemsSchema.parse(input);
      await createLink({
        fromId: args.from_id,
        toId: args.to_id,
        relation: args.relation,
        note: args.note,
      });
      return {
        structuredContent: { ok: true } as Record<string, unknown>,
        content: [{ type: "text" as const, text: "Link created" }],
      };
    }
  );

  server.registerTool(
    "get_document",
    {
      title: "Get document detail",
      description: "Retrieve document metadata and chunk sections.",
      inputSchema: GetDocumentShape,
      annotations: { readOnlyHint: true, title: "Get Document" },
    },
    async (input) => {
      const args = GetDocumentSchema.parse(input);
      const detail = await getDocumentDetail(args.document_id);
      if (!detail) {
        throw new Error(`Document ${args.document_id} not found`);
      }
      const structured = {
        document: detail.document,
        sections: detail.sections,
      } as Record<string, unknown>;
      return {
        structuredContent: structured,
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({ ...detail, sections: detail.sections.slice(0, 1) }, null, 2),
          },
        ],
      };
    }
  );

  server.registerTool(
    "list_sources",
    {
      title: "List sources",
      description: "List imported sources with optional filtering.",
      inputSchema: ListSourcesShape,
      annotations: { readOnlyHint: true, title: "List Sources" },
    },
    async (input) => {
      const args = ListSourcesSchema.parse(input ?? {});
      const sources = await listSources(args.kind);
      return {
        structuredContent: { sources } as Record<string, unknown>,
        content: [{ type: "text" as const, text: JSON.stringify({ sources }, null, 2) }],
      };
    }
  );
}
