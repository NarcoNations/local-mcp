import EvalLab from '@/examples/next-adapter/app/evals/ui';
import { DATASETS } from '@/examples/next-adapter/lib/evals/datasets';
import { featureFlags } from '@/examples/next-adapter/lib/featureFlags';

export default function EvalsPage() {
  return <EvalLab datasets={DATASETS} enabled={featureFlags.FF_EVALS} />;
}
