const TRANSFORM_CREDIT_COST_FREE = 3;
const TRANSFORM_CREDIT_COST_PRO = 1;

/** Credits consumed per generated image (1 credit each). */
export function getGenerationCreditCost(noOfOutputs: number): number {
  return Math.max(1, noOfOutputs);
}

/** Credits for upscale / colorize / revive / remove-bg transforms. */
export function getTransformCreditCost(isPro: boolean): number {
  return isPro ? TRANSFORM_CREDIT_COST_PRO : TRANSFORM_CREDIT_COST_FREE;
}
