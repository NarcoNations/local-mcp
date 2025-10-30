const flagCache: Record<string, boolean> = {};

function parseBoolean(value: string | undefined, fallback = false) {
  if (value === undefined) return fallback;
  const normalized = value.trim().toLowerCase();
  return ['1', 'true', 'yes', 'on', 'enable', 'enabled'].includes(normalized);
}

export function isFeatureEnabled(name: string, fallback = false) {
  if (flagCache[name] !== undefined) return flagCache[name];
  const enabled = parseBoolean(process.env[name], fallback);
  flagCache[name] = enabled;
  return enabled;
}

export const featureFlags = {
  jobsWorker: () => isFeatureEnabled('FF_JOBS_WORKER', false),
  costTelemetry: () => isFeatureEnabled('FF_COST_TELEMETRY', false),
  evals: () => isFeatureEnabled('FF_EVALS', false),
  mapPipeline: () => isFeatureEnabled('FF_MAP_PIPELINE', false),
  socialPipeline: () => isFeatureEnabled('FF_SOCIAL_PIPELINE', false),
};

export type FeatureFlagName =
  | 'FF_JOBS_WORKER'
  | 'FF_COST_TELEMETRY'
  | 'FF_EVALS'
  | 'FF_MAP_PIPELINE'
  | 'FF_SOCIAL_PIPELINE';

export function allFeatureFlags(): { name: FeatureFlagName; enabled: boolean }[] {
  return [
    { name: 'FF_JOBS_WORKER', enabled: featureFlags.jobsWorker() },
    { name: 'FF_COST_TELEMETRY', enabled: featureFlags.costTelemetry() },
    { name: 'FF_EVALS', enabled: featureFlags.evals() },
    { name: 'FF_MAP_PIPELINE', enabled: featureFlags.mapPipeline() },
    { name: 'FF_SOCIAL_PIPELINE', enabled: featureFlags.socialPipeline() },
  ];
}
