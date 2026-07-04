/** Credits consumed per generated image (1 credit each). */
export function getGenerationCreditCost(noOfOutputs: number): number {
  return Math.max(1, noOfOutputs);
}
