import { Buffer } from "node:buffer";
import { get_encoding, Tiktoken } from "@dqbd/tiktoken";

let encoder: Tiktoken | null = null;

export function getEncoder(): Tiktoken {
  if (!encoder) {
    encoder = get_encoding("cl100k_base");
  }
  return encoder;
}

export function countTokens(text: string): number {
  const enc = getEncoder();
  return enc.encode(text).length;
}

export function decodeTokens(tokens: Uint32Array): string {
  const enc = getEncoder();
  const decoded = enc.decode(tokens);
  if (typeof decoded === "string") {
    return decoded;
  }
  return Buffer.from(decoded).toString("utf8");
}
