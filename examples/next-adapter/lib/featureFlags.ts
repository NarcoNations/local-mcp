const truthy = new Set(['1', 'true', 'yes', 'on']);

function isEnabled(value: string | undefined) {
  return value ? truthy.has(value.toLowerCase()) : false;
}

export const featureFlags = {
  jobsWorker: isEnabled(process.env.FF_JOBS_WORKER),
  costTelemetry: isEnabled(process.env.FF_COST_TELEMETRY),
  evals: isEnabled(process.env.FF_EVALS),
  mapPipeline: isEnabled(process.env.FF_MAP_PIPELINE),
  socialPipeline: isEnabled(process.env.FF_SOCIAL_PIPELINE),
};

export type FeatureFlagKey = keyof typeof featureFlags;

export function flagEnabled(key: FeatureFlagKey) {
  return featureFlags[key];
}

export function listFeatureFlags() {
  return { ...featureFlags };
}
