import { z } from 'zod';

export const quoteSchema = z.object({
  symbol: z.string(),
  price: z.number(),
  open: z.number().nullable(),
  high: z.number().nullable(),
  low: z.number().nullable(),
  previousClose: z.number().nullable(),
  change: z.number().nullable(),
  changePercent: z.number().nullable(),
  volume: z.number().nullable(),
  currency: z.string().default('USD'),
  asOf: z.string()
});

export const timeseriesPointSchema = z.object({
  time: z.string(),
  open: z.number().nullable(),
  high: z.number().nullable(),
  low: z.number().nullable(),
  close: z.number().nullable(),
  volume: z.number().nullable()
});

export const timeseriesSchema = z.object({
  symbol: z.string(),
  interval: z.string(),
  start: z.string(),
  end: z.string(),
  points: z.array(timeseriesPointSchema)
});

export const companySchema = z.object({
  symbol: z.string(),
  name: z.string().nullable(),
  exchange: z.string().nullable(),
  industry: z.string().nullable(),
  website: z.string().nullable(),
  description: z.string().nullable(),
  ceo: z.string().nullable(),
  headquarters: z.string().nullable(),
  employees: z.number().nullable()
});

export type QuoteDTO = z.infer<typeof quoteSchema>;
export type TimeseriesDTO = z.infer<typeof timeseriesSchema>;
export type CompanyDTO = z.infer<typeof companySchema>;
