import type { z } from "zod";
import { GetDocInput } from "../store/schema.js";
import { getDocument } from "../store/store.js";

type GetDocArgs = z.infer<typeof GetDocInput>;

export async function getDoc(input: unknown) {
  const parsed: GetDocArgs = GetDocInput.parse(input);
  return getDocument(parsed.path, parsed.page);
}
