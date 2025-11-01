export type FeatureFlag =
  | 'FF_JOBS_WORKER'
  | 'FF_COST_TELEMETRY'
  | 'FF_EVALS'
  | 'FF_MAP_PIPELINE'
  | 'FF_SOCIAL_PIPELINE';

const defaultState: Record<FeatureFlag, boolean> = {
  FF_JOBS_WORKER: false,
  FF_COST_TELEMETRY: false,
  FF_EVALS: false,
  FF_MAP_PIPELINE: false,
  FF_SOCIAL_PIPELINE: false,
};

function resolveFlag(name: FeatureFlag): boolean {
  const raw = process.env[name];
  if (!raw) return defaultState[name];
  return raw.toLowerCase() === 'true' || raw === '1';
}

export const featureFlags: Record<FeatureFlag, boolean> = {
  FF_JOBS_WORKER: resolveFlag('FF_JOBS_WORKER'),
  FF_COST_TELEMETRY: resolveFlag('FF_COST_TELEMETRY'),
  FF_EVALS: resolveFlag('FF_EVALS'),
  FF_MAP_PIPELINE: resolveFlag('FF_MAP_PIPELINE'),
  FF_SOCIAL_PIPELINE: resolveFlag('FF_SOCIAL_PIPELINE'),
};

export const isFlagEnabled = (name: FeatureFlag) => featureFlags[name];
