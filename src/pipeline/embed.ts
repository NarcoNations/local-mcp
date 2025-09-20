import { pipeline } from "@xenova/transformers";
import { logger } from "../utils/logger.js";

let extractorPromise: Promise<any> | null = null;
let statusCallback: ((status: "loading" | "ready") => void) | null = null;
let isLoading = false;
let isReady = false;

export function onModelStatus(cb: (status: "loading" | "ready") => void) {
  statusCallback = cb;
  if (isLoading || extractorPromise) {
    statusCallback?.("loading");
  }
  if (isReady) {
    statusCallback?.("ready");
  }
}

async function getExtractor(model: string): Promise<any> {
  if (!extractorPromise) {
    isLoading = true;
    statusCallback?.("loading");
    extractorPromise = pipeline("feature-extraction", model).then((pipe) => {
      isReady = true;
      isLoading = false;
      statusCallback?.("ready");
      logger.info("embedding-model-ready", { model });
      return pipe;
    });
  }
  return extractorPromise;
}

export async function embedText(text: string, model: string): Promise<Float32Array> {
  const extractor = await getExtractor(model);
  const output = await extractor(text, { pooling: "mean", normalize: true });
  if (Array.isArray(output)) {
    const array = output[0] as number[];
    return Float32Array.from(array);
  }
  if (output?.data) {
    return Float32Array.from(output.data as number[]);
  }
  const values = (output as number[]) ?? [];
  return Float32Array.from(values);
}
