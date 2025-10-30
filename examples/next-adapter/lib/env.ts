const toBool = (value?: string | null) => {
  if (!value) return false;
  switch (value.trim().toLowerCase()) {
    case '1':
    case 'true':
    case 'yes':
    case 'on':
      return true;
    default:
      return false;
  }
};

export const featureFlags = {
  jobsWorker: toBool(process.env.FF_JOBS_WORKER),
  costTelemetry: toBool(process.env.FF_COST_TELEMETRY),
  evals: toBool(process.env.FF_EVALS),
  mapPipeline: toBool(process.env.FF_MAP_PIPELINE),
  socialPipeline: toBool(process.env.FF_SOCIAL_PIPELINE),
};

export const runtimeFlags = {
  useMocks: toBool(process.env.USE_MOCKS),
};

export type FeatureFlag = keyof typeof featureFlags;

export function flagEnabled(flag: FeatureFlag) {
  return featureFlags[flag];
}

export function boolFromEnv(value?: string | null, fallback = false) {
  const parsed = toBool(value);
  if (!value) return fallback;
  return parsed;
}
