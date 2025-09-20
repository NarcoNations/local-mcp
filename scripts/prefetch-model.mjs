import { pipeline } from "@xenova/transformers";
const model = process.env.MODEL || "Xenova/all-MiniLM-L6-v2";
console.log(JSON.stringify({ level: "info", msg: "prefetch-start", model }));
const extractor = await pipeline("feature-extraction", model);
await extractor("warm start", { pooling: "mean", normalize: true });
console.log(JSON.stringify({ level: "info", msg: "prefetch-complete", model }));
